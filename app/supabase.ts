import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://skwxlwrpcjindcgwrdfh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3P-KFBUDmtosOOnL0joAbQ_srPhTpO3';//

export const supabase = createClient(supabaseUrl, supabaseAnonKey);