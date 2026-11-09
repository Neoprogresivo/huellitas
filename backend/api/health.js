import { checkCors } from '../lib/cors.js'
import { send, methodNotAllowed } from '../lib/server.js'
export default function handler(req, res) {
  if (checkCors(req, res)) return
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
  return send(res, 200, { status: 'ok', service: 'huellitas-api', version: '1.0.0' })
}
