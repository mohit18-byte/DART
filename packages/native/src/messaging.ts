import { NativeOutgoingSchema, type NativeIncoming } from '@dart/shared';
import logger from './logger';

/**
 * Chrome Native Messaging Protocol — 4-byte length-prefixed JSON.
 *
 * Each message is:
 *   [4-byte uint32 LE length] [UTF-8 JSON payload]
 *
 * We read from stdin, write to stdout. ALL debug output goes to stderr.
 */

// ── Read exactly N bytes from stdin ──

function readBytes(stream: NodeJS.ReadableStream, count: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;

    const onReadable = () => {
      while (received < count) {
        const remaining = count - received;
        const chunk = stream.read(remaining) as Buffer | null;
        if (chunk === null) break;
        chunks.push(chunk);
        received += chunk.length;
      }

      if (received >= count) {
        cleanup();
        resolve(Buffer.concat(chunks, count));
      }
    };

    const onEnd = () => {
      cleanup();
      reject(new Error('stdin closed before message was fully read'));
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      stream.removeListener('readable', onReadable);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
    };

    stream.on('readable', onReadable);
    stream.on('end', onEnd);
    stream.on('error', onError);

    // Try reading immediately in case data is already buffered
    onReadable();
  });
}

/**
 * Read one framed message from stdin.
 * Returns the parsed message validated against NativeOutgoingSchema.
 */
export async function readMessage(): Promise<ReturnType<typeof NativeOutgoingSchema.parse>> {
  // Read 4-byte length prefix (uint32 LE)
  const lengthBuf = await readBytes(process.stdin, 4);
  const messageLength = lengthBuf.readUInt32LE(0);

  if (messageLength === 0) {
    throw new Error('Received zero-length message');
  }

  if (messageLength > 1024 * 1024) {
    throw new Error(`Message too large: ${messageLength} bytes (max 1MB)`);
  }

  // Read the JSON payload
  const payloadBuf = await readBytes(process.stdin, messageLength);
  const jsonStr = payloadBuf.toString('utf-8');

  logger.debug({ messageLength, json: jsonStr.slice(0, 200) }, 'Received raw message');

  const raw = JSON.parse(jsonStr);
  return NativeOutgoingSchema.parse(raw);
}

/**
 * Write one framed message to stdout.
 * Encodes the message as 4-byte LE length prefix + UTF-8 JSON.
 */
export function writeMessage(msg: NativeIncoming): void {
  const jsonStr = JSON.stringify(msg);
  const payload = Buffer.from(jsonStr, 'utf-8');

  // 4-byte length prefix (uint32 LE)
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(payload.length, 0);

  // Write length + payload atomically
  const fullMessage = Buffer.concat([lengthBuf, payload]);
  process.stdout.write(fullMessage);

  logger.debug({ type: (msg as Record<string, unknown>).type, bytes: payload.length }, 'Sent message');
}
