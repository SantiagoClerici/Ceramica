"use client";
// app/profesor/cursos/nuevo/page.tsx
// Crear un nuevo curso — dispara la Edge Function automáticamente via webhook

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export default function NuevoCursoPage() {
  const supabase = createClient();
  const router = useRouter();

  const [classes, setClasses]   = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    class_id:             "",
    name:                 "",
    day_of_week:          "2",  // Martes por defecto
    start_time:           "18:00",
    end_time:             "19:30",
    capacity:             "10",
    cycle_start_date:     new Date().toISOString().slice(0, 10),
    cycle_end_date:       new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10),
    recovery_limit_days:  "90",
  });

  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .order("name");
      setClasses(data ?? []);
      if (data && data.length > 0) {
        setForm((f) => ({ ...f, class_id: data[0].id }));
      }
    }
    fetchClasses();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("courses")
      .insert({
        class_id:            form.class_id,
        teacher_id:          user.id,
        name:                form.name,
        day_of_week:         parseInt(form.day_of_week),
        start_time:          form.start_time,
        end_time:            form.end_time,
        capacity:            parseInt(form.capacity),
        cycle_start_date:    form.cycle_start_date,
        cycle_end_date:      form.cycle_end_date,
        recovery_limit_days: form.recovery_limit_days ? parseInt(form.recovery_limit_days) : null,
      })
      .select()
      .single();

    if (error) {
      setError("Error al crear el curso: " + error.message);
      setLoading(false);
      return;
    }

    // El webhook dispara generate-sessions automáticamente.
    // Redirigimos al detalle del curso recién creado.
    router.push(`/profesor/cursos/${data.id}`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Nuevo curso</h1>
        <p className="text-stone-500 text-sm mt-1">
          Las sesiones del año se generan automáticamente al guardar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Clase (sede) */}
        <Field label="Sede / clase">
          <select
            name="class_id"
            value={form.class_id}
            onChange={handleChange}
            required
            className={inputClass}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        {/* Nombre del curso */}
        <Field label="Nombre del curso">
          <input
            name="name"
            type="text"
            required
            placeholder="Ej: Torno avanzado"
            value={form.name}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>

        {/* Día */}
        <Field label="Día de la semana">
          <select
            name="day_of_week"
            value={form.day_of_week}
            onChange={handleChange}
            className={inputClass}
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </Field>

        {/* Horario */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hora inicio">
            <input
              name="start_time"
              type="time"
              required
              value={form.start_time}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
          <Field label="Hora fin">
            <input
              name="end_time"
              type="time"
              required
              value={form.end_time}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Cupo */}
        <Field label="Cupo máximo">
          <input
            name="capacity"
            type="number"
            min={1}
            required
            value={form.capacity}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>

        {/* Ciclo */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Inicio del ciclo">
            <input
              name="cycle_start_date"
              type="date"
              required
              value={form.cycle_start_date}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
          <Field label="Fin del ciclo">
            <input
              name="cycle_end_date"
              type="date"
              required
              value={form.cycle_end_date}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Límite de recuperación */}
        <Field label="Límite para recuperar (días)" hint="Dejá vacío para ilimitado">
          <input
            name="recovery_limit_days"
            type="number"
            min={1}
            placeholder="90"
            value={form.recovery_limit_days}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
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
            disabled={loading}
            className="flex-1 bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium
                       hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear curso"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Helpers UI ----
const inputClass = `
  w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-stone-400
`;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {hint && <span className="ml-1 text-stone-400 font-normal text-xs">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
