import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';

const streams = [
  { stream: process.stdout },
  { level: 'error', stream: pino.destination(path.join(logDir, 'error.log')) },
  { stream: pino.destination(path.join(logDir, 'combined.log')) },
];

const logger = isProd
  ? pino(
      {
        level: process.env.LOG_LEVEL || 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      pino.multistream(streams)
    )
  : pino({
      level: process.env.LOG_LEVEL || 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });

export default logger;
