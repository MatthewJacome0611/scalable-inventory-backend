# Estado actual del proyecto

**Última actualización:** 10 de noviembre de 2026  
**Proyecto:** `Practica_3Capas`  
**Alcance actual:** backend REST y frontend web para administrar productos.

## Resumen

Se implementó un backend con Node.js, Express y MySQL, organizado por capas. Expone operaciones CRUD para productos en la ruta configurable `/api/v1/productos` y carga su configuración local desde `backend/.env`.

## Componentes implementados

- `backend/server.js`: punto de entrada; verifica la conexión a MySQL y luego inicia el servidor.
- `backend/src/app.js`: configura Express, middlewares y rutas.
- `backend/src/config/Database.js`: pool MySQL con instancia singleton.
- `backend/src/config/settings.js`: lectura y validación de configuración desde `.env`.
- `backend/src/models/ProductoModel.js`: modelo de producto.
- `backend/src/models/ProductoRepository.js`: operaciones de persistencia SQL parametrizadas.
- `backend/src/controllers/ProductosController.js`: lógica de respuesta HTTP.
- `backend/src/routes/productos.routes.js`: rutas CRUD.
- `backend/src/middlewares/`: CORS, logs, sanitización, hash de respuesta, paginación, validación y manejo de errores.
- `backend/test/api.test.js`: pruebas automáticas de CORS y validación.
- `frontend/`: interfaz web adaptable (`index.html`, `styles.css`, `app.js`) para listar, consultar, crear, reemplazar, actualizar parcialmente y eliminar productos.
- `frontend/server.js`: servidor estático independiente y configuración cliente de la URL API.
- `frontend/.env`: puerto del frontend y URL base de la API; no incluye credenciales de MySQL y está excluido del control de versiones.
- `backend/.env.example`: ejemplo de nombres y valores de configuración; no contiene credenciales reales.
- `backend/database/schema.sql`: SQL de ejemplo para crear la base y tabla de productos.

## API disponible

La URL base predeterminada es `http://localhost:5051/api/v1/productos`. El puerto y la ruta se pueden cambiar en `.env`.

Frontend y backend se ejecutan como dos servidores separados:

- Frontend: `http://localhost:5173/` (carpeta `frontend/`).
- Backend API: `http://localhost:5051/api/v1/productos` (carpeta `backend/`).

El frontend lee su URL API desde `/app-config.json`, servido por el servidor independiente del frontend. El backend ya no sirve archivos de interfaz; CORS está configurado como `*` en el `.env` local, por lo que permite acceso desde el origen del frontend en desarrollo. En un entorno publicado se recomienda restringirlo a `http://localhost:5173` o al dominio real del frontend.

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/v1/productos?page=1` | Lista productos paginados. El límite predeterminado es 100 por página. |
| GET | `/api/v1/productos/:id` | Consulta un producto por ID. |
| POST | `/api/v1/productos` | Crea un producto. Requiere `nombre`, `categoria` y `pvp`. |
| PUT | `/api/v1/productos/:id` | Reemplaza los tres campos del producto. |
| PATCH | `/api/v1/productos/:id` | Modifica uno o más campos enviados. |
| DELETE | `/api/v1/productos/:id` | Elimina el producto; responde `204` si se eliminó. |

Las validaciones requieren nombres y categorías de al menos tres caracteres, y un precio numérico mayor o igual a cero. Los IDs deben ser enteros positivos.

## Configuración

`backend/.env` contiene la configuración local de la base de datos y del servidor. Se debe conservar fuera de documentación compartida y control de versiones; `backend/.gitignore` excluye `.env`. No copiar sus credenciales en este archivo ni compartirlas.

Además de `PORT` y las variables `DB_*` originales, se pueden configurar `API_PRODUCTS_PATH`, `JSON_BODY_LIMIT`, `CORS_ORIGIN`, `CORS_METHODS`, `CORS_ALLOWED_HEADERS`, `PAGINATION_LIMIT`, `DB_CONNECTION_LIMIT`, `DB_QUEUE_LIMIT`, `DB_ENABLE_KEEP_ALIVE` y `DB_KEEP_ALIVE_INITIAL_DELAY`. Los valores de ejemplo están en `backend/.env.example`; los cambios en `.env` requieren reiniciar el servidor.

## Base de datos: revisar antes de ejecutar el esquema

La configuración local de `.env` apunta a una base llamada `bddproductos`. En cambio, `backend/database/schema.sql` actualmente crea y selecciona `inventario_db`. **Hay una discrepancia entre ambos nombres.** Antes de ejecutar ese script, hay que confirmar cuál base se usará y alinear `DB_NAME` en `.env` o el nombre del esquema SQL. No ejecutar el script a ciegas si ya existe una base con datos.

La tabla que espera el repositorio se llama `productos` y tiene estas columnas:

- `id`: entero autoincremental.
- `nombre`: texto.
- `categoria`: texto.
- `pvp`: decimal no negativo.

El estado de conexión y la presencia de esta tabla en el servidor MySQL local no se verificaron durante la última validación automatizada. El servidor no inicia la API si no puede abrir una conexión a la base configurada.

## Instalación, ejecución y pruebas

Abre dos terminales de PowerShell:

```powershell
# Terminal 1, desde backend
cd C:\Desarrollo_de_software\Practica_3Capas\backend
npm install
npm test
npm start
```

En la segunda terminal:

```powershell
# Terminal 2, desde frontend
cd C:\Desarrollo_de_software\Practica_3Capas\frontend
npm test
npm start
```

Abre `http://localhost:5173/`. En la última validación pasaron **6 pruebas del backend** y **5 pruebas del frontend**. También se comprobó que la página y la configuración responden desde `5173`, y que el preflight CORS hacia `5051` devuelve `204` con el origen permitido. Las pruebas automatizadas no verifican CRUD contra MySQL; para la prueba completa, iniciar MySQL y ambos servidores con sus `.env` configurados.

## Pendientes y consideraciones

1. Resolver la diferencia entre `DB_NAME` (`bddproductos`) y la base creada por `schema.sql` (`inventario_db`).
2. Ejecutar y comprobar los cinco métodos CRUD contra la base de datos real.
3. La paginación limita la respuesta a 100 registros por página por defecto; se puede cambiar con `PAGINATION_LIMIT`.
4. El frontend es una interfaz HTML/CSS/JavaScript sencilla ubicada en `frontend/`, con su servidor y puerto propios; no se ha conectado con un framework frontend.