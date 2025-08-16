import supabase from './supabase.js';

export default async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data?.role || null;
}
