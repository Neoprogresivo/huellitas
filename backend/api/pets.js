import { checkCors } from '../lib/cors.js'
import { authorized, send, methodNotAllowed, getBody, dbError } from '../lib/server.js'
import { validatePet } from '../server/validation.js'

export default async function handler(req, res) {
  if (checkCors(req, res)) return
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST'])
  const auth = await authorized(req, res)
  if (!auth) return
  if (req.method === 'GET') {
    const { data, error } = await auth.db.from('pets').select('*').order('created_at', { ascending: false })
    if (error) return dbError(res, error)
    return send(res, 200, { data })
  }
  const { value, error: validationError } = validatePet(getBody(req))
  if (validationError) return send(res, 400, { error: validationError })
  const { data, error } = await auth.db.from('pets').insert({ ...value, owner_id: auth.user.id }).select().single()
  if (error) return dbError(res, error)
  return send(res, 201, { data })
}
