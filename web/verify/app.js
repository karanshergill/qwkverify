import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { fileURLToPath } from 'url';

import logger from '@shared/utilities/logger.js';
import verifyRoutes from './routes/index.js';
import errorHandler from '@shared/helpers/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadFolder = path.join(__dirname, '../../', 'uploads');

const app = express();

// Logging
app.use(pinoHttp({ logger }));

// CORS & Parsers
app.use(cors({
    origin: ['https://verify.basiq360.com', 'http://localhost:5173', 'http://localhost:4173', 'http://194.195.112.221:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Catch JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "Invalid JSON format in request body" });
    }
    next();
});
// MP4 Streaming Route for Chrome + Opera
app.get('/uploads/:filename', (req, res, next) => {
    const filePath = path.join(uploadFolder, req.params.filename);

    if (path.extname(filePath).toLowerCase() !== '.mp4') {

        return next();
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            return res.status(404).send('File not found');
        }

        const range = req.headers.range;
        if (!range) {
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Length': stats.size,
                'Accept-Ranges': 'bytes',
                'Content-Disposition': 'inline'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }

        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : stats.size - 1;

        if (start >= stats.size || end >= stats.size) {
            res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
            return res.end();
        }

        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
            'Content-Disposition': 'inline'
        });

        file.pipe(res);
    });
});

// Static handler for everything else
app.use('/uploads', express.static(uploadFolder));

// Health check
app.get('/health', (req, res) => {
    req.log.info('Verify UAE module healthy');
    res.status(200).json({ status: 'ok', module: 'verify' });
});

// Routes
app.use('/', verifyRoutes);

// Errors
app.use((err, req, res, next) => {
    req.log.error({ err }, 'Verify module error');
    return errorHandler(err, req, res, next);
});

export default app;
