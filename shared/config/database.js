
import { PrismaClient } from '@prisma/client';
import logger from '../utilities/logger.js';

const prisma = new PrismaClient();

function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    logger.info(`[${signal}] Received. Starting graceful shutdown...`);

    try {
      // Stop accepting new requests
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing server:', err);
            return reject(err);
          }
          logger.info('🛑 HTTP server closed.');
          resolve();
        });
      });

      // Disconnect Prisma
      await prisma.$disconnect();
      logger.info('🔌 Prisma disconnected.');

      process.exit(0);
    } catch (error) {
      logger.error('❌ Graceful shutdown failed:', error);
      process.exit(1);
    }
  };

  // Attach only once
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.once(signal, () => {
      shutdown(signal);
    });
  });
}


export { prisma, setupGracefulShutdown };
