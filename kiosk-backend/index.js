import env from './utils/env.js';

import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import Tokens from 'csrf';
import path from 'path';
import { fileURLToPath } from 'url';
import logoutRoute from './routes/logout.js';
import onlineUsersRoute from './routes/online/users.mjs';
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
import gamesRoute from './routes/games.js';
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
app.set('trust proxy', 1); // Für sichere Cookies hinter Proxy/Render immer aktiv
const PORT = env.PORT;

// Middleware
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', '*'],
      },
    },
  })
);
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

const tokens = new Tokens();
app.use((req, res, next) => {
  let secret = req.cookies['csrfSecret'];
  if (!secret) {
    secret = tokens.secretSync();
    res.cookie('csrfSecret', secret, { ...getCookieOptions(), sameSite: 'strict' });
  }
  req.csrfToken = () => tokens.create(secret);
  req.csrfSecret = secret;
  next();
});
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

// API-Routen (Buzzer/Kolo entfernt)
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
app.use('/api/games', gamesRoute);
app.use('/api/logout', logoutRoute);
app.use('/api/online-users', onlineUsersRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404-Handler
app.use(notFound);

// Zentrale Fehlerbehandlung
app.use(errorHandler);

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('Ein Benutzer hat sich verbunden:', socket.id);

    socket.on('joinLobby', (lobbyId) => {
        socket.join(lobbyId);
        console.log(`Benutzer ${socket.id} ist der Lobby ${lobbyId} beigetreten.`);
    });

    socket.on('updateLobby', (lobbyId) => {
        io.to(lobbyId).emit('lobbyUpdated');
        console.log(`Lobby ${lobbyId} wurde aktualisiert.`);
    });

    socket.on('disconnect', () => {
        console.log('Ein Benutzer hat die Verbindung getrennt:', socket.id);
    });
});

// Ändern Sie den Startbefehl, um den HTTP-Server zu verwenden
server.listen(PORT, () => {
    logger.info(`✅ Server läuft auf Port ${PORT}`);
});
