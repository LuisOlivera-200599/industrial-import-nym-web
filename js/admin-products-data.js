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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PRODUCTS_PER_PAGE));

  if (adminProductPage > totalPages) {
    adminProductPage = totalPages;
  }

  const start = (adminProductPage - 1) * ADMIN_PRODUCTS_PER_PAGE;
  const pageProducts = filtered.slice(start, start + ADMIN_PRODUCTS_PER_PAGE);

  list.innerHTML = filtered.length
    ? renderAdminProductTable(pageProducts)
    : renderAdminEmptyState({
        title: "No hay productos para mostrar",
        message: "Agrega un producto o cambia los filtros.",
      });

  renderProductPagination(filtered.length, start, pageProducts.length, totalPages);
  renderStockList();
  renderBrandsList();
  renderCategoriesList();
  renderSubcategoriesList();
  updateStats();
}

function renderProductPagination(totalProducts, start, shownProducts, totalPages) {
  if (!productPagination) return;
  productPagination.innerHTML = renderAdminProductPagination({ totalProducts, start, shownProducts, totalPages });
}

function resetAdminProductPage() {
  adminProductPage = 1;
  renderProducts();
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
