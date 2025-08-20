import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
import request from 'supertest';
import express from 'express';
import feedingsRoute from '../routes/feed.js';

describe('Feedings API', () => {
    let app;
    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/feedings', feedingsRoute);
    });

    it('GET /api/feedings should return array', async () => {
        const res = await request(app).get('/api/feedings');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/feedings with missing type should fail', async () => {
        const res = await request(app).post('/api/feedings').send({});
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});
