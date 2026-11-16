# Context
This repository is a backend REST API built with Node.js and Express for a TCG E-commerce platform. It handles full CRUD operations, 100-item pagination, and manages a database of 10,000+ items using an N-tier MVC architecture, Singleton/Repository patterns, and Chain of Responsibility middleware.

# Agent Tasks

1. **Code Cleanup & De-academization:**
   - Scan all `.js` files.
   - Remove any comments or code artifacts referencing "HCI university assignment", "Figma to VS Code", or "student report".
   - Refactor Spanish variable names to English (e.g., `productos` -> `products`, `categoria` -> `category`, `pvp` -> `price`).
   - Ensure SQL connection logic (MySQL/MariaDB) is abstracted into a robust database config file using `dotenv`.

2. **Folder Structure Enforcement:**
   - Ensure the architecture strictly follows: `src/controllers`, `src/models`, `src/routes`, `src/middlewares`, and `src/config`. Move files accordingly if they are misplaced.

3. **README.md Generation:**
   - Generate a `README.md` at the root.
   - **Title:** Enterprise E-Commerce REST API
   - **Description:** A scalable N-tier Node.js API designed for high-volume catalog management, implementing advanced design patterns (Repository, Singleton) and custom middleware.
   - **Tech Stack:** Node.js, Express, MySQL/MariaDB, REST.
   - Include a section detailing the "Chain of Responsibility" implementation for request validation.
   - Add a brief API endpoint documentation table (e.g., `GET /api/products`, `POST /api/products`).