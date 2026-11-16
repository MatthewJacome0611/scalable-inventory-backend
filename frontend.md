# Guía de Implementación del Frontend: Panel de Gestión de Productos

Esta guía detalla la creación de una interfaz gráfica (SPA - Single Page Application) interactiva, responsiva y ligera para conectarse al backend en el puerto **`5051`** (`http://localhost:5051/api/v1/productos`). Permite ejecutar todas las operaciones CRUD: listar con paginación de 100 en 100, crear (`POST`), reemplazo completo (`PUT`), actualización rápida de precio (`PATCH`) y eliminación (`DELETE`).

---

## 1. Arquitectura de la Interfaz
frontend_specification_implementation
* **Tecnología:** HTML5 semántico, Tailwind CSS (vía CDN oficial para diseño moderno y reactivo sin dependencias de compilación) y JavaScript Vanilla modular (`fetch` API asíncrona).
* **Consumo de API:**
  * Base URL: `http://localhost:5051/api/v1/productos`
  * Parámetro de paginación: `?page=N` (consume los lotes de 100 registros retornados por el backend con códigos HTTP `200` o `206`).
* **Manejo de Estados de UI:**
  * Modales independientes para **Crear / Editar (PUT)** y para **Ajuste Rápido de Precio (PATCH)**.
  * Mensajes de confirmación visuales con *Toasts* temporizados (éxito y error).
  * Diálogo de confirmación nativo para eliminación con código HTTP `204 No Content`.

---

## 2. Estructura del Proyecto Frontend

Puedes ubicar esta interfaz en una carpeta separada o servirla como archivo estático:

```
frontend/
└── index.html       # Interfaz completa autocontenida (HTML + Tailwind + JavaScript)
```

---

## 3. Código Fuente Completo (`frontend/index.html`)

Crea el archivo `index.html` y copia el siguiente código:

```html
<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gestión de Productos - Panel Administrativo</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="h-full flex flex-col font-sans text-slate-800">

  <!-- Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow">
          P
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 leading-tight">Catálogo de Productos</h1>
          <p class="text-xs text-slate-500">API Backend: <span class="font-mono text-blue-600">localhost:5051</span></p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button id="btnRecargar" class="px-3.5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
          ↻ Refrescar
        </button>
        <button id="btnNuevo" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">
          + Nuevo Producto
        </button>
      </div>
    </div>
  </header>

  <!-- Contenido Principal -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
    <!-- Barra de Estado / Resumen -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <div id="infoPaginacion" class="text-sm text-slate-600">
        Cargando catálogo...
      </div>
      <!-- Controles de Paginación Superior/Inferior -->
      <div class="flex items-center space-x-2">
        <button id="btnPrev" disabled class="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
          &larr; Anterior
        </button>
        <span id="badgePagina" class="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded">
          Pág. 1
        </span>
        <button id="btnNext" disabled class="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
          Siguiente &rarr;
        </button>
      </div>
    </div>

    <!-- Contenedor de la Tabla -->
    <div class="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div class="overflow-x-auto flex-1">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">
            <tr>
              <th scope="col" class="py-3 px-4 w-20 text-center">ID</th>
              <th scope="col" class="py-3 px-4">Producto</th>
              <th scope="col" class="py-3 px-4 w-44">Categoría</th>
              <th scope="col" class="py-3 px-4 w-32 text-right">PVP</th>
              <th scope="col" class="py-3 px-4 w-52 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody id="tablaCuerpo" class="divide-y divide-slate-100 bg-white">
            <tr>
              <td colspan="5" class="text-center py-12 text-slate-400 font-medium">
                Conectando con http://localhost:5051...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Modal: Crear / Editar Total (POST y PUT) -->
  <div id="modalForm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 id="modalTitulo" class="font-bold text-slate-800 text-base">Nuevo Producto</h3>
        <button type="button" class="btnCerrarModal text-slate-400 hover:text-slate-600 text-lg">&times;</button>
      </div>
      <form id="formProducto" class="p-6 space-y-4">
        <input type="hidden" id="prodId" value="">
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Nombre</label>
          <input type="text" id="prodNombre" required minlength="3" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Laptop Gamer Asus">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Categoría</label>
          <input type="text" id="prodCategoria" required minlength="3" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Tecnología">
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Precio de Venta (PVP)</label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-slate-400 text-sm">$</span>
            <input type="number" step="0.01" min="0" id="prodPvp" required class="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0.00">
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-2">
          <button type="button" class="btnCerrarModal px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
            Cancelar
          </button>
          <button type="submit" id="btnGuardarForm" class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">
            Guardar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Actualización Rápida de Precio (PATCH) -->
  <div id="modalPatch" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-bold text-slate-800 text-sm">Ajustar Precio (PATCH)</h3>
        <button type="button" class="btnCerrarPatch text-slate-400 hover:text-slate-600 text-lg">&times;</button>
      </div>
      <form id="formPatch" class="p-5 space-y-3">
        <input type="hidden" id="patchId" value="">
        <p id="patchDetalleProducto" class="text-xs text-slate-600 font-medium truncate"></p>
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Nuevo PVP</label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-slate-400 text-sm">$</span>
            <input type="number" step="0.01" min="0" id="patchPvp" required class="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-2">
          <button type="button" class="btnCerrarPatch px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
            Cancelar
          </button>
          <button type="submit" class="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
            Aplicar PATCH
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast de Notificaciones -->
  <div id="toast" class="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 translate-y-20 opacity-0 pointer-events-none">
  </div>

  <!-- Lógica JavaScript del Cliente -->
  <script>
    const API_URL = 'http://localhost:5051/api/v1/productos';
    let paginaActual = 1;
    let totalPaginas = 1;

    // Elementos DOM
    const tablaCuerpo = document.getElementById('tablaCuerpo');
    const infoPaginacion = document.getElementById('infoPaginacion');
    const badgePagina = document.getElementById('badgePagina');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnRecargar = document.getElementById('btnRecargar');
    const btnNuevo = document.getElementById('btnNuevo');

    // Modales
    const modalForm = document.getElementById('modalForm');
    const formProducto = document.getElementById('formProducto');
    const modalTitulo = document.getElementById('modalTitulo');
    const prodId = document.getElementById('prodId');
    const prodNombre = document.getElementById('prodNombre');
    const prodCategoria = document.getElementById('prodCategoria');
    const prodPvp = document.getElementById('prodPvp');

    const modalPatch = document.getElementById('modalPatch');
    const formPatch = document.getElementById('formPatch');
    const patchId = document.getElementById('patchId');
    const patchPvp = document.getElementById('patchPvp');
    const patchDetalleProducto = document.getElementById('patchDetalleProducto');

    // Notificaciones Toast
    function showToast(mensaje, tipo = 'success') {
      const toast = document.getElementById('toast');
      toast.innerText = mensaje;
      toast.className = `fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 pointer-events-none ${
        tipo === 'success' 
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
          : 'bg-rose-50 text-rose-800 border-rose-200'
      }`;
      toast.classList.remove('translate-y-20', 'opacity-0');

      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3500);
    }

    // 1. Cargar productos (GET paginado de 100 en 100)
    async function cargarProductos(pagina = 1) {
      tablaCuerpo.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-12 text-slate-400">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2 align-middle"></div>
            Cargando página ${pagina}...
          </td>
        </tr>`;

      try {
        const res = await fetch(`${API_URL}?page=${pagina}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Fallo al conectar`);
        
        const payload = await res.json();
        const { meta, data } = payload;

        paginaActual = meta.currentPage;
        totalPaginas = meta.totalPages;

        // Actualizar badges y botones
        badgePagina.innerText = `Pág. ${paginaActual} de ${totalPaginas}`;
        infoPaginacion.innerHTML = `Mostrando <b>${data.length}</b> productos (Total registros: <b>${meta.totalRecords}</b>)`;
        btnPrev.disabled = !meta.hasPrevPage;
        btnNext.disabled = !meta.hasNextPage;

        // Renderizar filas
        if (data.length === 0) {
          tablaCuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No hay productos disponibles.</td></tr>`;
          return;
        }

        tablaCuerpo.innerHTML = data.map(prod => `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0">
            <td class="py-2.5 px-4 font-mono text-xs text-slate-500 text-center font-bold">${prod.id}</td>
            <td class="py-2.5 px-4 font-medium text-slate-800">${prod.nombre}</td>
            <td class="py-2.5 px-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                ${prod.categoria}
              </span>
            </td>
            <td class="py-2.5 px-4 text-right font-mono font-bold text-slate-900">$${Number(prod.pvp).toFixed(2)}</td>
            <td class="py-2.5 px-4 text-center">
              <div class="inline-flex space-x-1">
                <button onclick='abrirModalEditar(${JSON.stringify(prod)})' class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition" title="Reemplazar producto (PUT)">
                  Editar (PUT)
                </button>
                <button onclick='abrirModalPatch(${prod.id}, "${prod.nombre.replace(/"/g, '&quot;')}", ${prod.pvp})' class="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition" title="Modificar solo precio (PATCH)">
                  $ PVP
                </button>
                <button onclick="eliminarProducto(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}')" class="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition" title="Eliminar (DELETE)">
                  Borrar
                </button>
              </div>
            </td>
          </tr>
        `).join('');

      } catch (err) {
        tablaCuerpo.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-10 text-rose-600 font-medium">
              Error al consultar el servidor: ${err.message}. Asegúrate de que el backend en el puerto 5051 esté activo.
            </td>
          </tr>`;
        showToast(err.message, 'error');
      }
    }

    // 2. Crear (POST) o Modificar Totalmente (PUT)
    formProducto.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = prodId.value;
      const esEdicion = Boolean(id);

      const bodyData = {
        nombre: prodNombre.value.trim(),
        categoria: prodCategoria.value.trim(),
        pvp: parseFloat(prodPvp.value)
      };

      try {
        const url = esEdicion ? `${API_URL}/${id}` : API_URL;
        const method = esEdicion ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        const respuesta = await res.json();
        if (!res.ok) throw new Error(respuesta.message || 'Error en la petición');

        showToast(esEdicion ? 'Producto actualizado con éxito (PUT).' : 'Producto creado con éxito (POST).');
        cerrarModales();
        cargarProductos(paginaActual);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // 3. Modificación Parcial (PATCH)
    formPatch.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = patchId.value;
      const nuevoPvp = parseFloat(patchPvp.value);

      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pvp: nuevoPvp })
        });

        const respuesta = await res.json();
        if (!res.ok) throw new Error(respuesta.message || 'Error al aplicar PATCH');

        showToast(`Precio actualizado a $${nuevoPvp.toFixed(2)} (PATCH)`);
        modalPatch.classList.add('hidden');
        cargarProductos(paginaActual);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // 4. Eliminar Producto (DELETE)
    async function eliminarProducto(id, nombre) {
      if (!confirm(`¿Confirmas la eliminación del producto #${id} - "${nombre}"?`)) return;

      try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.status === 204) {
          showToast(`Producto #${id} eliminado correctamente.`);
          cargarProductos(paginaActual);
        } else {
          const respuesta = await res.json();
          throw new Error(respuesta.message || 'Error al eliminar');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    }

    // Control de ventanas modales
    function abrirModalNuevo() {
      prodId.value = '';
      modalTitulo.innerText = 'Nuevo Producto (POST)';
      formProducto.reset();
      modalForm.classList.remove('hidden');
    }

    function abrirModalEditar(prod) {
      prodId.value = prod.id;
      modalTitulo.innerText = `Editar Producto #${prod.id} (PUT)`;
      prodNombre.value = prod.nombre;
      prodCategoria.value = prod.categoria;
      prodPvp.value = prod.pvp;
      modalForm.classList.remove('hidden');
    }

    function abrirModalPatch(id, nombre, pvp) {
      patchId.value = id;
      patchDetalleProducto.innerText = `#${id} - ${nombre}`;
      patchPvp.value = pvp;
      modalPatch.classList.remove('hidden');
    }

    function cerrarModales() {
      modalForm.classList.add('hidden');
      modalPatch.classList.add('hidden');
    }

    // Eventos UI
    btnNuevo.addEventListener('click', abrirModalNuevo);
    btnRecargar.addEventListener('click', () => cargarProductos(paginaActual));
    btnPrev.addEventListener('click', () => { if (paginaActual > 1) cargarProductos(paginaActual - 1); });
    btnNext.addEventListener('click', () => { if (paginaActual < totalPaginas) cargarProductos(paginaActual + 1); });

    document.querySelectorAll('.btnCerrarModal').forEach(b => b.addEventListener('click', () => modalForm.classList.add('hidden')));
    document.querySelectorAll('.btnCerrarPatch').forEach(b => b.addEventListener('click', () => modalPatch.classList.add('hidden')));

    // Inicio automático al cargar el documento
    window.addEventListener('DOMContentLoaded', () => cargarProductos(1));
  </script>
</body>
</html>
```

---

## 4. Instrucciones para Ejecutar la Interfaz

### Opción A: Abrir Directamente en el Navegador
1. Asegúrate de que el backend de Node.js esté corriendo en otra terminal (`node server.js` en el puerto `5051`).
2. Haz doble clic sobre el archivo `frontend/index.html` para abrirlo en Chrome, Firefox o Edge (gracias al middleware CORS configurado en el backend, no habrá restricciones de origen).

### Opción B: Servir con un servidor local ligero
Si prefieres servirlo mediante un servidor HTTP local para desarrollo:

```bash
# Con el paquete live-server de Node.js:
npx serve frontend -p 3000

# O utilizando el servidor nativo de Python:
cd frontend
python3 -m http.server 3000
```
Luego visita `http://localhost:3000` en tu navegador.

---

## 5. Resumen de Flujos y Códigos HTTP Gestionados

| Acción | Método HTTP | Endpoint | Código de Respuesta Esperado | Efecto en la Interfaz |
| :--- | :--- | :--- | :--- | :--- |
| **Listar lote** | `GET` | `/api/v1/productos?page=N` | `200 OK` / `206 Partial Content` | Pinta la tabla de 100 productos y calcula total de páginas. |
| **Crear** | `POST` | `/api/v1/productos` | `201 Created` | Cierra modal, notifica éxito y recarga el listado. |
| **Reemplazo total** | `PUT` | `/api/v1/productos/:id` | `200 OK` | Actualiza nombre, categoría y precio en MySQL. |
| **Ajuste de precio**| `PATCH`| `/api/v1/productos/:id` | `200 OK` | Modifica solo el campo `pvp` sin sobreescribir el resto. |
| **Eliminar** | `DELETE` | `/api/v1/productos/:id` | `204 No Content` | Elimina la fila de la base de datos tras confirmación. |