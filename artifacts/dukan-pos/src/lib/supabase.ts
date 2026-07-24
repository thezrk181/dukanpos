import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://znrgfjvudrlkwmpusbla.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rDLNMBVdyq6C6HRUKhO-Gw_MF-ZmxZq';

export const supabase = createClient(supabaseUrl, supabaseKey);
