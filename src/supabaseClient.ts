import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vlmxcyputvvxfccegyae.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbXhjeXB1dHZ2eGZjY2VneWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODgzMjMsImV4cCI6MjA2NDM2NDMyM30.LOVS3woAmgmrHedQzBkinsSh3gbPSJkCZMoeSS8ilSs";

export const supabase = createClient(supabaseUrl, supabaseKey);

