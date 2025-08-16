import getUserAndProduct from '../utils/getUserAndProduct.js';
import purchaseProduct from '../utils/purchaseProduct.js';

export async function buyProduct(userId, productId, quantity) {
  const { user, product } = await getUserAndProduct(userId, productId);

  if (!product || product.stock < quantity) {
    const error = new Error('Nicht genug Bestand');
    error.status = 400;
    throw error;
  }

  return purchaseProduct(user, product, quantity);
}
