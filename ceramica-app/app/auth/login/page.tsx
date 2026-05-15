"use client";
// app/auth/login/page.tsx

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // El middleware redirige según el rol automáticamente
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
            Cerámica
          </h1>
          <p className="text-stone-500 text-sm mt-1">Ingresá a tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium
                       hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-stone-200" />
  </div>
  <div className="relative flex justify-center text-xs text-stone-400">
    <span className="bg-stone-50 px-2">o</span>
  </div>
</div>

<button
  type="button"
  onClick={async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }}
  className="w-full border border-stone-200 text-stone-700 rounded-lg py-2.5 text-sm
             font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
>
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.52V5.45H1.83a8 8 0 0 0 0 7.1z"/>
    <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.56-2.56A8 8 0 0 0 1.83 5.45L4.5 7.52A4.8 4.8 0 0 1 8.98 3.58z"/>
  </svg>
  Continuar con Google
</button>
        </form>
      </div>
    </main>
  );
}
