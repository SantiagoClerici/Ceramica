// middleware.ts
// Protege rutas según el rol del usuario autenticado

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescar sesión
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Si no está autenticado y no está en /auth → redirigir al login
  if (!user && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Si está autenticado, verificar rol para rutas protegidas
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Redirigir desde /auth si ya está logueado
    if (pathname.startsWith("/auth")) {
      if (role === "super_admin") return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "teacher")     return NextResponse.redirect(new URL("/profesor", request.url));
      if (role === "student")     return NextResponse.redirect(new URL("/alumno", request.url));
    }

    // Proteger rutas de admin
    if (pathname.startsWith("/admin") && role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Proteger rutas de profesor
    if (pathname.startsWith("/profesor") && !["super_admin", "teacher"].includes(role ?? "")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Proteger rutas de alumno
    if (pathname.startsWith("/alumno") && role !== "student") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
