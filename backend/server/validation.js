export const speciesList = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro']
export const statusList = ['Activo', 'En tratamiento', 'En adopción']
export const sexList = ['Macho', 'Hembra', 'No especificado']

const isRealDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const optionalText = (value, max) => value === null || value === undefined ? null : text(value, max) || null
export const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export function validatePet(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'Se requiere un objeto JSON válido.' }
  const allowed = ['name', 'species', 'breed', 'birth_date', 'sex', 'weight_kg', 'status', 'notes']
  const out = {}
  for (const key of allowed) {
    if (!Object.hasOwn(data, key)) continue
    const v = data[key]
    switch (key) {
      case 'name':
        if (typeof v !== 'string' || v.trim().length < 2 || v.trim().length > 60) return { error: 'El nombre debe tener entre 2 y 60 caracteres.' }
        out.name = v.trim(); break
      case 'species':
        if (!speciesList.includes(v)) return { error: 'Selecciona una especie válida.' }
        out.species = v; break
      case 'breed': out.breed = optionalText(v, 80); break
      case 'birth_date':
        if (v === null || v === '') { out.birth_date = null; break }
        if (!isRealDate(v)) return { error: 'La fecha de nacimiento debe ser válida (AAAA-MM-DD).' }
        if (v > new Date().toISOString().slice(0, 10)) return { error: 'La fecha de nacimiento no puede estar en el futuro.' }
        out.birth_date = v; break
      case 'sex':
        if (!sexList.includes(v)) return { error: 'Selecciona un sexo válido.' }
        out.sex = v; break
      case 'weight_kg':
        if (v === null || v === '') { out.weight_kg = null; break }
        if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v > 200) return { error: 'El peso debe estar entre 0 y 200 kg.' }
        out.weight_kg = Math.round(v * 100) / 100; break
      case 'status':
        if (!statusList.includes(v)) return { error: 'Selecciona un estado válido.' }
        out.status = v; break
      case 'notes': out.notes = optionalText(v, 1000); break
    }
  }
  if (!partial && (!out.name || !out.species)) return { error: 'Nombre y especie son obligatorios.' }
  if (partial && Object.keys(out).length === 0) return { error: 'No hay campos que actualizar.' }
  return { value: out }
}

export function validateVaccine(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'Se requiere un objeto JSON válido.' }
  const out = {}
  if (!partial) {
    if (!isUuid(data.pet_id)) return { error: 'Debe indicar una mascota válida.' }
    out.pet_id = data.pet_id
  }
  for (const key of ['name', 'administered_on', 'next_due_on', 'notes']) {
    if (!Object.hasOwn(data, key)) continue
    const v = data[key]
    if (key === 'name') {
      if (typeof v !== 'string' || v.trim().length < 2 || v.trim().length > 100) return { error: 'El nombre de la vacuna debe tener entre 2 y 100 caracteres.' }
      out.name = v.trim()
    } else if (key === 'administered_on') {
      if (!isRealDate(v)) return { error: 'La fecha de aplicación es inválida.' }
      if (v > new Date().toISOString().slice(0, 10)) return { error: 'La fecha de aplicación no puede ser futura.' }
      out.administered_on = v
    } else if (key === 'next_due_on') {
      if (v === null || v === '') { out.next_due_on = null; continue }
      if (!isRealDate(v)) return { error: 'La fecha de refuerzo es inválida.' }
      out.next_due_on = v
    } else out.notes = optionalText(v, 500)
  }
  if (!partial && (!out.name || !out.administered_on)) return { error: 'Vacuna y fecha de aplicación son obligatorias.' }
  if (partial && Object.keys(out).length === 0) return { error: 'No hay campos que actualizar.' }
  return { value: out }
}
