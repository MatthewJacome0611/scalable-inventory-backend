import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createFrontendServer } from '../server.js';

let server;
let baseUrl;

before(async () => {
  ({ server } = createFrontendServer({
    port: 0,
    apiBaseUrl: 'http://localhost:5051/api/v1/productos'
  }));
  server.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('sirve el frontend en su propio servidor', async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /Inventario/);
});

test('entrega al cliente la URL configurable del backend', async () => {
  const response = await fetch(`${baseUrl}/app-config.json`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    apiBaseUrl: 'http://localhost:5051/api/v1/productos'
  });
});

test('sirve los recursos estáticos del frontend', async () => {
  const [script, stylesheet] = await Promise.all([
    fetch(`${baseUrl}/app.js`),
    fetch(`${baseUrl}/styles.css`)
  ]);

  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
  assert.match(await script.text(), /method: 'PATCH'/);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers.get('content-type'), /text\/css/);
});

test('rechaza rutas desconocidas y métodos no permitidos', async () => {
  const [missing, method] = await Promise.all([
    fetch(`${baseUrl}/server.js`),
    fetch(baseUrl, { method: 'POST' })
  ]);

  assert.equal(missing.status, 404);
  assert.equal(method.status, 405);
});

test('valida puerto y URL de API del frontend', () => {
  assert.throws(() => createFrontendServer({ port: 'invalid' }), /FRONTEND_PORT/);
  assert.throws(() => createFrontendServer({ apiBaseUrl: '/api/v1/productos' }), /API_BASE_URL/);
});
