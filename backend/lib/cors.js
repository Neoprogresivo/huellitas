// Verificación CORS de solicitudes con origen (navegador).
// El CORS NO reemplaza autenticación ni permisos RLS.
export function checkCors(req, res) {
  const origin = req.headers.origin
  const allowed = new Set(
    (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',').map(x => x.trim().replace(/\/$/, '')).filter(Boolean)
  )
  res.setHeader('Vary', 'Origin')
  if (origin && !allowed.has(origin)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({error:'Origen no autorizado por CORS. Actualiza CORS_ALLOWED_ORIGINS.'}))
    return true
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '600')
  }
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}
