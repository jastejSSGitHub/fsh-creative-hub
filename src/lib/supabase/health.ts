import { createClient } from "@/lib/supabase/server";

export type SupabaseHealth = {
  configured: boolean;
  connected: boolean;
  message: string;
};

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      configured: false,
      connected: false,
      message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        configured: true,
        connected: false,
        message: error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      message: "Supabase client ready (auth endpoint reachable)",
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      message: error instanceof Error ? error.message : "Unknown connection error",
    };
  }
}
