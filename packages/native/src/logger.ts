import pino from 'pino';

/**
 * Logger that writes ONLY to stderr.
 * stdout is reserved for the Chrome native messaging protocol.
 * Any console.log to stdout would corrupt the message framing.
 */
export const logger = pino(
  {
    level: process.env.DART_LOG_LEVEL ?? 'info',
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination({ dest: 2, sync: false }), // fd 2 = stderr
);

export default logger;
