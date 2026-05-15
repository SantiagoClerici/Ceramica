"use client";
// app/alumno/recuperar/page.tsx
// El alumno elige en qué sesión de otro curso quiere recuperar,
// consumiendo uno de sus créditos (releases disponibles).

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Release {
  id: string;
  session: {
    date: string;
    course: { name: string };
  };
}

interface AvailableSession {
  id: string;
  date: string;
  available_capacity: number;
  course: { name: string; start_time: string };
}

export default function RecuperarPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [releases, setReleases]           = useState<Release[]>([]);
  const [sessions, setSessions]           = useState<AvailableSession[]>([]);
  const [selectedRelease, setRelease]     = useState<string | null>(null);
  const [selectedSession, setSession]     = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState(false);
  const [myCourseId, setMyCourseId]       = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Inscripción aprobada del alumno
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", user.id)
      .eq("status", "approved")
      .single();

    setMyCourseId(enrollment?.course_id ?? null);

    // Créditos disponibles: releases sin recovery asociada
    const { data: releasesData } = await supabase
      .from("releases")
      .select(`
        id,
        session:sessions!session_id(
          date,
          course:courses!course_id(name)
        )
      `)
      .eq("student_id", user.id)
      .is("recoveries.id", null) // solo las no usadas
      .order("released_at");

    setReleases((releasesData as Release[]) ?? []);

    // Sesiones de OTROS cursos con cupo, desde hoy
    const today = new Date().toISOString().slice(0, 10);
    let query = supabase
      .from("sessions")
      .select(`
        id, date,
        course:courses!course_id(name, start_time)
      `)
      .eq("status", "active")
      .gte("date", today)
      .order("date")
      .limit(20);

    if (enrollment?.course_id) {
      query = query.neq("course_id", enrollment.course_id);
    }

    const { data: sessionsRaw } = await query;

    // Calcular cupo disponible para cada sesión
    const sessionsWithCapacity: AvailableSession[] = [];

    for (const s of (sessionsRaw ?? []) as AvailableSession[]) {
      const { data } = await supabase
        .rpc("session_available_capacity", { p_session_id: s.id });
      if ((data ?? 0) > 0) {
        sessionsWithCapacity.push({ ...s, available_capacity: data ?? 0 });
      }
    }

    setSessions(sessionsWithCapacity);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRelease || !selectedSession) return;

    setSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("recoveries").insert({
      target_session_id: selectedSession,
      release_id:        selectedRelease,
      student_id:        user.id,
      status:            "pending",
    });

    if (error) {
      // El trigger validate_recovery devuelve mensajes claros en español
      setError(error.message.replace("ERROR: ", "").replace(/^.*?:/, "").trim());
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
          <p className="text-stone-700 font-medium">Recuperación solicitada</p>
          <p className="text-stone-400 text-sm mt-1">Tu profesora la confirmará pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Recuperar clase</h1>
        <p className="text-stone-500 text-sm mt-1">
          Elegí el crédito a usar y la sesión donde querés recuperar.
        </p>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Cargando...</p>
      ) : releases.length === 0 ? (
        <div className="border border-dashed border-stone-200 rounded-xl p-8 text-center">
          <p className="text-stone-500 text-sm">No tenés créditos disponibles para recuperar.</p>
          <p className="text-stone-400 text-xs mt-1">Liberá una clase primero.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Paso 1: elegir crédito */}
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2">
              1. ¿Qué clase liberada querés usar?
            </p>
            <div className="space-y-2">
              {releases.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => setRelease(rel.id)}
                  className={`w-full text-left border rounded-xl px-4 py-3 transition-colors
                    ${
                      selectedRelease === rel.id
                        ? "border-stone-800 bg-stone-50"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                >
                  <p className="text-sm font-medium text-stone-800">
                    {format(parseISO(rel.session.date), "d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-xs text-stone-400">{rel.session.course.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Paso 2: elegir sesión destino */}
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2">
              2. ¿En qué clase querés recuperar?
            </p>
            {sessions.length === 0 ? (
              <p className="text-stone-400 text-sm">No hay sesiones disponibles en otros cursos.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSession(session.id)}
                    className={`w-full text-left border rounded-xl px-4 py-3 transition-colors
                      ${
                        selectedSession === session.id
                          ? "border-stone-800 bg-stone-50"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {format(parseISO(session.date), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {session.course.start_time.slice(0, 5)}hs · {session.course.name}
                        </p>
                      </div>
                      <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100
                                       rounded-full px-2 py-0.5 shrink-0 ml-3">
                        {session.available_capacity} lugares
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
              disabled={!selectedRelease || !selectedSession || submitting}
              className="flex-1 bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium
                         hover:bg-stone-700 transition-colors disabled:opacity-40"
            >
              {submitting ? "Solicitando..." : "Solicitar recuperación"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
