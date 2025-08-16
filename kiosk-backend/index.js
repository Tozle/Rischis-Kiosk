import env from './utils/env.js';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
import buzzer from './routes/buzzer.js';
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import notFound from './middleware/notFound.js';
import logger from './utils/logger.js';
import { getCookieOptions } from './utils/authCookies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, 'public');

const app = express();
const PORT = env.PORT;

// Proxy trust für korrekte IP-Erkennung (z.B. express-rate-limit, Render, Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(compression());
app.use(
  cors({
    // Allow all origins in development. In production only domains matching
    // the CORS_TLD environment variable are permitted. Requests without an
    // origin header (e.g. curl) are also allowed.
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      try {
        const { hostname } = new URL(origin);
        if (hostname.endsWith(`.${env.CORS_TLD}`)) {
          return callback(null, true);
        }
      } catch {
        // Ignore invalid origins
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(requestLogger);

if (env.FORCE_HTTPS) {
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

// Statische Routen
['admin', 'dashboard', 'mentos', 'shop', 'buzzer'].forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(join(publicDir, 'out', `${page}.html`));
  });
});
app.get('/', (req, res) => {
  res.sendFile(join(publicDir, 'index.html'));
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
app.use('/api/buzzer', buzzer);


// Fallback: Für alle unbekannten Routen statisches Next.js-Frontend ausliefern (SPA-Support)
app.use((req, res, next) => {
  // Nur für GET-Anfragen, keine API-Routen
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(join(publicDir, 'out', 'index.html'));
});

// 404-Handler
app.use(notFound);

// Zentrale Fehlerbehandlung
app.use(errorHandler);

// Server starten
app.listen(PORT, () => {
  logger.info(`✅ Server läuft auf Port ${PORT}`);
});
