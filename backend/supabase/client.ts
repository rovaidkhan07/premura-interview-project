import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } from '../config/env';

const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(url, key);