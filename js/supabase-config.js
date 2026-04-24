const SUPABASE_URL = "https://lzaolbleriqwbnnejypy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LiAAKOOvCkfc7tWuIdzERg_UsOUpltv";

const nymSupabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
