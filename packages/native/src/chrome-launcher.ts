import { execSync, spawn } from 'child_process';
import * as http from 'http';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import logger from './logger';

export interface ChromeEndpoint {
  port: number;
  wsEndpoint: string;
}

// ── Ports to scan for an existing Chrome debug endpoint ──
const KNOWN_DEBUG_PORTS = [9222, 9223, 9224, 9229];

/**
 * Fetch JSON from an HTTP endpoint with a fast timeout.
 */
function fetchJson(url: string, timeoutMs = 500): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON from ${url}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

/**
 * Step 1: Scan known ports for an existing Chrome debug endpoint.
 * Returns immediately if found — no relaunch needed.
 */
export async function detectExistingDebugEndpoint(): Promise<ChromeEndpoint | null> {
  logger.info('Scanning for existing Chrome debug endpoint...');

  for (const port of KNOWN_DEBUG_PORTS) {
    try {
      const data = await fetchJson(`http://localhost:${port}/json/version`);
      const wsUrl = data['webSocketDebuggerUrl'] as string | undefined;
      if (wsUrl) {
        logger.info({ port, wsUrl }, 'Found existing Chrome debug endpoint');
        return { port, wsEndpoint: wsUrl };
      }
    } catch {
      // Port not responding — continue scanning
    }
  }

  logger.info('No existing debug endpoint found');
  return null;
}

/**
 * Get the default Chrome user data directory for the current OS.
 * This is where all profiles, cookies, sessions, and logins live.
 */
export function getDefaultProfilePath(): string {
  const home = os.homedir();
  const platform = process.platform;

  switch (platform) {
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', 'Google', 'Chrome');
    case 'win32':
      return path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    case 'linux':
      return path.join(home, '.config', 'google-chrome');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Find the Chrome executable path for the current OS.
 */
function getChromeExecutable(): string {
  const platform = process.platform;

  if (platform === 'darwin') {
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `${os.homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    throw new Error('Google Chrome not found on macOS');
  }

  if (platform === 'win32') {
    const paths = [
      path.join(process.env['PROGRAMFILES'] ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['LOCALAPPDATA'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    throw new Error('Google Chrome not found on Windows');
  }

  if (platform === 'linux') {
    const paths = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    throw new Error('Google Chrome not found on Linux');
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * Find a random available port by binding to port 0.
 */
function getRandomPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Failed to get random port')));
      }
    });
    server.on('error', reject);
  });
}

/**
 * Kill all Chrome processes gracefully.
 */
function killExistingChrome(): void {
  const platform = process.platform;
  logger.info('Killing existing Chrome processes...');

  try {
    if (platform === 'win32') {
      execSync('taskkill /IM chrome.exe /F 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "Google Chrome" 2>/dev/null || pkill -f "google-chrome" 2>/dev/null || true', {
        stdio: 'ignore',
      });
    }
  } catch {
    // It's OK if kill fails — Chrome might not be running
    logger.debug('No Chrome process to kill (or kill failed)');
  }

  // Brief delay to let the process fully exit and release the profile lock
  const waitMs = platform === 'win32' ? 2000 : 1000;
  execSync(platform === 'win32' ? `ping -n ${Math.ceil(waitMs / 1000) + 1} 127.0.0.1 >nul` : `sleep ${waitMs / 1000}`, {
    stdio: 'ignore',
  });
}

/**
 * Wait for the CDP endpoint to become available.
 * Polls /json/version with exponential backoff.
 */
async function waitForCDP(port: number, maxAttempts = 15): Promise<string> {
  let delay = 300;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fetchJson(`http://localhost:${port}/json/version`, 1000);
      const wsUrl = data['webSocketDebuggerUrl'] as string | undefined;
      if (wsUrl) {
        logger.info({ port, wsUrl, attempt }, 'CDP endpoint ready');
        return wsUrl;
      }
    } catch {
      logger.debug({ attempt, delay }, 'CDP not ready yet, retrying...');
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 3000);
  }

  throw new Error(`CDP endpoint on port ${port} did not become available after ${maxAttempts} attempts`);
}

/**
 * Launch Chrome with remote debugging enabled, preserving the user's profile.
 *
 * Decision tree:
 * 1. Detect existing debug endpoint → connect if found
 * 2. If not found → kill Chrome → relaunch with --remote-debugging-port
 *
 * NEVER opens a fresh/blank profile.
 */
export async function launchChrome(
  onWarning?: (message: string) => void,
): Promise<ChromeEndpoint> {
  // Step 1: Try to find an existing debug endpoint
  const existing = await detectExistingDebugEndpoint();
  if (existing) {
    return existing;
  }

  // Step 2: Relaunch Chrome with debug flags
  const chromePath = getChromeExecutable();
  const profilePath = getDefaultProfilePath();
  const port = await getRandomPort();

  logger.info({ chromePath, profilePath, port }, 'Launching Chrome with debug port');

  // Warn the user (relayed to extension)
  onWarning?.(
    'Dart needs to restart Chrome to enable browser control. Your sessions and tabs will be preserved.',
  );

  // Kill existing Chrome to release the profile lock
  killExistingChrome();

  // Launch Chrome with debug flags
  const args = [
    `--remote-debugging-port=${port}`,
    `--remote-allow-origins=http://localhost:${port}`,
    `--user-data-dir=${profilePath}`,
    '--restore-last-session',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  const child = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });

  // Detach the Chrome process so it outlives the native binary
  child.unref();

  logger.info({ pid: child.pid, port }, 'Chrome launched, waiting for CDP endpoint...');

  // Wait for CDP to be ready
  const wsEndpoint = await waitForCDP(port);

  return { port, wsEndpoint };
}
