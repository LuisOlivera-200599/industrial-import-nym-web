const SUPABASE_URL = "https://lzaolbleriqwbnnejypy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LiAAKOOvCkfc7tWuIdzERg_UsOUpltv";

window.NYM_SUPABASE_URL = SUPABASE_URL;
window.NYM_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.nymSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
