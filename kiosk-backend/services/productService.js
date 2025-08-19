import { supabase } from '../utils/supabase.js';

const SORT_OPTIONS = {
  price_desc: { column: 'price', asc: false },
  price_asc: { column: 'price', asc: true },
  name_desc: { column: 'name', asc: false },
  name_asc: { column: 'name', asc: true },
};

export async function listProducts(sortKey = 'price_asc', role = null) {
  const { column, asc } = SORT_OPTIONS[sortKey] || SORT_OPTIONS.price_asc;

  let query = supabase.from('products').select('*');
  if (role !== 'admin') query = query.eq('available', true);

  const { data, error } = await query.order(column, { ascending: asc });

  if (error) return { error: error.message };

  const sanitized = data.map((p) => {
    if (role !== 'admin') delete p.purchase_price;
    return p;
  });

  return { products: sanitized };
}
