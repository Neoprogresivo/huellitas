# Arquitectura Huellitas (monorepo)

```text
GitHub (un repositorio)
 ├── frontend/ → Vercel Proyecto 1 (React + Vite)
 │      ├── Supabase Auth (login/registro)
 │      └── HTTP HTTPS + Bearer JWT ───────────────────────┐
 ├── backend/  → Vercel Proyecto 2 (Node.js Functions) ◄───┘
 │      └── Supabase Data API usando JWT del usuario
 └── supabase/schema.sql → Supabase PostgreSQL + RLS
```

El servidor responde a /api/health, /api/pets y /api/vaccines. El frontend utiliza `VITE_API_BASE_URL` para llamar al backend de otro dominio. El backend controla CORS con `CORS_ALLOWED_ORIGINS`, valida el JWT con `auth.getUser()` y utiliza el JWT para respetar RLS. No se usa clave secreta ni service_role.

La autenticación se realiza en el navegador mediante Supabase Auth; es una decisión explícita para la demostración. Los datos solo se consultan o modifican mediante la API propia. Las políticas RLS protegen por usuario las tablas pets y vaccines.

## Rewrites en Vercel
El archivo `backend/vercel.json` adapta las URLs REST con ID (`/api/pets/:id` y `/api/vaccines/:id`) a funciones estáticas `/api/pet-detail` y `/api/vaccine-detail`, pasando `id` por query. El servidor local acepta las rutas REST directamente.
