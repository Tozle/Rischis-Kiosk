import express from 'express';
import getUserRole from '../utils/getUserRole.js';
import getUserFromRequest from '../utils/getUser.js';
import { listProducts } from '../services/productService.js';
import asyncHandler from '../utils/asyncHandler.js';
const router = express.Router();


router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await getUserFromRequest(req, res);
    const role = user ? await getUserRole(user.id) : null;

    const { products, error } = await listProducts(req.query.sort, role);
    if (error) return res.status(500).json({ error });

    res.json(products);
  }),
);

export default router;
