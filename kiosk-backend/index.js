import env from './utils/env.js';

import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import path from 'path';
import { fileURLToPath } from 'url';
import logoutRoute from './routes/logout.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Routen-Imports (nur funktionsfähige Imports!)
import feed from './routes/feed.js';
import products from './routes/products.js';
import buy from './routes/buy.js';
import user from './routes/user.js';
import auth from './routes/auth.js';
import purchases from './routes/purchases.js';
import customerOfWeek from './routes/customer_of_week.js';
import adminProducts from './routes/admin/products.js';
import adminPurchases from './routes/admin/purchases.js';
import adminStats from './routes/admin/stats.js';
import adminUsers from './routes/admin/users.js';
import adminBuyForUser from './routes/admin/buy_for_user.js';
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import notFound from './middleware/notFound.js';
import logger from './utils/logger.js';
import { getCookieOptions } from './utils/authCookies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();
const PORT = env.PORT;

// Middleware
app.use(compression());
app.use(helmet());
app.use(
  cors({
    origin: [
      'https://rischis-kiosk.de',
      'https://www.rischis-kiosk.de',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(requestLogger);

if (env.FORCE_HTTPS) {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

const csrfProtection = csrf({
  cookie: {
    ...getCookieOptions(),
    sameSite: 'strict',
  },
});

app.use(csrfProtection);
app.use(express.json());
app.use(express.static(publicDir, { maxAge: '1d' }));

// Rate-Limiting für alle API-Routen
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // max. 100 Requests pro IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen, bitte später erneut versuchen.' }
}));

// Statische Routen
['admin', 'dashboard', 'mentos', 'shop'].forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(publicDir, `${page}.html`));
  });
});
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API-Routen
app.use('/api/feedings', feed);
app.use('/api/products', products);
app.use('/api/buy', buy);
app.use('/api/user', user);
app.use('/api/auth', auth);
app.use('/api/purchases', purchases);
app.use('/api/customer-of-week', customerOfWeek);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/purchases', adminPurchases);
app.use('/api/admin/stats', adminStats);
app.use('/api/admin/users', adminUsers);
app.use('/api/admin/buy', adminBuyForUser);
app.use('/api/logout', logoutRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404-Handler
app.use(notFound);

// Zentrale Fehlerbehandlung
app.use(errorHandler);

// Server starten
app.listen(PORT, () => {
  logger.info(`✅ Server läuft auf Port ${PORT}`);
});
