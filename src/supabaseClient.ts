import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlmxcyputvvxfccegyae.supabase.co';
const supabaseAnonKey = 'vyivZGM5pwMoV8JdPP3Wq0lJGz7HBJPHjYO9OTK6epustMoT6z6if293MEvltcBzJe87J60dU82SLLt8EYUInA==';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
