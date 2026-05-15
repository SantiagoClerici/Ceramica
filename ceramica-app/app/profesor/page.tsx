"use client";
// app/profesor/page.tsx
// Dashboard principal del profesor

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  capacity: number;
  enrollments: { count: number }[];
}

interface PendingEnrollment {
  id: string;
  student: { first_name: string; last_name: string; email: string };
  course: { name: string };
  created_at: string;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ProfesorDashboard() {
  const supabase = createClient();

  const [courses, setCourses]               = useState<Course[]>([]);
  const [pending, setPending]               = useState<PendingEnrollment[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Cursos del profesor con conteo de alumnos aprobados
    const { data: coursesData } = await supabase
      .from("courses")
      .select(`
        id, name, day_of_week, start_time, capacity,
        enrollments!inner(count)
      `)
      .eq("teacher_id", user.id)
      .eq("enrollments.status", "approved")
      .eq("is_active", true)
      .order("day_of_week");

    setCourses((coursesData as Course[]) ?? []);

    // Inscripciones pendientes de aprobación
    const { data: pendingData } = await supabase
      .from("enrollments")
      .select(`
        id, created_at,
        student:users!student_id(first_name, last_name, email),
        course:courses!course_id(name)
      `)
      .eq("status", "pending")
      .in(
        "course_id",
        (coursesData ?? []).map((c: Course) => c.id)
      )
      .order("created_at");

    setPending((pendingData as PendingEnrollment[]) ?? []);
    setLoadingCourses(false);
  }

  async function handleEnrollment(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    await supabase
      .from("enrollments")
      .update({ status, enrolled_at: status === "approved" ? new Date().toISOString() : null })
      .eq("id", id);
    await fetchData();
    setActionLoading(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-800">Mis cursos</h1>
        <Link
          href="/profesor/cursos/nuevo"
          className="bg-stone-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
        >
          + Nuevo curso
        </Link>
      </div>

      {/* Cursos */}
      {loadingCourses ? (
        <p className="text-stone-400 text-sm">Cargando...</p>
      ) : courses.length === 0 ? (
        <p className="text-stone-400 text-sm">No tenés cursos activos todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((course) => {
            const enrolled = course.enrollments?.[0]?.count ?? 0;
            const pct = Math.round((enrolled / course.capacity) * 100);

            return (
              <Link
                key={course.id}
                href={`/profesor/cursos/${course.id}`}
                className="border border-stone-200 rounded-xl p-5 hover:border-stone-400
                           transition-colors bg-white group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-stone-800">{course.name}</p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {DAYS[course.day_of_week]} · {course.start_time.slice(0, 5)}hs
                    </p>
                  </div>
                  <span className="text-xs bg-stone-100 text-stone-600 rounded-full px-2.5 py-1">
                    {enrolled}/{course.capacity}
                  </span>
                </div>

                {/* Barra de ocupación */}
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1">{pct}% de capacidad</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Inscripciones pendientes */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">
            Inscripciones pendientes
            <span className="ml-2 text-sm bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          </h2>

          <div className="space-y-3">
            {pending.map((enr) => (
              <div
                key={enr.id}
                className="flex items-center justify-between border border-stone-200
                           rounded-xl px-5 py-4 bg-white"
              >
                <div>
                  <p className="font-medium text-stone-800 text-sm">
                    {enr.student.first_name} {enr.student.last_name}
                  </p>
                  <p className="text-xs text-stone-400">{enr.student.email} · {enr.course.name}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={actionLoading === enr.id}
                    onClick={() => handleEnrollment(enr.id, "rejected")}
                    className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5
                               rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-40"
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={actionLoading === enr.id}
                    onClick={() => handleEnrollment(enr.id, "approved")}
                    className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg
                               hover:bg-stone-700 transition-colors disabled:opacity-40"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
