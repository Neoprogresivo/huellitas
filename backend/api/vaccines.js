import { checkCors } from '../lib/cors.js'
import { authorized, send, methodNotAllowed, getBody, dbError } from '../lib/server.js'
import { isUuid, validateVaccine } from '../server/validation.js'

export default async function handler(req, res) {
  if (checkCors(req, res)) return
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST'])
  const auth = await authorized(req, res)
  if (!auth) return
  if (req.method === 'GET') {
    let query = auth.db.from('vaccines').select('*').order('administered_on', { ascending: false })
    if (req.query?.pet_id) {
      if (!isUuid(req.query.pet_id)) return send(res, 400, { error: 'Mascota no válida.' })
      query = query.eq('pet_id', req.query.pet_id)
    }
    const { data, error } = await query
    if (error) return dbError(res, error)
    return send(res, 200, { data })
  }
  const { value, error: validationError } = validateVaccine(getBody(req))
  if (validationError) return send(res, 400, { error: validationError })
  const { data, error } = await auth.db.from('vaccines').insert(value).select().single()
  if (error) return dbError(res, error)
  return send(res, 201, { data })
}
