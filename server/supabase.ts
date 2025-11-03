import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xuwpnyegbcaockhherfz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1d3BueWVnYmNhb2NraGhlcmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjk2MDUsImV4cCI6MjA3Nzc0NTYwNX0.3bJLJ0imXjfd_tLIDvg7B1mxvnL6JT3kuRZLXfJha9o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
