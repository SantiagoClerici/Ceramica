# ============================================================
#  ESTRUCTURA DEL PROYECTO
#  ceramica-app/
# ============================================================

ceramica-app/
├── .env.local                        # Variables de entorno (Supabase keys)
├── next.config.js
├── tailwind.config.js
├── package.json
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente Supabase para el browser
│   │   ├── server.ts                 # Cliente Supabase para Server Components
│   │   └── types.ts                  # Tipos generados del schema
│   └── utils.ts                      # Helpers generales
│
├── app/
│   ├── layout.tsx                    # Layout raíz
│   ├── page.tsx                      # Redirect según rol
│   │
│   ├── auth/
│   │   ├── login/page.tsx            # Login
│   │   ├── register/page.tsx         # Registro (desde invitación)
│   │   └── callback/route.ts         # Callback OAuth / magic link
│   │
│   ├── admin/                        # Super Admin
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Dashboard general
│   │   ├── clases/
│   │   │   ├── page.tsx              # Lista de clases
│   │   │   └── [id]/page.tsx         # Detalle de clase
│   │   └── profesores/
│   │       └── page.tsx              # Gestión de profesores
│   │
│   ├── profesor/                     # Profesor / Admin de clase
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Dashboard del profesor
│   │   ├── cursos/
│   │   │   ├── page.tsx              # Lista de cursos
│   │   │   ├── nuevo/page.tsx        # Crear curso
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detalle del curso + sesiones
│   │   │       ├── alumnos/page.tsx  # Gestión de alumnos
│   │   │       └── sesiones/page.tsx # Calendario de sesiones
│   │   ├── inscripciones/
│   │   │   └── page.tsx              # Aprobar / rechazar pendientes
│   │   └── recuperaciones/
│   │       └── page.tsx              # Ver y confirmar recuperaciones
│   │
│   └── alumno/                       # Alumno
│       ├── layout.tsx
│       ├── page.tsx                  # Mi curso + próximas clases
│       ├── liberar/page.tsx          # Liberar una clase
│       ├── recuperar/page.tsx        # Solicitar recuperación
│       └── perfil/page.tsx           # Editar perfil
│
└── components/
    ├── ui/                           # Componentes base reutilizables
    │   ├── Button.tsx
    │   ├── Badge.tsx
    │   ├── Card.tsx
    │   └── Modal.tsx
    ├── SessionCard.tsx               # Tarjeta de sesión con estado
    ├── EnrollmentRow.tsx             # Fila de inscripción con acciones
    ├── ReleaseForm.tsx               # Formulario de liberación
    └── RecoveryForm.tsx              # Formulario de recuperación
