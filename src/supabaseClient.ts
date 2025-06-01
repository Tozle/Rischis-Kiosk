import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://vlmxcyputvvxfccegyae.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbXhjeXB1dHZ2eGZjY2VneWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODgzMjMsImV4cCI6MjA2NDM2NDMyM30.LOVS3woAmgmrHedQzBkinsSh3gbPSJkCZMoeSS8ilSs'
);

