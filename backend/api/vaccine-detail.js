import { checkCors } from '../lib/cors.js'
import { authorized, send, methodNotAllowed, getBody, dbError } from '../lib/server.js'
import { isUuid, validateVaccine } from '../server/validation.js'

export default async function handler(req, res) {
  if (checkCors(req, res)) return
  if (!['PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['PATCH', 'DELETE'])
  const id = req.query?.id
  if (!isUuid(id)) return send(res, 400, { error: 'Identificador de vacuna no válido.' })
  const auth = await authorized(req, res)
  if (!auth) return
  if (req.method === 'DELETE') {
    const { data, error } = await auth.db.from('vaccines').delete().eq('id', id).select('id').maybeSingle()
    if (error) return dbError(res, error)
    if (!data) return send(res, 404, { error: 'Vacuna no encontrada.' })
    return send(res, 200, { success: true })
  }
  const { value, error: validationError } = validateVaccine(getBody(req), true)
  if (validationError) return send(res, 400, { error: validationError })
  const { data, error } = await auth.db.from('vaccines').update(value).eq('id', id).select().maybeSingle()
  if (error) return dbError(res, error)
  if (!data) return send(res, 404, { error: 'Vacuna no encontrada.' })
  return send(res, 200, { data })
}
