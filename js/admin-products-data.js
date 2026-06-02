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

  const sorted = [...filtered].sort(sortAdminProducts);
  adminFilteredProducts = sorted;

  if (productPageSize && productPageSize.value !== String(adminProductPageSize)) {
    productPageSize.value = String(adminProductPageSize);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / adminProductPageSize));

  if (adminProductPage > totalPages) {
    adminProductPage = totalPages;
  }

  const start = (adminProductPage - 1) * adminProductPageSize;
  const pageProducts = sorted.slice(start, start + adminProductPageSize);

  list.innerHTML = sorted.length
    ? renderAdminProductTable(pageProducts)
    : renderAdminEmptyState({
        title: "No hay productos para mostrar",
        message: "Agrega un producto o cambia los filtros.",
      });

  renderProductPagination(sorted.length, start, pageProducts.length, totalPages);
  renderProductResultSummary(sorted.length, start, pageProducts.length);
  renderStockList();
  renderBrandsList();
  renderCategoriesList();
  renderSubcategoriesList();
  updateStats();
}

function sortAdminProducts(a, b) {
  const [field, direction] = adminProductSort.split("_");
  const multiplier = direction === "desc" ? -1 : 1;

  if (field === "stock") {
    const stockA = Number.isFinite(Number(a.stock_quantity)) ? Number(a.stock_quantity) : Number.MAX_SAFE_INTEGER;
    const stockB = Number.isFinite(Number(b.stock_quantity)) ? Number(b.stock_quantity) : Number.MAX_SAFE_INTEGER;
    if (stockA !== stockB) return (stockA - stockB) * multiplier;
    return String(a.stock_status || "").localeCompare(String(b.stock_status || "")) * multiplier;
  }

  if (field === "created") {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return (dateA - dateB) * multiplier;
  }

  const valueA = String(a[field] || "").toLowerCase();
  const valueB = String(b[field] || "").toLowerCase();
  return valueA.localeCompare(valueB) * multiplier;
}

function renderProductPagination(totalProducts, start, shownProducts, totalPages) {
  if (!productPagination) return;
  productPagination.innerHTML = renderAdminProductPagination({ totalProducts, start, shownProducts, totalPages });
}

function renderProductResultSummary(totalProducts, start, shownProducts) {
  if (!productResultSummary) return;

  if (!totalProducts) {
    productResultSummary.textContent = "No hay productos con los filtros actuales.";
    return;
  }

  const from = start + 1;
  const to = start + shownProducts;
  productResultSummary.textContent = `Mostrando ${from}-${to} de ${totalProducts} productos filtrados.`;
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return /[",;\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function downloadAdminProductsCsv() {
  const rows = adminFilteredProducts.length
    ? adminFilteredProducts
    : products.filter((product) => product.is_active !== false).sort(sortAdminProducts);

  const headers = [
    "Producto",
    "Marca",
    "Categoria",
    "Subcategoria",
    "Estado",
    "Cantidad",
    "Alerta bajo stock",
    "Descripcion",
    "ID",
  ];

  const lines = rows.map((product) =>
    [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.stock_status,
      product.stock_quantity,
      product.low_stock_threshold,
      product.description,
      product.id,
    ]
      .map(escapeCsvValue)
      .join(";"),
  );

  const blob = new Blob([`\uFEFF${[headers.join(";"), ...lines].join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `productos-industrial-import-company-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showNotice(notice, `${rows.length} productos exportados en CSV.`);
}

function resetAdminProductPage() {
  adminProductPage = 1;
  renderProducts();
}

function renderStockList() {
  const activeProducts = products.filter((product) => product.is_active !== false).sort(sortAdminProducts);
  renderStockMovementProductOptions();

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

          <span class="table-meta">
            <span class="admin-tag stock-tag ${getStockClass(product.stock_status)}">
              ${escapeHTML(product.stock_status || "Disponible")}
            </span>
            <small>
              ${
                Number.isFinite(Number(product.stock_quantity))
                  ? `${Number(product.stock_quantity)} unidades`
                  : "Sin cantidad"
              }
            </small>
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
