import request from 'supertest';
import express from 'express';
import logoutRoute from '../routes/logout.js';

describe('POST /api/logout', () => {
    let app;
    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/logout', logoutRoute);
    });

    it('should return success true', async () => {
        const res = await request(app).post('/api/logout');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });
});
