import getUserFromRequest from '../utils/getUser.js';
import getUserRole from '../utils/getUserRole.js';
import asyncHandler from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const user = await getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  req.user = user;
  next();
});

export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    const user = await getUserFromRequest(req, res);
    if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
    req.user = user;
  }
  const role = await getUserRole(req.user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  next();
});
