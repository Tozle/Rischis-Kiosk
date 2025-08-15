import supabase from './supabase.js';

export default async function getUserAndProduct(userId, productId) {
  const [{ data: user }, { data: product }] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('products').select('*').eq('id', productId).single(),
  ]);

  return { user, product };
}
