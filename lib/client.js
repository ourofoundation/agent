import { createClient } from "@supabase/supabase-js";

async function getTokenFromPAT(pat) {
  const response = await fetch(
    `${process.env.OURO_BACKEND_URL}/users/get-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pat }),
    }
  );
  const data = await response.json();
  return data.token;
}

function getSupabaseClient(token) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
    }
  );
  // Set your custom JWT here
  supabase.realtime.setAuth(token);
  supabase.headers.Authorization = `Bearer ${token}`;
  supabase.auth.headers.Authorization = `Bearer ${token}`;
  supabase.rest.headers.Authorization = `Bearer ${token}`;

  return supabase;
}

export { getSupabaseClient, getTokenFromPAT };
