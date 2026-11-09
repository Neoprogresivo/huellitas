import { createClient } from '@supabase/supabase-js'

export function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

export function methodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '))
  send(res, 405, { error: `Método no permitido. Usa ${methods.join(', ')}.` })
}

export function getBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return null }
  }
  return req.body ?? null
}

export async function authorized(req, res) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    send(res, 503, { error: 'Servidor sin configurar. Revisa variables de entorno.' })
    return null
  }
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) { send(res, 401, { error: 'Autenticación requerida.' }); return null }
  const token = match[1]
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data?.user) {
    send(res, 401, { error: 'Sesión inválida o expirada.' })
    return null
  }
  return { db, user: data.user }
}

export function dbError(res, error) {
  if (error?.code === '42501') return send(res, 403, { error: 'No tienes permiso para realizar esta operación.' })
  if (error?.code === '23503') return send(res, 400, { error: 'La mascota indicada no existe o no es accesible.' })
  if (error?.code === '23514' || error?.code === '23502') return send(res, 400, { error: 'Los datos no cumplen las reglas de validación.' })
  console.error('Supabase:', error?.code, error?.message)
  return send(res, 500, { error: 'No se pudo completar la operación. Revisa la API y la base de datos.' })
}
