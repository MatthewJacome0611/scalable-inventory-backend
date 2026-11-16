# Guía de Implementación del Backend: API REST de Productos

Este documento detalla la arquitectura, patrones de diseño y código fuente para construir un backend robusto basado en **Node.js**, **Express** y persistencia en **MySQL**, operando en el puerto **`5051`**.

## 1. Arquitectura y Patrones Aplicados

* **Estilo Arquitectónico:**
  * **N-Capas:** Separación estricta entre capa de presentación/enrutamiento (`routes`), capa de orquestación de negocio (`controllers`), capa intermedia transversal (`middlewares`), capa de persistencia (`models`/`repositories`) y capa de conexión a base de datos (`config/database`).
  * **REST:** Recursos orientados a sustantivos (`/api/v1/productos`), métodos HTTP canónicos (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) y códigos de estado estándar de la RFC 9110.

* **Patrones Arquitectónicos:**
  * **MVC (Model-View-Controller):** El *Model* encapsula los datos y el acceso a la base de datos MySQL; el *Controller* maneja la lógica de solicitud/respuesta; la *View* corresponde a las respuestas estructuradas en formato JSON.

* **Patrones de Diseño de Software:**
  * **Singleton:** La gestión del pool de conexiones MySQL y el Repositorio de productos garantizan una única instancia compartida durante el ciclo de vida del proceso de Node.js.
  * **Repository:** Desacopla la lógica de negocio de las sentencias SQL concretas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
  * **Chain of Responsibility:** Implementación secuencial de validaciones desacopladas mediante funciones middleware independientes.

---

## 2. Estructura de Directorios

```
backend/
├── data/
│   └── productos.json          # Soporte de fallback opcional
├── src/
│   ├── config/
│   │   └── Database.js         # Singleton para Pool de MySQL
│   ├── models/
│   │   ├── ProductoModel.js
│   │   └── ProductoRepository.js
│   ├── controllers/
│   │   └── ProductosController.js
│   ├── middlewares/
│   │   ├── chainValidator.js
│   │   ├── cors.js
│   │   ├── errorHandler.js
│   │   ├── hash.js
│   │   ├── logger.js
│   │   ├── pagination.js
│   │   └── sanitization.js
│   ├── routes/
│   │   └── productos.routes.js
│   └── app.js
├── .env
├── package.json
└── server.js
```

---

## 3. Configuración Inicial (`package.json` y `.env`)

### 3.1 `package.json`
Se añade el driver oficial de alto rendimiento `mysql2` con soporte para promesas:

```json
{
  "name": "backend-productos-api",
  "version": "1.0.0",
  "description": "API REST N-Capas con Express, MySQL, Singleton, Repository y Chain of Responsibility",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "mysql2": "^3.12.0"
  }
}
```

### 3.2 Variables de Entorno (`.env`)
Configuración de la base de datos con usuario `root`:

```env
PORT=5051
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=inventario_db
```

---

## 4. Conexión a MySQL (Patrón Singleton) (`src/config/Database.js`)

Se implementa un pool de conexiones mediante `mysql2/promise` encapsulado bajo el patrón Singleton, garantizando reutilización de hilos y reconexión automática sin agotar sockets:

```javascript
import mysql from 'mysql2/promise';

export class Database {
  static #instance = null;
  #pool = null;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }

    this.#pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventario_db',
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });

    Database.#instance = this;
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }

  getPool() {
    return this.#pool;
  }

  async testConnection() {
    try {
      const conn = await this.#pool.getConnection();
      console.log('[MySQL] Conexión establecida con éxito al pool.');
      conn.release();
      return true;
    } catch (error) {
      console.error('[MySQL Error] No se pudo conectar a la base de datos:', error.message);
      throw error;
    }
  }
}
```

---

## 5. Capa de Modelos y Persistencia

### 5.1 Entidad `ProductoModel` (`src/models/ProductoModel.js`)

```javascript
export class Producto {
  constructor(id, nombre, categoria, pvp) {
    this.id = Number(id);
    this.nombre = String(nombre).trim();
    this.categoria = String(categoria).trim();
    this.pvp = Number(parseFloat(pvp).toFixed(2));
  }
}
```

### 5.2 Patrón Singleton & Repository con MySQL (`src/models/ProductoRepository.js`)

El repositorio centraliza todas las consultas SQL preparadas (*prepared statements*) para evitar inyección SQL, abstrayendo a la capa de controlador de los detalles de la base de datos:

```javascript
import { Database } from '../config/Database.js';

export class ProductoRepository {
  static #instance = null;

  constructor() {
    if (ProductoRepository.#instance) {
      return ProductoRepository.#instance;
    }
    this.db = Database.getInstance().getPool();
    ProductoRepository.#instance = this;
  }

  static getInstance() {
    if (!ProductoRepository.#instance) {
      ProductoRepository.#instance = new ProductoRepository();
    }
    return ProductoRepository.#instance;
  }

  // Conteo total para paginación
  async countAll() {
    const [rows] = await this.db.query('SELECT COUNT(*) AS total FROM productos');
    return rows[0].total;
  }

  // Obtener registros paginados
  async findPaginated(limit, offset) {
    const [rows] = await this.db.query(
      'SELECT id, nombre, categoria, pvp FROM productos ORDER BY id ASC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );
    return rows;
  }

  // Búsqueda por ID
  async findById(id) {
    const [rows] = await this.db.query(
      'SELECT id, nombre, categoria, pvp FROM productos WHERE id = ?',
      [Number(id)]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Inserción de nuevo producto
  async create(productoData) {
    const { nombre, categoria, pvp } = productoData;
    const [result] = await this.db.query(
      'INSERT INTO productos (nombre, categoria, pvp) VALUES (?, ?, ?)',
      [nombre, categoria, pvp]
    );

    return {
      id: result.insertId,
      nombre,
      categoria,
      pvp: Number(pvp)
    };
  }

  // Reemplazo completo (PUT)
  async update(id, updateData) {
    const { nombre, categoria, pvp } = updateData;
    const [result] = await this.db.query(
      'UPDATE productos SET nombre = ?, categoria = ?, pvp = ? WHERE id = ?',
      [nombre, categoria, pvp, Number(id)]
    );

    if (result.affectedRows === 0) return null;
    return { id: Number(id), nombre, categoria, pvp: Number(pvp) };
  }

  // Modificación parcial dinámica (PATCH)
  async patch(id, partialData) {
    const fields = [];
    const values = [];

    if (partialData.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(partialData.nombre);
    }
    if (partialData.categoria !== undefined) {
      fields.push('categoria = ?');
      values.push(partialData.categoria);
    }
    if (partialData.pvp !== undefined) {
      fields.push('pvp = ?');
      values.push(Number(partialData.pvp));
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(Number(id));
    const sql = `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await this.db.query(sql, values);

    if (result.affectedRows === 0) return null;
    return await this.findById(id);
  }

  // Eliminación por ID (DELETE)
  async delete(id) {
    const [result] = await this.db.query(
      'DELETE FROM productos WHERE id = ?',
      [Number(id)]
    );
    return result.affectedRows > 0;
  }
}
```

---

## 6. Capa de Middlewares

### 6.1 Registro de Logs (`src/middlewares/logger.js`)

```javascript
export const loggerMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
};
```

### 6.2 Control de CORS (`src/middlewares/cors.js`)

```javascript
export const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};
```

### 6.3 Sanitización (`src/middlewares/sanitization.js`)

```javascript
export const sanitizationMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = value.replace(/<\/?[^>]+(>|$)/g, '').trim();
      }
    }
  }
  next();
};
```

### 6.4 Generación de Hash e Integridad ETag (`src/middlewares/hash.js`)

```javascript
import crypto from 'node:crypto';

export const hashMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    const payloadString = JSON.stringify(body);
    const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
    res.setHeader('ETag', `"${hash}"`);
    res.setHeader('X-Content-Hash', hash);
    return originalJson(body);
  };

  next();
};
```

### 6.5 Paginación de 100 en 100 (`src/middlewares/pagination.js`)

```javascript
export const paginationMiddleware = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 100; // Fijo de 100 en 100
  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };
  next();
};
```

### 6.6 Cadena de Responsabilidad para Validación (`src/middlewares/chainValidator.js`)

```javascript
class ValidationHandler {
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }

  handle(request) {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return null;
  }
}

class NombreValidator extends ValidationHandler {
  handle(request) {
    const { isRequired, body } = request;
    if (isRequired || body.nombre !== undefined) {
      if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.length < 3) {
        return 'El campo "nombre" es obligatorio y debe tener al menos 3 caracteres.';
      }
    }
    return super.handle(request);
  }
}

class CategoriaValidator extends ValidationHandler {
  handle(request) {
    const { isRequired, body } = request;
    if (isRequired || body.categoria !== undefined) {
      if (!body.categoria || typeof body.categoria !== 'string' || body.categoria.length < 3) {
        return 'El campo "categoria" es obligatorio y debe tener al menos 3 caracteres.';
      }
    }
    return super.handle(request);
  }
}

class PvpValidator extends ValidationHandler {
  handle(request) {
    const { isRequired, body } = request;
    if (isRequired || body.pvp !== undefined) {
      const pvpNum = Number(body.pvp);
      if (isNaN(pvpNum) || pvpNum < 0) {
        return 'El campo "pvp" debe ser un número decimal válido mayor o igual a 0.';
      }
    }
    return super.handle(request);
  }
}

const buildValidationChain = () => {
  const nombreH = new NombreValidator();
  const categoriaH = new CategoriaValidator();
  const pvpH = new PvpValidator();

  nombreH.setNext(categoriaH).setNext(pvpH);
  return nombreH;
};

export const validateProductoBody = (isRequired = true) => {
  const chain = buildValidationChain();

  return (req, res, next) => {
    const error = chain.handle({ body: req.body, isRequired });
    if (error) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: error
      });
    }
    next();
  };
};
```

### 6.7 Manejador Global de Errores (`src/middlewares/errorHandler.js`)

```javascript
export const errorHandlerMiddleware = (err, req, res, next) => {
  console.error('[Error No Controlado]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    timestamp: new Date().toISOString()
  });
};
```

---

## 7. Capa de Controlador (`src/controllers/ProductosController.js`)

El controlador `ProductosController` atiende las solicitudes HTTP invocando el repositorio MySQL y gestionando códigos HTTP precisos (`200`, `201`, `204`, `206`, `400`, `404`, `500`):

```javascript
import { ProductoRepository } from '../models/ProductoRepository.js';

export class ProductosController {
  constructor() {
    this.repository = ProductoRepository.getInstance();
  }

  getAll = async (req, res, next) => {
    try {
      const { page, limit, offset } = req.pagination;
      
      const [total, items] = await Promise.all([
        this.repository.countAll(),
        this.repository.findPaginated(limit, offset)
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      const statusCode = total > limit ? 206 : 200;

      return res.status(statusCode).json({
        meta: {
          totalRecords: total,
          currentPage: page,
          pageSize: limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        data: items
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await this.repository.findById(id);

      if (!item) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${id} no encontrado.`
        });
      }

      return res.status(200).json({ data: item });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { nombre, categoria, pvp } = req.body;
      const nuevoProducto = await this.repository.create({
        nombre,
        categoria,
        pvp: Number(pvp)
      });

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Producto creado exitosamente.',
        data: nuevoProducto
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nombre, categoria, pvp } = req.body;

      const actualizado = await this.repository.update(id, {
        nombre,
        categoria,
        pvp: Number(pvp)
      });

      if (!actualizado) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${id} no encontrado para actualizar.`
        });
      }

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Producto reemplazado completamente (PUT).',
        data: actualizado
      });
    } catch (error) {
      next(error);
    }
  };

  patch = async (req, res, next) => {
    try {
      const { id } = req.params;
      const patchData = {};

      if (req.body.nombre !== undefined) patchData.nombre = req.body.nombre;
      if (req.body.categoria !== undefined) patchData.categoria = req.body.categoria;
      if (req.body.pvp !== undefined) patchData.pvp = Number(req.body.pvp);

      const parcialActualizado = await this.repository.patch(id, patchData);

      if (!parcialActualizado) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${id} no encontrado para modificación parcial.`
        });
      }

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Producto modificado parcialmente (PATCH).',
        data: parcialActualizado
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await this.repository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: `Producto con ID ${id} no existe.`
        });
      }

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
```

---

## 8. Definición de Rutas (`src/routes/productos.routes.js`)

```javascript
import { Router } from 'express';
import { ProductosController } from '../controllers/ProductosController.js';
import { paginationMiddleware } from '../middlewares/pagination.js';
import { validateProductoBody } from '../middlewares/chainValidator.js';

const router = Router();
const controller = new ProductosController();

// GET /api/v1/productos (Paginado de 100 en 100)
router.get('/', paginationMiddleware, controller.getAll);

// GET /api/v1/productos/:id
router.get('/:id', controller.getById);

// POST /api/v1/productos (Validación obligatoria de todos los campos)
router.post('/', validateProductoBody(true), controller.create);

// PUT /api/v1/productos/:id (Reemplazo total)
router.put('/:id', validateProductoBody(true), controller.update);

// PATCH /api/v1/productos/:id (Actualización parcial opcional)
router.patch('/:id', validateProductoBody(false), controller.patch);

// DELETE /api/v1/productos/:id
router.delete('/:id', controller.delete);

export default router;
```

---

## 9. Configuración de Express (`src/app.js`)

```javascript
import express from 'express';
import { corsMiddleware } from './middlewares/cors.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { sanitizationMiddleware } from './middlewares/sanitization.js';
import { hashMiddleware } from './middlewares/hash.js';
import { errorHandlerMiddleware } from './middlewares/errorHandler.js';
import productosRouter from './routes/productos.routes.js';

const app = express();

// Middlewares Globales
app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(sanitizationMiddleware);
app.use(hashMiddleware);

// Rutas API
app.use('/api/v1/productos', productosRouter);

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Ruta ${req.originalUrl} no encontrada.`
  });
});

// Middleware Global de Errores
app.use(errorHandlerMiddleware);

export default app;
```

---

## 10. Punto de Entrada del Servidor (`server.js`)

Inicializa la conexión con el pool de MySQL antes de levantar la escucha HTTP en el puerto `5051`:

```javascript
import 'dotenv/config';
import app from './src/app.js';
import { Database } from './src/config/Database.js';

const PORT = process.env.PORT || 5051;

async function bootstrap() {
  try {
    // 1. Probar conexión al pool de MySQL (Singleton)
    await Database.getInstance().testConnection();

    // 2. Levantar el servidor HTTP
    app.listen(PORT, () => {
      console.log(`[Servidor Iniciado] API ejecutándose en el puerto ${PORT}`);
      console.log(`[Endpoint Base] http://localhost:${PORT}/api/v1/productos`);
    });
  } catch (error) {
    console.error('[Error de Arranque] No fue posible iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

bootstrap();
```

---

## 11. Guía de Ejecución y Pruebas con cURL

### 11.1 Instalación y Ejecución

```bash
# 1. Instalar dependencias requeridas (incluyendo mysql2 y dotenv)
npm install

# 2. Iniciar el servicio backend
npm start
```

### 11.2 Comprobaciones con cURL

* **Listar los primeros 100 productos (Página 1):**
  ```bash
  curl -i -X GET "http://localhost:5051/api/v1/productos?page=1"
  ```

* **Consultar un producto puntual por ID:**
  ```bash
  curl -i -X GET "http://localhost:5051/api/v1/productos/5"
  ```

* **Crear nuevo producto (POST):**
  ```bash
  curl -i -X POST "http://localhost:5051/api/v1/productos" \
       -H "Content-Type: application/json" \
       -d '{"nombre": "Teclado Mecánico Custom", "categoria": "Tecnología", "pvp": 89.90}'
  ```

* **Reemplazar producto por completo (PUT):**
  ```bash
  curl -i -X PUT "http://localhost:5051/api/v1/productos/5" \
       -H "Content-Type: application/json" \
       -d '{"nombre": "Monitor 144Hz 27 Pulgadas Pro", "categoria": "Tecnología", "pvp": 279.00}'
  ```

* **Actualizar solo el precio (PATCH):**
  ```bash
  curl -i -X PATCH "http://localhost:5051/api/v1/productos/5" \
       -H "Content-Type: application/json" \
       -d '{"pvp": 249.50}'
  ```

* **Eliminar producto (DELETE):**
  ```bash
  curl -i -X DELETE "http://localhost:5051/api/v1/productos/5"
  ```