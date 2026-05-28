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

function renderAdminProductTableRow(product) {
  const image = product.image_url || DEFAULT_IMAGE;

  return `
    <tr>
      <td>
        <div class="table-product-cell">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}" />
          <div>
            <strong>${escapeHTML(product.name || "Producto sin nombre")}</strong>
            <small>${escapeHTML(product.description || "Sin descripción registrada.")}</small>
          </div>
        </div>
      </td>

      <td>
        ${renderAdminTag({ icon: "fa-tag", label: product.brand || "Sin marca" })}
      </td>

      <td>
        <div class="table-meta">
          ${renderAdminTag({ icon: "fa-layer-group", label: product.category || "Sin categoría" })}
          ${product.subcategory ? `<span class="table-muted"><i class="fa-solid fa-sitemap"></i> ${escapeHTML(product.subcategory)}</span>` : ""}
        </div>
      </td>

      <td>
        ${renderAdminTag({
          label: product.stock_status || "Disponible",
          className: `stock-tag ${getStockClass(product.stock_status)}`,
        })}
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

function renderAdminProductTable(productsToRender) {
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Stock</th>
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
  if (totalProducts <= ADMIN_PRODUCTS_PER_PAGE) return "";

  const from = start + 1;
  const to = start + shownProducts;

  return `
    <div class="admin-pagination">
      <span>Mostrando ${from}-${to} de ${totalProducts} productos</span>
      <div class="admin-pagination-actions">
        <button class="pagination-btn" type="button" data-product-page="prev" ${adminProductPage === 1 ? "disabled" : ""}>
          <i class="fa-solid fa-angle-left"></i> Anterior
        </button>
        <span>Página ${adminProductPage} de ${totalPages}</span>
        <button class="pagination-btn" type="button" data-product-page="next" ${adminProductPage === totalPages ? "disabled" : ""}>
          Siguiente <i class="fa-solid fa-angle-right"></i>
        </button>
      </div>
    </div>
  `;
}
