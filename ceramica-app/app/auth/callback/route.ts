import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Crear perfil si es la primera vez que entra con Google
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        const meta = data.user.user_metadata;
        await supabase.from("users").insert({
          id:         data.user.id,
          email:      data.user.email,
          first_name: meta.given_name ?? meta.name ?? "Usuario",
          last_name:  meta.family_name ?? "",
          avatar_url: meta.avatar_url ?? null,
          role:       "student",
        });
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
