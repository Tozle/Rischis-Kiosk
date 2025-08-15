import supabase from './supabase.js';

export default async function getUserName(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data?.name || null;
}
