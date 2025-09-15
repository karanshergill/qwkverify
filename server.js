import express from 'express';
import logger from '@shared/utilities/logger.js';
import verifyWeb from '@web/verify/app.js';
import { setupGracefulShutdown } from '@shared/config/database.js';

const PORT =process.env.APP_PORT|| 9000;
const app = express();

// Mount all modular apps
app.use('/api/v1', verifyWeb);

// Root health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Main API is running' });
});

app.listen(PORT, (err) => {
    if (err) {
        logger.error(`Error starting server: ${err.message}`);
        setTimeout(() => process.exit(1), 100);
        return;
    }
    logger.info(`🚀 Server running on port ${PORT}`);
});

setupGracefulShutdown(app);