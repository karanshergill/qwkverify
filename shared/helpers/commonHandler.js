import dotenv from 'dotenv';
dotenv.config();

export const get = (path, fallback = '') => path ?? fallback;

export const payloadCheck = (fn) => {
    return (req, res, next) => {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Request payload is empty. Please provide data." });
        }
        next();
    };
};