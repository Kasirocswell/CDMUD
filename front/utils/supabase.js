import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qckjlthwsduoywxqhgwm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja2psdGh3c2R1b3l3eHFoZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODUwNTQ1ODEsImV4cCI6MjAwMDYzMDU4MX0.kNhjp29xnRBcPdpDappD-Ai-o6ewcVY5_s-vhqZ8sEg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
