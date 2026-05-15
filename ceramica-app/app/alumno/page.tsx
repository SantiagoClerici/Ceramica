"use client";
// app/alumno/page.tsx
// Vista principal del alumno

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Session {
  id: string;
  date: string;
  status: "active" | "holiday" | "closed";
  course: { name: string; start_time: string };
}

interface CreditSummary {
  total_releases: number;
  used_recoveries: number;
  available: number;
}

const STATUS_LABEL: Record<string, string> = {
  active:  "Clase normal",
  holiday: "Feriado",
  closed:  "Cerrado",
};

const STATUS_COLOR: Record<string, string> = {
  active:  "bg-emerald-50 text-emerald-700 border-emerald-100",
  holiday: "bg-amber-50 text-amber-700 border-amber-100",
  closed:  "bg-red-50 text-red-700 border-red-100",
};

export default function AlumnoDashboard() {
  const supabase = createClient();

  const [sessions, setSessions]   = useState<Session[]>([]);
  const [credits, setCredits]     = useState<CreditSummary | null>(null);
  const [courseId, setCourseId]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [userName, setUserName]   = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Perfil del alumno
    const { data: profile } = await supabase
      .from("users")
      .select("first_name")
      .eq("id", user.id)
      .single();
    setUserName(profile?.first_name ?? "");

    // Inscripción aprobada del alumno
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", user.id)
      .eq("status", "approved")
      .single();

    if (!enrollment) {
      setLoading(false);
      return;
    }

    setCourseId(enrollment.course_id);

    // Próximas 8 sesiones activas
    const today = new Date().toISOString().slice(0, 10);
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("id, date, status, course:courses!course_id(name, start_time)")
      .eq("course_id", enrollment.course_id)
      .gte("date", today)
      .in("status", ["active", "holiday", "closed"])
      .order("date")
      .limit(8);

    setSessions((sessionsData as unknown as Session[]) ?? []);

    // Créditos disponibles: releases - recoveries usadas
    const { count: totalReleases } = await supabase
      .from("releases")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id);

    const { count: usedRecoveries } = await supabase
      .from("recoveries")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id)
      .in("status", ["pending", "confirmed"]);

    const total = totalReleases ?? 0;
    const used  = usedRecoveries ?? 0;

    setCredits({
      total_releases:   total,
      used_recoveries:  used,
      available:        Math.max(0, total - used),
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-400 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Hola, {userName} 👋
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Tus próximas clases y créditos disponibles.
        </p>
      </div>

      {/* Sin inscripción */}
      {!courseId && (
        <div className="border border-dashed border-stone-200 rounded-xl p-8 text-center">
          <p className="text-stone-500 text-sm">
            Todavía no estás inscripta/o en ningún curso.
          </p>
          <p className="text-stone-400 text-xs mt-1">
            Tu profesora te enviará una invitación por email.
          </p>
        </div>
      )}

      {/* Créditos */}
      {credits && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Clases liberadas" value={credits.total_releases} />
          <StatCard label="Recuperaciones usadas" value={credits.used_recoveries} />
          <StatCard
            label="Créditos disponibles"
            value={credits.available}
            highlight={credits.available > 0}
          />
        </div>
      )}

      {/* Acciones rápidas */}
      {courseId && (
        <div className="flex gap-3">
          <Link
            href="/alumno/liberar"
            className="flex-1 text-center border border-stone-200 text-stone-700 text-sm
                       rounded-xl py-3 hover:bg-stone-50 transition-colors font-medium"
          >
            Liberar clase
          </Link>
          <Link
            href="/alumno/recuperar"
            className={`flex-1 text-center text-sm rounded-xl py-3 font-medium transition-colors
              ${
                credits && credits.available > 0
                  ? "bg-stone-800 text-white hover:bg-stone-700"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
          >
            Recuperar clase
          </Link>
        </div>
      )}

      {/* Próximas sesiones */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-stone-700 mb-3">Próximas clases</h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between border border-stone-100
                           rounded-xl px-4 py-3 bg-white"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {format(parseISO(session.date), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {session.course.start_time.slice(0, 5)}hs · {session.course.name}
                  </p>
                </div>
                <span
                  className={`text-xs border rounded-full px-2.5 py-1 ${STATUS_COLOR[session.status]}`}
                >
                  {STATUS_LABEL[session.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-stone-100 bg-white"
      }`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-emerald-700" : "text-stone-800"}`}>
        {value}
      </p>
      <p className="text-xs text-stone-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
