import { supabase } from './supabase.js'

// En local: API relativa /api (proxy Vite al puerto 3001).
// En producción: URL del proyecto Vercel "backend".
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

export async function api(path, options = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) throw new Error('La sesión ha expirado. Inicia sesión nuevamente.')

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(options.headers || {})
      }
    })
  } catch {
    throw new Error('No se pudo conectar con el backend. Revisa VITE_API_BASE_URL, CORS y el despliegue de la API.')
  }
  let payload
  try { payload = await response.json() }
  catch { throw new Error('La API no devolvió JSON. Revisa el backend y su configuración.') }
  if (!response.ok) throw new Error(payload.error || `Error de servidor (${response.status})`)
  return payload
}
