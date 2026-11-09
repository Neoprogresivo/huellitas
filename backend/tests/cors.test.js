import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkCors } from '../lib/cors.js'

function fakeResponse() {
  const headers = {}
  return { headers, statusCode: 200, setHeader(k,v){headers[k]=v}, end(){this.ended=true} }
}

test('preflight permitido devuelve 204 y permite authorization', () => {
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173,https://demo.vercel.app'
  const res = fakeResponse()
  assert.equal(checkCors({ method:'OPTIONS',headers:{origin:'http://localhost:5173'} }, res), true)
  assert.equal(res.statusCode,204)
  assert.equal(res.headers['Access-Control-Allow-Origin'],'http://localhost:5173')
  assert.match(res.headers['Access-Control-Allow-Headers'],/Authorization/)
})
test('petición sin Origin no es rechazada por CORS', () => {
  const res=fakeResponse()
  assert.equal(checkCors({method:'GET',headers:{}},res),false)
})
