import { createClient } from '@supabase/supabase-js';
import env from './env.js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export { supabase };
