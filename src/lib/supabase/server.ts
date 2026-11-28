
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabaseSettings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase configuration is missing. Check your .env.local file."
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function createStatelessAuthClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseSettings();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseKey } = getSupabaseSettings();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The proxy refreshes cookies for Server Components.
          }
        },
      },
    }
  );
}
