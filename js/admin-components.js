function renderAdminEmptyState({ icon = "fa-box-open", title, message }) {
  return `
    <div class="empty-state-admin">
      <i class="fa-solid ${escapeHTML(icon)}"></i>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function renderAdminTag({ icon, label, className = "" }) {
  return `
    <span class="admin-tag ${escapeHTML(className)}">
      ${icon ? `<i class="fa-solid ${escapeHTML(icon)}"></i>` : ""}
      ${escapeHTML(label)}
    </span>
  `;
}

function getNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function renderAdminProductTableRow(product) {
  const image = product.image_url || DEFAULT_IMAGE;
  const quantity = getNumberOrNull(product.stock_quantity);
  const lowStock = getNumberOrNull(product.low_stock_threshold) || 0;
  const quantityLabel = quantity === null ? "Sin cantidad" : `${quantity} und.`;
  const isLowStock = quantity !== null && quantity > 0 && lowStock > 0 && quantity <= lowStock;

  return `
    <tr>
      <td>
        <div class="table-product-cell">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}" />
          <div>
            <strong>${escapeHTML(product.name || "Producto sin nombre")}</strong>
            <small>${escapeHTML(product.description || "Sin descripcion registrada.")}</small>
          </div>
        </div>
      </td>

      <td>
        ${renderAdminTag({ icon: "fa-tag", label: product.brand || "Sin marca" })}
      </td>

      <td>
        <div class="table-meta">
          ${renderAdminTag({ icon: "fa-layer-group", label: product.category || "Sin categoria" })}
          ${product.subcategory ? `<span class="table-muted"><i class="fa-solid fa-sitemap"></i> ${escapeHTML(product.subcategory)}</span>` : ""}
        </div>
      </td>

      <td>
        <div class="table-meta">
          ${renderAdminTag({
            label: product.stock_status || "Disponible",
            className: `stock-tag ${getStockClass(product.stock_status)}`,
          })}
          <span class="table-muted ${isLowStock ? "low-stock-warning" : ""}">
            <i class="fa-solid fa-boxes-stacked"></i> ${escapeHTML(quantityLabel)}
          </span>
          ${isLowStock ? `<span class="table-muted low-stock-warning"><i class="fa-solid fa-triangle-exclamation"></i> Bajo stock</span>` : ""}
        </div>
      </td>

      <td>
        <div class="table-actions">
          <button class="icon-action" type="button" data-edit="${escapeHTML(product.id)}" title="Editar producto">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="icon-action danger" type="button" data-delete="${escapeHTML(product.id)}" title="Eliminar producto">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderSortButton(field, label) {
  const direction = adminProductSort === `${field}_asc` ? "desc" : "asc";
  const active = adminProductSort.startsWith(`${field}_`);
  const icon = active && adminProductSort.endsWith("_asc") ? "fa-arrow-up-a-z" : "fa-arrow-down-z-a";

  return `
    <button class="sort-btn ${active ? "active" : ""}" type="button" data-product-sort="${escapeHTML(field)}_${direction}">
      ${escapeHTML(label)} <i class="fa-solid ${escapeHTML(icon)}"></i>
    </button>
  `;
}

function renderAdminProductTable(productsToRender) {
  return `
    <div class="admin-table-wrap">
      <table class="admin-table compact-product-table">
        <thead>
          <tr>
            <th>${renderSortButton("name", "Producto")}</th>
            <th>${renderSortButton("brand", "Marca")}</th>
            <th>${renderSortButton("category", "Categoria")}</th>
            <th>${renderSortButton("stock", "Stock")}</th>
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${productsToRender.map(renderAdminProductTableRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminProductPagination({ totalProducts, start, shownProducts, totalPages }) {
  if (totalProducts === 0) return "";

  const from = start + 1;
  const to = start + shownProducts;

  return `
    <div class="admin-pagination">
      <span>Mostrando ${from}-${to} de ${totalProducts} productos</span>
      <div class="admin-pagination-actions">
        <label class="pagination-control">
          Ver
          <select data-product-page-size>
            <option value="25" ${adminProductPageSize === 25 ? "selected" : ""}>25</option>
            <option value="50" ${adminProductPageSize === 50 ? "selected" : ""}>50</option>
            <option value="100" ${adminProductPageSize === 100 ? "selected" : ""}>100</option>
          </select>
        </label>
        <button class="pagination-btn" type="button" data-product-page="prev" ${adminProductPage === 1 ? "disabled" : ""}>
          <i class="fa-solid fa-angle-left"></i> Anterior
        </button>
        <span>Pagina ${adminProductPage} de ${totalPages}</span>
        <button class="pagination-btn" type="button" data-product-page="next" ${adminProductPage === totalPages ? "disabled" : ""}>
          Siguiente <i class="fa-solid fa-angle-right"></i>
        </button>
      </div>
    </div>
  `;
}
