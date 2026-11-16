# Backend de productos

API REST de productos con Node.js, Express y MySQL, organizada en capas. Los parámetros globales del servidor se leen desde `.env`.

## Requisitos

- Node.js 20 o superior
- MySQL 8 o compatible

## Configuración

1. Crea la base y la tabla ejecutando [`database/schema.sql`](./database/schema.sql) en MySQL.
2. Conserva tus credenciales en `.env` y ajusta allí los parámetros globales si hace falta. `.env.example` documenta los nombres de las variables disponibles.
3. Desde esta carpeta ejecuta:

   ```sh
   npm install
   npm start
   ```

El servidor comprueba la conexión a MySQL antes de aceptar solicitudes. Por defecto, la API queda disponible en `http://localhost:5051/api/v1/productos`.

El backend solo sirve la API. La interfaz está separada en `../frontend` y corre en su propio servidor, normalmente en `http://localhost:5173/`. Para iniciar ambos servicios, consulta [`../frontend/README.md`](../frontend/README.md). CORS debe permitir el origen del frontend.

### Variables globales

Además de `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`, puedes configurar:

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `API_PRODUCTS_PATH` | `/api/v1/productos` | Ruta base de la API |
| `JSON_BODY_LIMIT` | `100kb` | Tamaño máximo del cuerpo JSON |
| `CORS_ORIGIN` | `*` | Origen permitido por CORS |
| `CORS_METHODS` | `GET,POST,PUT,PATCH,DELETE,OPTIONS` | Métodos permitidos por CORS |
| `CORS_ALLOWED_HEADERS` | `Content-Type,Authorization,X-Requested-With` | Encabezados permitidos por CORS |
| `PAGINATION_LIMIT` | `100` | Productos por página |
| `DB_CONNECTION_LIMIT` | `15` | Conexiones simultáneas del pool |
| `DB_QUEUE_LIMIT` | `0` | Solicitudes en cola del pool (`0` no limita la cola) |
| `DB_ENABLE_KEEP_ALIVE` | `true` | Habilita keep-alive para MySQL |
| `DB_KEEP_ALIVE_INITIAL_DELAY` | `10000` | Retardo inicial de keep-alive en milisegundos |

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/productos?page=1` | Lista productos, 100 por página |
| GET | `/api/v1/productos/:id` | Consulta un producto |
| POST | `/api/v1/productos` | Crea un producto |
| PUT | `/api/v1/productos/:id` | Reemplaza un producto |
| PATCH | `/api/v1/productos/:id` | Actualiza campos especificados |
| DELETE | `/api/v1/productos/:id` | Elimina un producto |

El cuerpo de creación y reemplazo requiere `nombre` (mínimo 3 caracteres), `categoria` (mínimo 3 caracteres) y `pvp` (número mayor o igual a cero). PATCH acepta cualquiera de esos campos.

## Ejemplo

```sh
curl -i -X POST http://localhost:5051/api/v1/productos \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Teclado mecánico\",\"categoria\":\"Tecnología\",\"pvp\":89.90}"
```
