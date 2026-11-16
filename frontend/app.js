const productsBody = document.querySelector('#products-body');
const notice = document.querySelector('#notice');
const pageInput = document.querySelector('#page-input');
const paginationSummary = document.querySelector('#pagination-summary');
const editForm = document.querySelector('#edit-form');
const lookupId = document.querySelector('#lookup-id');
const editInputs = [...editForm.querySelectorAll('input')];
const putButton = document.querySelector('#put-button');
const patchButton = document.querySelector('#patch-button');
const deleteButton = document.querySelector('#delete-button');

let apiBase = '';
let currentPage = 1;
let totalPages = 1;
let selectedProduct = null;

const showNotice = (message, type = 'success') => {
  notice.textContent = message;
  notice.className = `notice${type === 'error' ? ' error' : type === 'info' ? ' info' : ''}`;
  notice.hidden = false;
};

const clearNotice = () => {
  notice.hidden = true;
  notice.textContent = '';
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || `La solicitud falló con el estado ${response.status}.`);
  }

  return body;
};

const productValues = () => Object.fromEntries(
  editInputs.map((input) => [input.name, input.name === 'pvp' ? Number(input.value) : input.value.trim()])
);

const changedValues = () => {
  const values = productValues();
  return Object.fromEntries(
    Object.entries(values).filter(([field, value]) => String(value) !== String(selectedProduct[field]))
  );
};

const updateEditButtons = () => {
  const isSelected = Boolean(selectedProduct);
  const hasChanges = isSelected && Object.keys(changedValues()).length > 0;
  for (const input of editInputs) input.disabled = !isSelected;
  putButton.disabled = !isSelected || !hasChanges;
  patchButton.disabled = !hasChanges;
  deleteButton.disabled = !isSelected;
};

const renderProducts = (products) => {
  productsBody.replaceChildren();

  if (products.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty-state';
    cell.textContent = 'No hay productos en esta página.';
    row.append(cell);
    productsBody.append(row);
    return;
  }

  for (const product of products) {
    const row = document.createElement('tr');
    for (const value of [product.id, product.nombre, product.categoria]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }

    const priceCell = document.createElement('td');
    priceCell.className = 'numeric';
    priceCell.textContent = Number(product.pvp).toLocaleString('es-EC', {
      style: 'currency',
      currency: 'USD'
    });
    row.append(priceCell);

    const actionCell = document.createElement('td');
    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'select-button';
    selectButton.textContent = 'Seleccionar';
    selectButton.addEventListener('click', () => loadProduct(product.id));
    actionCell.append(selectButton);
    row.append(actionCell);
    productsBody.append(row);
  }
};

const loadProducts = async (page = currentPage, { clearMessage = true } = {}) => {
  if (clearMessage) clearNotice();
  productsBody.innerHTML = '<tr><td class="empty-state" colspan="5">Cargando productos…</td></tr>';

  try {
    const result = await request(`${apiBase}?page=${page}`);
    const meta = result.meta;
    currentPage = meta.currentPage;
    totalPages = meta.totalPages;
    pageInput.value = currentPage;
    pageInput.max = totalPages;
    paginationSummary.textContent =
      `${meta.totalRecords} producto${meta.totalRecords === 1 ? '' : 's'} · Página ${currentPage} de ${totalPages}`;
    document.querySelector('#previous-page').disabled = currentPage <= 1;
    document.querySelector('#next-page').disabled = !meta.hasNextPage;
    renderProducts(result.data);
  } catch (error) {
    renderProducts([]);
    paginationSummary.textContent = 'No se pudo cargar la lista';
    showNotice(error.message, 'error');
  }
};

const loadProduct = async (id) => {
  clearNotice();
  try {
    const result = await request(`${apiBase}/${encodeURIComponent(id)}`);
    const product = result.data;
    selectedProduct = {
      id: Number(product.id),
      nombre: product.nombre,
      categoria: product.categoria,
      pvp: Number(product.pvp)
    };
    lookupId.value = selectedProduct.id;
    for (const input of editInputs) input.value = selectedProduct[input.name];
    updateEditButtons();
    showNotice(`Producto #${selectedProduct.id} cargado para edición.`, 'info');
  } catch (error) {
    showNotice(error.message, 'error');
  }
};

const clearSelection = () => {
  selectedProduct = null;
  lookupId.value = '';
  editForm.reset();
  updateEditButtons();
};

document.querySelector('#refresh-button').addEventListener('click', () => loadProducts());
document.querySelector('#previous-page').addEventListener('click', () => loadProducts(currentPage - 1));
document.querySelector('#next-page').addEventListener('click', () => loadProducts(currentPage + 1));
pageInput.addEventListener('change', () => {
  const page = Number(pageInput.value);
  if (Number.isInteger(page) && page >= 1) loadProducts(page);
});

document.querySelector('#create-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice();
  const formData = new FormData(event.currentTarget);
  const product = {
    nombre: formData.get('nombre').trim(),
    categoria: formData.get('categoria').trim(),
    pvp: Number(formData.get('pvp'))
  };

  try {
    const result = await request(apiBase, { method: 'POST', body: JSON.stringify(product) });
    event.currentTarget.reset();
    await loadProducts(1, { clearMessage: false });
    showNotice(`Producto #${result.data.id} creado correctamente.`);
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

document.querySelector('#lookup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (lookupId.value) loadProduct(lookupId.value);
});

editInputs.forEach((input) => input.addEventListener('input', updateEditButtons));

putButton.addEventListener('click', async () => {
  if (!selectedProduct) return;
  if (!editForm.reportValidity()) return;
  const id = selectedProduct.id;
  clearNotice();
  try {
    await request(`${apiBase}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productValues())
    });
    await loadProduct(id);
    await loadProducts(currentPage, { clearMessage: false });
    showNotice(`Producto #${id} reemplazado correctamente.`);
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

patchButton.addEventListener('click', async () => {
  if (!selectedProduct) return;
  if (!editForm.reportValidity()) return;
  const id = selectedProduct.id;
  const changes = changedValues();
  if (Object.keys(changes).length === 0) return;
  clearNotice();
  try {
    await request(`${apiBase}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes)
    });
    await loadProduct(id);
    await loadProducts(currentPage, { clearMessage: false });
    showNotice(`Producto #${id} actualizado parcialmente.`);
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

deleteButton.addEventListener('click', async () => {
  if (!selectedProduct) return;
  const id = selectedProduct.id;
  if (!window.confirm(`¿Eliminar el producto #${id}? Esta acción no se puede deshacer.`)) return;

  clearNotice();
  try {
    await request(`${apiBase}/${id}`, { method: 'DELETE' });
    clearSelection();
    await loadProducts(currentPage, { clearMessage: false });
    showNotice(`Producto #${id} eliminado.`);
  } catch (error) {
    showNotice(error.message, 'error');
  }
});

document.querySelector('#clear-button').addEventListener('click', clearSelection);

const initialize = async () => {
  try {
    const config = await request('/app-config.json');
    if (typeof config.apiBaseUrl !== 'string' || !/^https?:\/\//i.test(config.apiBaseUrl)) {
      throw new Error('El servidor frontend no proporcionó una URL de API válida.');
    }
    apiBase = config.apiBaseUrl.replace(/\/+$/, '');
    await loadProducts(1);
  } catch (error) {
    showNotice(`No se pudo iniciar la interfaz: ${error.message}`, 'error');
  }
};

updateEditButtons();
initialize();
