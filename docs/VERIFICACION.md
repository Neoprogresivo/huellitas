# Evidencias sugeridas para la clase

1. GitHub: carpetas `frontend/`, `backend/`, `supabase/`, `docs/`.
2. Supabase: tablas `pets`, `vaccines` y políticas RLS habilitadas.
3. Vercel: dos proyectos conectados al **mismo repositorio** y diferentes Root Directory.
4. Backend: GET `/api/health` devuelve `status: ok`. GET `/api/pets` sin token responde 401.
5. Frontend: crear usuario, confirmar correo si procede, ingresar, crear/editar/eliminar mascota y vacuna.
6. Persistencia: recargar; los datos permanecen.
7. Prueba de aislamiento: usuario B no ve ni cambia datos de usuario A.
8. Ejecutar pruebas unitarias desde `backend`: `npm test`.
9. Capturar en un informe URL, versión/commit, pruebas y estado de cada etapa.
