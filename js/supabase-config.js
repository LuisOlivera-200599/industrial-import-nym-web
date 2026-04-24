const SUPABASE_URL = "https://lzaolbleriqwbmnejypy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LiAAKOOvCkfc7tWuIdzERg_UsOUpltv";

window.nymSupabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
