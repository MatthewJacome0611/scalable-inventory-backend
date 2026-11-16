# Enterprise E-Commerce REST API

A scalable N-tier Node.js API designed for high-volume catalog management, implementing advanced design patterns (Repository, Singleton) and custom middleware.

## Overview

This project delivers a backend for an enterprise e-commerce catalog, exposing a robust REST API for product management with pagination, validation, sanitization, logging, CORS support, and fail-safe database connectivity. It follows a layered architecture built around Express, MySQL/MariaDB, and a modular middleware stack.

## Tech Stack

- Node.js
- Express
- MySQL / MariaDB
- REST API
- dotenv configuration management

## Architecture

The backend follows a strict N-tier MVC-inspired layout:

- `backend/src/controllers` — HTTP controllers
- `backend/src/models` — domain models and repository logic
- `backend/src/routes` — route definitions
- `backend/src/middlewares` — request validation, logging, sanitization, CORS, etc.
- `backend/src/config` — environment configuration and database connection management

## Design Patterns

- Repository pattern: persists data access behind reusable repository methods.
- Singleton pattern: centralizes the database pool and ensures a single shared instance.
- Chain of Responsibility: validation is performed through a middleware chain, where each handler checks a part of the request before passing control to the next handler.

### Chain of Responsibility implementation

The request validation flow is implemented in `backend/src/middlewares/chainValidator.js`. It creates a sequential validation chain that checks:

1. Name validation
2. Category validation
3. Price validation
4. ID validation for update/delete/read-by-id routes

If any validation rule fails, the chain stops and returns a structured 400 response with the precise validation message.

## Features

- Full CRUD support for products
- Pagination for large catalogs
- Input validation and sanitization
- Structured error handling
- Response hashing via ETag/X-Content-Hash headers
- Centralized configuration via environment variables
- Database pooling with connection validation

## Project Structure

```text
API Rest en Node.js/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── database/
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── README.md
├── frontend/
├── Instrucciones.md
├── EstadoActual.md
└── README.md
```

## Quick Start

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables using the `.env.example` template and set your MySQL connection values.

4. Start the API:

   ```bash
   npm start
   ```

5. The API is available on the configured port (default: `http://localhost:5051`).

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/productos` | Lists products with pagination |
| GET | `/api/v1/productos/:id` | Retrieves a product by ID |
| POST | `/api/v1/productos` | Creates a new product |
| PUT | `/api/v1/productos/:id` | Replaces a product completely |
| PATCH | `/api/v1/productos/:id` | Updates selected fields |
| DELETE | `/api/v1/productos/:id` | Deletes a product |

## Validation Rules

- `nombre`: required, minimum 3 characters
- `categoria`: required, minimum 3 characters
- `pvp`: numeric value greater than or equal to 0
- `id`: positive integer only

## Notes

This repository includes a separate frontend client in the `frontend/` folder, which communicates with the backend via CORS-enabled API routes.
