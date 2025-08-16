import express from 'express';
import purchaseProduct from '../../utils/purchaseProduct.js';
import getUserAndProduct from '../../utils/getUserAndProduct.js';
import { requireAdmin } from '../../middleware/auth.js';
import { validateAdminBuy } from '../../middleware/validate.js';
import asyncHandler from '../../utils/asyncHandler.js';
const router = express.Router();

router.post(
  '/',
  validateAdminBuy,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const authUser = req.user;

    const { user_id, product_id, quantity } = req.body;

    const { user, product } = await getUserAndProduct(user_id, product_id);

    if (!user || !product || product.stock < quantity) {
      const error = new Error(
        'Nicht genügend Bestand oder Nutzer nicht gefunden',
      );
      error.status = 400;
      throw error;
    }

    const result = await purchaseProduct(user, product, quantity);
    res.json(result);
  }),
);

export default router;
