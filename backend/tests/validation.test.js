import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePet, validateVaccine, isUuid } from '../server/validation.js'

test('requiere nombre de mascota válido', () => {
  assert.match(validatePet({ name: 'A', species: 'Perro' }).error, /nombre/)
  assert.equal(validatePet({ name: 'Luna', species: 'Perro' }).value.name, 'Luna')
})
test('rechaza especie no contemplada', () => {
  assert.match(validatePet({ name: 'Luna', species: 'Tigre' }).error, /especie/)
})
test('rechaza fecha imposible', () => {
  assert.match(validatePet({ name: 'Luna', species: 'Gato', birth_date: '2026-02-31' }).error, /fecha/)
})
test('respeta pesos dentro de rango', () => {
  assert.equal(validatePet({ name: 'Luna', species: 'Gato', weight_kg: 4.25 }).value.weight_kg, 4.25)
  assert.match(validatePet({ name: 'Luna', species: 'Gato', weight_kg: -3 }).error, /peso/)
})
test('validación parcial requiere campos', () => {
  assert.match(validatePet({}, true).error, /campos/)
  assert.deepEqual(validatePet({ status: 'Activo' }, true).value, { status: 'Activo' })
})
test('vacunas requieren ID y fecha', () => {
  assert.equal(isUuid('00000000-0000-4000-8000-000000000001'), true)
  assert.match(validateVaccine({ pet_id: 'malo', name: 'Rabia', administered_on: '2026-01-15' }).error, /mascota/)
  assert.equal(validateVaccine({ pet_id: '00000000-0000-4000-8000-000000000001', name: 'Rabia', administered_on: '2026-01-15' }).value.name, 'Rabia')
})
