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

function getAdminProductExportRows() {
  const rows = adminFilteredProducts.length
    ? adminFilteredProducts
    : products.filter((product) => product.is_active !== false).sort(sortAdminProducts);

  return rows.map((product) => ({
    Producto: product.name || "",
    Marca: product.brand || "",
    Categoria: product.category || "",
    Subcategoria: product.subcategory || "",
    Estado: product.stock_status || "Disponible",
    Cantidad: product.stock_quantity ?? "",
    "Alerta bajo stock": product.low_stock_threshold ?? "",
    Descripcion: product.description || "",
    ID: product.id || "",
  }));
}

function downloadAdminProductsCsv() {
  const exportRows = getAdminProductExportRows();
  const headers = Object.keys(exportRows[0] || { Producto: "", Marca: "", Categoria: "", Subcategoria: "" });

  if (window.XLSX) {
    const worksheet = window.XLSX.utils.json_to_sheet(exportRows);
    const workbook = window.XLSX.utils.book_new();

    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    window.XLSX.writeFile(
      workbook,
      `productos-industrial-import-company-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showNotice(notice, `${exportRows.length} productos exportados en Excel.`);
    return;
  }

  const lines = exportRows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(";"));

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

  showNotice(notice, `${exportRows.length} productos exportados en CSV porque no cargo la libreria Excel.`, "warning");
}

function normalizeImportText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getImportValue(row, aliases) {
  const entries = Object.entries(row);
  const aliasSet = aliases.map(normalizeImportText);
  const match = entries.find(([key]) => aliasSet.includes(normalizeImportText(key)));
  return match ? String(match[1] ?? "").trim() : "";
}

function resolveImportRelation(collection, name) {
  const normalized = normalizeImportText(name);
  if (!normalized) return null;
  return collection.find((item) => normalizeImportText(item.name) === normalized) || null;
}

function buildImportedProductPayloads(rows) {
  const skipped = [];
  const payloads = [];

  rows.forEach((row, index) => {
    const name = getImportValue(row, ["Producto", "Nombre", "Nombre del producto", "product", "name"]);
    const brandName = getImportValue(row, ["Marca", "brand"]);
    const categoryName = getImportValue(row, ["Categoria", "Categoría", "category"]);
    const subcategoryName = getImportValue(row, ["Subcategoria", "Subcategoría", "subcategory"]);
    const brand = resolveImportRelation(brands, brandName);
    const category = resolveImportRelation(categories, categoryName);
    const subcategory = resolveImportRelation(subcategories, subcategoryName);

    if (!name || !brand || !category) {
      skipped.push(index + 2);
      return;
    }

    const stockQuantity = getImportValue(row, ["Cantidad", "quantity", "stock_quantity"]);
    const lowStockThreshold = getImportValue(row, ["Alerta bajo stock", "low_stock_threshold"]);

    payloads.push({
      name,
      brand_id: brand.id,
      category_id: category.id,
      subcategory_id: subcategory?.id || null,
      brand: brand.name || "",
      category: category.name || "",
      subcategory: subcategory?.name || "",
      image_url: getImportValue(row, ["Imagen", "Imagen URL", "image_url", "image"]) || DEFAULT_IMAGE,
      stock_status: getImportValue(row, ["Estado", "Stock", "stock_status"]) || "Disponible",
      stock_quantity: stockQuantity === "" ? null : Number(stockQuantity),
      low_stock_threshold: lowStockThreshold === "" ? null : Number(lowStockThreshold),
      description: getImportValue(row, ["Descripcion", "Descripción", "description"]),
      is_active: true,
    });
  });

  return { payloads, skipped };
}

async function importAdminProductsFromFile(file) {
  if (!file) return;
  if (!window.XLSX) {
    showNotice(notice, "No cargo la libreria Excel. Recarga la pagina e intenta otra vez.", "error");
    return;
  }

  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const { payloads, skipped } = buildImportedProductPayloads(rows);

  if (!payloads.length) {
    showNotice(notice, "No se importo ningun producto. Revisa columnas, marcas y categorias.", "error");
    return;
  }

  const { data, error } = await window.nymSupabase.from("products").insert(payloads).select("id,name");
  if (error) throw error;

  await recordAdminAudit("product", null, "bulk_imported", `${payloads.length} productos importados`, {
    imported_count: payloads.length,
    skipped_rows: skipped,
    file_name: file.name,
  });

  showNotice(
    notice,
    `${payloads.length} productos importados.${skipped.length ? ` Filas omitidas: ${skipped.join(", ")}.` : ""}`,
    skipped.length ? "warning" : "success",
  );

  await loadProducts();
  return data;
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
