function renderProductTableRow(product) {
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
        <span class="admin-tag"><i class="fa-solid fa-tag"></i> ${escapeHTML(product.brand || "Sin marca")}</span>
      </td>

      <td>
        <div class="table-meta">
          <span class="admin-tag"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(product.category || "Sin categoría")}</span>
          ${product.subcategory ? `<span class="table-muted"><i class="fa-solid fa-sitemap"></i> ${escapeHTML(product.subcategory)}</span>` : ""}
        </div>
      </td>

      <td>
        <span class="admin-tag stock-tag ${getStockClass(product.stock_status)}">
          ${escapeHTML(product.stock_status || "Disponible")}
        </span>
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

function renderProducts() {
  const query = search.value.trim().toLowerCase();
  const selectedBrand = brandFilter.value;
  const selectedCategory = categoryFilter.value;
  const selectedSubcategory = subcategoryFilter.value;
  const selectedStock = stockFilter.value;

  const filtered = products.filter((product) => {
    const text = `
      ${product.name || ""}
      ${product.brand || ""}
      ${product.category || ""}
      ${product.subcategory || ""}
      ${product.stock_status || ""}
      ${product.description || ""}
    `.toLowerCase();

    return (
      product.is_active !== false &&
      (query === "" || text.includes(query)) &&
      (selectedBrand === "all" || product.brand_id === selectedBrand) &&
      (selectedCategory === "all" || product.category_id === selectedCategory) &&
      (selectedSubcategory === "all" || product.subcategory_id === selectedSubcategory) &&
      (selectedStock === "all" || product.stock_status === selectedStock)
    );
  });

  list.innerHTML = filtered.length
    ? `
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
            ${filtered.map(renderProductTableRow).join("")}
          </tbody>
        </table>
      </div>
    `
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-box-open"></i>
        <h3>No hay productos para mostrar</h3>
        <p>Agrega un producto o cambia los filtros.</p>
      </div>
    `;

  renderStockList();
  renderBrandsList();
  renderCategoriesList();
  renderSubcategoriesList();
  updateStats();
}

function renderStockList() {
  const activeProducts = products.filter((product) => product.is_active !== false);

  stockList.innerHTML = activeProducts.length
    ? activeProducts
        .map(
          (product) => `
        <div class="simple-item">
          <span>
            ${escapeHTML(product.name || "Producto sin nombre")}
            <small>
              ${escapeHTML(product.brand || "Sin marca")} /
              ${escapeHTML(product.category || "Sin categoría")}
              ${product.subcategory ? " / " + escapeHTML(product.subcategory) : ""}
            </small>
          </span>

          <span class="admin-tag stock-tag ${getStockClass(product.stock_status)}">
            ${escapeHTML(product.stock_status || "Disponible")}
          </span>
        </div>
      `,
        )
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-box-open"></i>
        <h3>No hay productos</h3>
        <p>Cuando agregues productos, aquí verás su stock.</p>
      </div>
    `;
}
