import { createClient } from "@supabase/supabase-js";

export function createAdminClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key||!url.startsWith("https://")||key.includes("your-"))return null;return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
