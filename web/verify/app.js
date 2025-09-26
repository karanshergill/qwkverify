import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';

import verifyRoutes from './routes/index.js';
import errorHandler from '@shared/helpers/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadFolder = path.join(__dirname, '../../', 'uploads');

const app = express();


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
