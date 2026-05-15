"use client";
// app/alumno/liberar/page.tsx
// El alumno libera una de sus próximas clases → genera crédito de recuperación

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Session {
  id: string;
  date: string;
  course: { name: string; start_time: string };
}

export default function LiberarPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [sessions, setSessions]       = useState<Session[]>([]);
  const [selected, setSelected]       = useState<string | null>(null);
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Inscripción aprobada
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id)
        .eq("status", "approved")
        .single();

      if (!enrollment) { setLoading(false); return; }

      const today = new Date().toISOString().slice(0, 10);

      // Próximas sesiones activas que el alumno NO haya liberado ya
      const { data: releasedIds } = await supabase
        .from("releases")
        .select("session_id")
        .eq("student_id", user.id);

      const excluded = (releasedIds ?? []).map((r: { session_id: string }) => r.session_id);

      const query = supabase
        .from("sessions")
        .select("id, date, course:courses!course_id(name, start_time)")
        .eq("course_id", enrollment.course_id)
        .eq("status", "active")
        .gte("date", today)
        .order("date")
        .limit(12);

      if (excluded.length > 0) {
        query.not("id", "in", `(${excluded.join(",")})`);
      }

      const { data } = await query;
      setSessions((data as unknown as Session[]) ?? []);
      setLoading(false);
    }

    fetchSessions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("releases").insert({
      session_id:  selected,
      student_id:  user.id,
      released_by: user.id,
      origin:      "student",
      notes:       notes || null,
    });

    if (error) {
      setError("Error al liberar la clase: " + error.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/alumno"), 1500);
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-stone-700 font-medium">Clase liberada</p>
          <p className="text-stone-400 text-sm mt-1">Se generó un crédito de recuperación.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Liberar clase</h1>
        <p className="text-stone-500 text-sm mt-1">
          Avisá que no vas a asistir. Se genera un crédito para recuperar después.
        </p>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Cargando clases...</p>
      ) : sessions.length === 0 ? (
        <p className="text-stone-400 text-sm">No tenés clases disponibles para liberar.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelected(session.id)}
                className={`w-full text-left border rounded-xl px-4 py-3 transition-colors
                  ${
                    selected === session.id
                      ? "border-stone-800 bg-stone-50"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
              >
                <p className="text-sm font-medium text-stone-800">
                  {format(parseISO(session.date), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {session.course.start_time.slice(0, 5)}hs · {session.course.name}
                </p>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Comentario <span className="text-stone-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: viaje, trabajo..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-stone-200 text-stone-700 rounded-lg py-2.5 text-sm
                         hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selected || submitting}
              className="flex-1 bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium
                         hover:bg-stone-700 transition-colors disabled:opacity-40"
            >
              {submitting ? "Liberando..." : "Confirmar liberación"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
