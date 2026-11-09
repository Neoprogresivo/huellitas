import { checkCors } from '../lib/cors.js'
import { authorized, send, methodNotAllowed, getBody, dbError } from '../lib/server.js'
import { isUuid, validatePet } from '../server/validation.js'

export default async function handler(req, res) {
  if (checkCors(req, res)) return
  if (!['PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['PATCH', 'DELETE'])
  const id = req.query?.id
  if (!isUuid(id)) return send(res, 400, { error: 'Identificador de mascota no válido.' })
  const auth = await authorized(req, res)
  if (!auth) return
  if (req.method === 'DELETE') {
    const { data, error } = await auth.db.from('pets').delete().eq('id', id).select('id').maybeSingle()
    if (error) return dbError(res, error)
    if (!data) return send(res, 404, { error: 'Mascota no encontrada.' })
    return send(res, 200, { success: true })
  }
  const { value, error: validationError } = validatePet(getBody(req), true)
  if (validationError) return send(res, 400, { error: validationError })
  const { data, error } = await auth.db.from('pets').update(value).eq('id', id).select().maybeSingle()
  if (error) return dbError(res, error)
  if (!data) return send(res, 404, { error: 'Mascota no encontrada.' })
  return send(res, 200, { data })
}
