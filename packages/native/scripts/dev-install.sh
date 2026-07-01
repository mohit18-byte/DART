#!/usr/bin/env bash
#
# Dart Native Agent — Developer Install Script (macOS/Linux)
#
# Compiles the native binary, creates the native messaging host manifest,
# and registers it with Chrome. One command, done.
#
# Usage: ./scripts/dev-install.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PACKAGE_DIR/../.." && pwd)"

BINARY_NAME="dart-agent"
HOST_NAME="app.dart.agent"

# ── Get the CRX ID from the built extension ──
# The extension must be built first to get the stable CRX ID from manifest.key
echo "→ Building native binary..."
cd "$PACKAGE_DIR"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "→ Installing dependencies..."
  cd "$REPO_ROOT" && pnpm install && cd "$PACKAGE_DIR"
fi

# Compile binary
bun build --compile src/index.ts --outfile "dist/$BINARY_NAME"
BINARY_PATH="$PACKAGE_DIR/dist/$BINARY_NAME"
chmod +x "$BINARY_PATH"
echo "✓ Binary compiled: $BINARY_PATH"

# ── Determine CRX ID ──
# For development, use the extension ID from chrome://extensions after loading unpacked
# Default: use a placeholder that must be updated
CRX_ID="${DART_CRX_ID:-}"
if [ -z "$CRX_ID" ]; then
  echo ""
  echo "⚠  No CRX_ID set. After loading the extension in Chrome:"
  echo "   1. Go to chrome://extensions"
  echo "   2. Find 'Dart — AI Browser Agent' and copy its ID"
  echo "   3. Re-run: DART_CRX_ID=<your-id> ./scripts/dev-install.sh"
  echo ""
  echo "   Using placeholder ID for now..."
  CRX_ID="placeholder-extension-id"
fi

# ── Create native messaging host manifest ──
MANIFEST_CONTENT=$(cat <<EOF
{
  "name": "$HOST_NAME",
  "description": "Dart AI Browser Agent — native messaging host",
  "path": "$BINARY_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$CRX_ID/"
  ]
}
EOF
)

MANIFEST_FILENAME="${HOST_NAME}.json"

# ── Install manifest per OS ──
OS="$(uname -s)"
case "$OS" in
  Darwin)
    MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    ;;
  Linux)
    MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    ;;
  *)
    echo "✗ Unsupported OS: $OS (use dev-install.ps1 for Windows)"
    exit 1
    ;;
esac

mkdir -p "$MANIFEST_DIR"
echo "$MANIFEST_CONTENT" > "$MANIFEST_DIR/$MANIFEST_FILENAME"
echo "✓ Manifest installed: $MANIFEST_DIR/$MANIFEST_FILENAME"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Dart native agent installed!"
echo ""
echo "  Host name: $HOST_NAME"
echo "  Binary:    $BINARY_PATH"
echo "  Manifest:  $MANIFEST_DIR/$MANIFEST_FILENAME"
echo ""
echo "  Restart Chrome for changes to take effect."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
