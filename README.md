# Huellitas — Proyecto Full Stack para GitHub, Vercel y Supabase

Aplicación didáctica para **Ingeniería de Software I** con **React + Vite**, **API REST Node.js** (Vercel Functions) y **PostgreSQL + Supabase Auth**. Los registros están protegidos mediante políticas **Row Level Security (RLS)**.

> **Monorepositorio listo para subir a GitHub.** Se crean **dos proyectos en Vercel desde el mismo repositorio**, seleccionando `backend/` y `frontend/` como *Root Directory*. No es necesario dividir el código en dos repositorios ni usar Render. Antes de que funcione debes crear tu proyecto Supabase e introducir tus propias variables de entorno en Vercel.

## 1. Estructura

```text
Huellitas_GitHub_Frontend_Backend/
├── frontend/
│   ├── src/                   # React, formularios, panel, autenticación y cliente API
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── vercel.json             # Rewrites de URLs /api/pets/:id
│   └── .env.example
├── backend/
│   ├── api/                   # Funciones HTTP publicadas por Vercel
│   │   ├── health.js
│   │   ├── pets.js
│   │   ├── pet-detail.js         # PATCH/DELETE (por rewrite)
│   │   ├── vaccines.js
│   │   └── vaccine-detail.js     # PATCH/DELETE (por rewrite)
│   ├── lib/                   # CORS, autorización, respuestas HTTP y Supabase
│   ├── server/                # Servidor local y validaciones
│   ├── tests/                 # Pruebas unitarias sin servicios externos
│   ├── package.json
│   ├── vercel.json             # Rewrites de URLs /api/pets/:id
│   └── .env.example
├── supabase/schema.sql       # Tablas, relaciones, permisos, índices y RLS
├── docs/                     # Arquitectura y verificación
├── .gitignore                # Evita subir credenciales
└── README.md
```

## 2. Funcionalidades

- Crear cuenta e iniciar sesión con Supabase Auth.
- Crear, listar, buscar, editar y eliminar mascotas.
- Añadir, editar y eliminar vacunas por mascota.
- Consultar panel con indicadores y fechas de refuerzo.
- Cargar registros ficticios mediante botón de demostración.
- Autenticar peticiones al backend con JWT y aplicar seguridad RLS por usuario.
- Validar entradas en cliente, backend y base de datos.

## 3. Configurar Supabase

1. Crear un proyecto desde <https://supabase.com/dashboard>.
2. En **SQL Editor → New query**, pegar y ejecutar `supabase/schema.sql`.
3. En **Table Editor**, comprobar `public.pets` y `public.vaccines`.
4. En **Authentication → Providers → Email**, confirmar que el proveedor esté activado; verificar la opción de confirmación por correo.
5. Copiar **Project URL** y **publishable key** desde **Connect** o **Settings → API Keys**. La clave publishable comienza por `sb_publishable_...`.
6. No compartir `service_role`, `sb_secret_...`, contraseña de BD ni tokens personales. **No son necesarios** para este proyecto.

## 4. Ejecutar en local (dos terminales)

Requisito: Node.js **22.12 o superior** y npm.

**Terminal A (backend)**

```bash
cd backend
npm install
```

Crear `backend/.env.local` copiando `.env.example`. Introducir:

```dotenv
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Iniciar servidor:

```bash
npm run dev
```

Verificar <http://127.0.0.1:3001/api/health> (debe devolver `status: "ok"`).

**Terminal B (frontend)**

```bash
cd frontend
npm install
```

Crear `frontend/.env.local` copiando `.env.example`:

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
VITE_API_BASE_URL=
```

Dejar `VITE_API_BASE_URL` vacío en local: Vite redirige `/api` hacia `127.0.0.1:3001`.

```bash
npm run dev
npm run build
```

Abrir <http://localhost:5173>. Para ejecutar `npm run build`, detener Vite si ocupa la terminal o usar otra.

**Pruebas del backend**:

```bash
cd backend
npm test
```

## 5. Subir a GitHub

Crear un repositorio vacío (sin README adicional). En la **carpeta raíz del proyecto**, donde están `frontend/`, `backend/` y `supabase/`:

```bash
git init
git add .
git status
git commit -m "Huellitas: frontend React, backend Node y esquema Supabase"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/huellitas.git
git push -u origin main
```

Revisar `git status` antes de confirmar para asegurar que **no** aparezcan `.env.local` ni contraseñas. Si GitHub pide autenticación, utilizar el método recomendado por GitHub (navegador, Git Credential Manager o token de acceso); no usar una contraseña de cuenta directamente en HTTPS.

## 6. Desplegar backend en Vercel — Proyecto 1

1. Abrir <https://vercel.com/new> → **Import Git Repository** → escoger `huellitas`.
2. En **Root Directory**, seleccionar **`backend`**.
3. **Framework Preset: Other** si Vercel no lo detecta automáticamente.
4. Dejar compilación y salida con ajustes por defecto; Vercel identifica las funciones en `backend/api/` al usar la raíz `backend`. El archivo `backend/vercel.json` redirige las URLs con identificadores (por ejemplo `/api/pets/UUID`) a las funciones `pet-detail.js` y `vaccine-detail.js`, enviando el ID como parámetro.
5. En **Environment Variables**, configurar:

   | Variable | Valor |
   |---|---|
   | `SUPABASE_URL` | `https://TU-PROYECTO.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_TU_CLAVE` |
   | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` inicialmente |

6. **Deploy**. Copiar URL del backend, por ejemplo `https://huellitas-api.vercel.app`.
7. Visitar `https://huellitas-api.vercel.app/api/health` → debe devolver JSON con `status:"ok"`.
8. Visitar `https://huellitas-api.vercel.app/api/pets` sin sesión → respuesta esperada HTTP **401**.

**Nota:** si Vercel pide la carpeta raíz de funciones, es `backend/api` **dentro** del proyecto `backend`. No seleccionar `backend/api` como *Root Directory*.

## 7. Desplegar frontend en Vercel — Proyecto 2

1. En Vercel, **Add New → Project** → seleccionar el **mismo repositorio GitHub**.
2. **Root Directory: `frontend`**.
3. **Framework Preset: Vite**.
4. **Build Command:** `npm run build`; **Output Directory:** `dist`.
5. En **Environment Variables** (entorno Production), agregar:

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://TU-PROYECTO.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_TU_CLAVE` |
   | `VITE_API_BASE_URL` | `https://huellitas-api.vercel.app` (URL real del backend, **sin /api** ni slash final) |

6. **Deploy**. Copiar la URL de la interfaz, p. ej. `https://huellitas.vercel.app`.

## 8. Unir los proyectos: CORS y autenticación

1. Regresar al proyecto **backend** de Vercel → **Settings → Environment Variables**.
2. Actualizar `CORS_ALLOWED_ORIGINS` con el dominio real del frontend, por ejemplo:

```dotenv
CORS_ALLOWED_ORIGINS=https://huellitas.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

3. **Redeploy** el backend después de modificar la variable. Si creas URLs Preview diferentes, tendrás que autorizar explícitamente cada origen que vayas a probar.
4. En Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://huellitas.vercel.app`.
   - **Redirect URLs**: incluir `http://localhost:5173/**` y `https://huellitas.vercel.app/**`.
5. Comprueba que el flujo de confirmación de correo corresponda con la URL publicada. Con confirmación habilitada, los usuarios deben confirmar su dirección antes de entrar.
6. Si cambias variables `VITE_*` en el frontend, **Redeploy frontend** para incorporarlas a los archivos Vite.

## 9. Prueba integral obligatoria

- GET `/api/health` backend → HTTP 200 JSON `ok`.
- GET `/api/pets` sin token → HTTP 401.
- Registrar usuario A y confirmar correo si procede.
- Iniciar sesión → crear mascota y vacuna.
- Recargar → datos persisten en PostgreSQL.
- Editar nombre y eliminar vacuna, luego verificar.
- Iniciar sesión como usuario B (otro correo) → no se ven las mascotas de A.
- Revisar registros en Supabase y evidencia en Vercel.

## 10. Tabla de diagnóstico

| Problema | Qué comprobar |
|---|---|
| El backend responde 404 | Root Directory del backend = `backend`; archivo `backend/api/health.js`; despliegue correcto. |
| El frontend solo muestra error de configuración | Variables `VITE_SUPABASE_*` y **Redeploy frontend**. |
| Fallo de CORS | Dominio frontend exacto en `CORS_ALLOWED_ORIGINS`; **Redeploy backend**. |
| Login no confirma | **Site URL** y **Redirect URLs** en Supabase; bandeja de spam; opción Email. |
| HTTP 401 en `/api/pets` | JWT ausente, usuario sin sesión o token expirado. |
| HTTP 503 | Variables `SUPABASE_*` ausentes en backend. |
| HTTP 403 / RLS | Políticas, usuario autenticado y propiedad de registros. |
| Carga la web pero falla CRUD | URL del backend en `VITE_API_BASE_URL`; logs Vercel y respuesta HTTP. |
| Los datos no aparecen | Ejecutar esquema SQL, revisar permisos y RLS de las tablas. |

## 11. Fuentes oficiales

- Vercel monorepos: <https://vercel.com/docs/monorepos>
- Vercel funciones Node.js: <https://vercel.com/docs/functions/runtimes/node-js>
- Supabase API keys: <https://supabase.com/docs/guides/getting-started/api-keys>
- Supabase Auth URL: <https://supabase.com/docs/guides/auth/redirect-urls>

**Alcance:** proyecto académico. Para producción real se necesitan además monitoreo, estrategia de backup, rate limiting, revisión de seguridad y automatización de pruebas. El ejemplo no contiene datos personales reales ni secretos.
