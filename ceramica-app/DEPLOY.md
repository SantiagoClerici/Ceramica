# Cómo crear el proyecto online (sin instalar nada)
# Todo desde el browser

## Opción A — StackBlitz (recomendada para desarrollo)

1. Ir a https://stackblitz.com/fork/nextjs
   (crea un proyecto Next.js vacío directamente en el browser)

2. En la terminal integrada de StackBlitz, ejecutar:
   npm install @supabase/ssr @supabase/supabase-js date-fns clsx

3. Crear los archivos de este proyecto copiando cada uno
   en la estructura de carpetas indicada en ESTRUCTURA.md

4. Configurar las variables de entorno:
   - Hacer clic en el ícono de "candado" (Environment Variables)
   - Agregar:
     NEXT_PUBLIC_SUPABASE_URL      = (tu URL de Supabase)
     NEXT_PUBLIC_SUPABASE_ANON_KEY = (tu anon key de Supabase)

5. El proyecto corre en preview instantáneo dentro de StackBlitz.

6. Para publicar: conectar con GitHub desde StackBlitz
   y luego importar el repo en vercel.com


## Opción B — v0.dev + Vercel (recomendada para producción rápida)

1. Ir a https://v0.dev
2. Crear un proyecto Next.js nuevo
3. Pegar los archivos directamente en el editor
4. Configurar env vars en la sección de proyecto
5. Deploy a Vercel con un clic desde v0.dev


## Opción C — GitHub Codespaces (entorno completo en la nube)

1. Crear un repo nuevo en github.com
2. Code → Codespaces → Create codespace on main
3. En la terminal del codespace:
   npx create-next-app@latest ceramica-app --typescript --tailwind --app
   cd ceramica-app
   npm install @supabase/ssr @supabase/supabase-js date-fns clsx
4. Copiar los archivos del proyecto
5. Crear .env.local con las keys de Supabase
6. npm run dev → el codespace expone el puerto automáticamente
7. Para producción: push al repo e importar en vercel.com


## Variables de entorno necesarias (en cualquier plataforma)

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Las encontrás en: Supabase Dashboard → Settings → API → Project URL y anon public key


## Configurar Supabase Auth (emails de invitación)

1. Supabase Dashboard → Authentication → Email Templates
   Personalizar el template de "Invite user"

2. Authentication → Settings → habilitar "Enable email confirmations"

3. Site URL: poner tu dominio de Vercel (ej: https://ceramica.vercel.app)

4. Para enviar emails reales (producción):
   Authentication → SMTP Settings → conectar con Resend:
   Host:     smtp.resend.com
   Port:     465
   User:     resend
   Password: (tu API key de resend.com, plan gratuito 3000/mes)


## Invitar alumnos (flujo)

Desde el dashboard del profesor:
  Supabase Dashboard → Authentication → Users → Invite user
  (ingresás el email del alumno → le llega un magic link para crear su cuenta)

O programáticamente con la Admin API de Supabase:
  await supabase.auth.admin.inviteUserByEmail('alumno@email.com')
  (requiere service_role key, solo usar desde Edge Functions o Server Actions)
