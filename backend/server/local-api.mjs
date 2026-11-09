import http from 'node:http'
import health from '../api/health.js'
import pets from '../api/pets.js'
import petById from '../api/pet-detail.js'
import vaccines from '../api/vaccines.js'
import vaccineById from '../api/vaccine-detail.js'

const routes = [
  [/^\/api\/health\/?$/, health, false],
  [/^\/api\/pets\/?$/, pets, false],
  [/^\/api\/pets\/([a-f0-9-]+)\/?$/i, petById, true],
  [/^\/api\/vaccines\/?$/, vaccines, false],
  [/^\/api\/vaccines\/([a-f0-9-]+)\/?$/i, vaccineById, true]
]

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const route = routes.map(([pattern, handler, withId]) => ({ match: url.pathname.match(pattern), handler, withId })).find(r => r.match)
  if (!route) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Ruta no encontrada.' })) }
  req.query = Object.fromEntries(url.searchParams)
  if (route.withId) req.query.id = route.match[1]
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    let content = ''
    try {
      for await (const chunk of req) {
        content += chunk.toString()
        if (content.length > 65536) throw new Error('Demasiados datos')
      }
      req.body = content ? JSON.parse(content) : null
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'JSON inválido o demasiado grande.' }))
    }
  }
  try { await route.handler(req, res) }
  catch (err) {
    console.error(err)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
    if (!res.writableEnded) res.end(JSON.stringify({ error: 'Error inesperado del servidor.' }))
  }
})
server.listen(3001, '127.0.0.1', () => console.log('API local: http://127.0.0.1:3001/api/health'))
