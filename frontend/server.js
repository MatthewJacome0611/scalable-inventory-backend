import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDirectory = fileURLToPath(new URL('./', import.meta.url));
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
]);

const parsePort = (rawPort) => {
  const port = Number(rawPort || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('FRONTEND_PORT debe ser un puerto entre 1 y 65535.');
  }
  return port;
};

const parseApiBaseUrl = (rawUrl) => {
  const value = rawUrl || 'http://localhost:5051/api/v1/productos';
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API_BASE_URL debe ser una URL absoluta del backend.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API_BASE_URL debe usar HTTP o HTTPS, sin credenciales, parámetros ni fragmentos.');
  }

  return url.toString().replace(/\/+$/, '');
};

const jsonResponse = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
};

export const createFrontendServer = ({
  port = process.env.FRONTEND_PORT,
  apiBaseUrl = process.env.API_BASE_URL
} = {}) => {
  const frontendPort = parsePort(port);
  const backendUrl = parseApiBaseUrl(apiBaseUrl);

  const server = createServer(async (req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url, 'http://localhost').pathname;
    } catch {
      return jsonResponse(res, 400, { message: 'URL de solicitud no válida.' });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return jsonResponse(res, 405, { message: 'Método no permitido.' });
    }

    if (pathname === '/app-config.json') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ apiBaseUrl: backendUrl }));
    }

    const asset = assets.get(pathname);
    if (!asset) {
      return jsonResponse(res, 404, { message: 'Recurso no encontrado.' });
    }

    try {
      const content = await readFile(join(publicDirectory, asset[0]));
      res.writeHead(200, {
        'Content-Type': asset[1],
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      console.error('[Frontend] No se pudo leer un archivo estático:', error.message);
      return jsonResponse(res, 500, { message: 'No se pudo cargar el recurso solicitado.' });
    }
  });

  return { server, port: frontendPort };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { server, port } = createFrontendServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`[Frontend iniciado] http://localhost:${port}`);
    console.log(`[API configurada] ${parseApiBaseUrl(process.env.API_BASE_URL)}`);
  });

  server.on('error', (error) => {
    console.error('[Frontend] No fue posible iniciar el servidor:', error.message);
    process.exitCode = 1;
  });
}
