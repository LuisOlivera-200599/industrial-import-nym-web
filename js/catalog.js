document.addEventListener("DOMContentLoaded", async () => {
  const catalogGrid = document.getElementById("catalog-grid");
  const categoryFilters = document.getElementById("category-filters");
  const subcategoryFilters = document.getElementById("subcategory-filters");
  const subcategoryFilterGroup = document.getElementById("subcategory-filter-group");
  const brandFilters = document.getElementById("brand-filters");
  const searchInput = document.getElementById("product-search");
  const resultSummary = document.getElementById("result-summary");
  const activeFilters = document.getElementById("active-filters");
  const emptyState = document.getElementById("empty-state");
  const quotePanel = document.getElementById("quote-panel");
  const quoteCount = document.getElementById("quote-count");
  const quoteSend = document.getElementById("quote-send");
  const quoteClear = document.getElementById("quote-clear");
  const quoteItems = document.getElementById("quote-items");

  const PRODUCTS_PER_PAGE = 9;
  const QUOTE_STORAGE_KEY = "nymQuoteProducts";

  let products = [];
  let filteredProducts = [];
  let quoteProducts = [];
  let currentPage = 1;
  let currentCategory = "all";
  let currentSubcategory = "all";
  let currentBrand = "all";
  let currentSearch = "";

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function escapeHTML(text) {
    return (window.nymSite?.cleanText ? window.nymSite.cleanText(text) : String(text || ""))
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStockClass(stock) {
    const value = String(stock || "").toLowerCase();

    if (value.includes("sin")) return "unavailable";
    if (value.includes("pedido")) return "preorder";
    return "available";
  }

  function getProductWhatsappUrl(product) {
    const message = `Hola, quiero consultar por el producto: ${product.name} - Marca: ${product.brand}`;

    return window.nymSite?.buildWhatsappUrl
      ? window.nymSite.buildWhatsappUrl(message)
      : `https://wa.me/51966441035?text=${encodeURIComponent(message)}`;
  }

  function getProductDetailUrl(product) {
    return `producto/${slugify(product.name)}--${encodeURIComponent(product.id)}/`;
  }

  function loadQuoteProducts() {
    try {
      quoteProducts = JSON.parse(localStorage.getItem(QUOTE_STORAGE_KEY)) || [];
    } catch {
      quoteProducts = [];
    }
  }

  function saveQuoteProducts() {
    localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quoteProducts));
  }

  function buildQuoteMessage() {
    const lines = quoteProducts.map(
      (product, index) => `${index + 1}. ${product.name} - Marca: ${product.brand} - Categoría: ${product.category}`,
    );

    return ["Hola, quiero cotizar estos productos:", "", ...lines].join("\n");
  }

  async function registerQuoteLead() {
    if (!window.nymSupabase || quoteProducts.length === 0) return;

    const leadPayload = {
      nombre: "Cotizacion multiple",
      empresa: "",
      correo: "",
      telefono: "",
      tipo: "Cotizacion multiple",
      categoria: "Catalogo",
      mensaje: buildQuoteMessage(),
      origen: "contacto_web",
      estado: "nuevo",
    };

    const { error } = await window.nymSupabase.from("contact_leads").insert([leadPayload]);

    if (error) throw error;
  }

  function updateQuotePanel() {
    if (!quotePanel || !quoteCount || !quoteSend) return;

    const total = quoteProducts.length;
    quotePanel.classList.toggle("show", total > 0);
    quoteCount.textContent = total === 1 ? "1 producto seleccionado" : `${total} productos seleccionados`;
    quoteSend.href = window.nymSite?.buildWhatsappUrl
      ? window.nymSite.buildWhatsappUrl(buildQuoteMessage())
      : `https://wa.me/51966441035?text=${encodeURIComponent(buildQuoteMessage())}`;

    if (quoteItems) {
      quoteItems.innerHTML = quoteProducts
        .map(
          (product) => `
            <span class="quote-item">
              ${escapeHTML(product.name)}
              <button type="button" data-quote-remove="${escapeHTML(product.id)}" aria-label="Quitar ${escapeHTML(product.name)}">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </span>
          `,
        )
        .join("");

      quoteItems.querySelectorAll("[data-quote-remove]").forEach((button) => {
        button.addEventListener("click", () => removeProductFromQuote(button.dataset.quoteRemove));
      });
    }

    document.querySelectorAll("[data-quote-add]").forEach((button) => {
      const exists = quoteProducts.some((item) => item.id === button.dataset.quoteAdd);
      button.textContent = exists ? "Agregado" : "Agregar a cotización";
      button.disabled = exists;
    });
  }

  function addProductToQuote(product) {
    if (quoteProducts.some((item) => item.id === product.id)) return;

    quoteProducts.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
    });
    saveQuoteProducts();
    updateQuotePanel();
  }

  function removeProductFromQuote(productId) {
    quoteProducts = quoteProducts.filter((product) => String(product.id) !== String(productId));
    saveQuoteProducts();
    updateQuotePanel();
  }

  function normalizeProduct(row) {
    const brandName = row.brands?.name || row.brand || "Marca no definida";
    const categoryName = row.categories?.name || row.category || "Categoría no definida";

    const subcategoryName =
      row.subcategory?.name ||
      row.subcategory ||
      row.subcategory_name ||
      row.sub_category ||
      row.sub_category_name ||
      "Subcategoría no definida";

    return {
      id: row.id,
      name: row.name || "Producto sin nombre",
      brand: brandName,
      category: categoryName,
      subcategory: subcategoryName,
      brandLogo: row.brands?.logo_url || "",
      categoryIcon: row.categories?.icon || "",
      image: row.image_url || "imagenes/optimized/productos/productos-1.webp",
      stock: row.stock_status || "Disponible",
      stockQuantity: Number.isFinite(Number(row.stock_quantity)) ? Number(row.stock_quantity) : null,
      lowStock: Number.isFinite(Number(row.low_stock_threshold)) ? Number(row.low_stock_threshold) : null,
      desc: row.description || "Producto disponible para consulta comercial.",
    };
  }

  function createProductCard(product) {
    const article = document.createElement("article");

    article.className = "product-card large catalog-product";
    article.dataset.category = slugify(product.category);
    article.dataset.subcategory = slugify(product.subcategory);
    article.dataset.brand = slugify(product.brand);
    article.dataset.name =
      `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.desc}`.toLowerCase();

    article.innerHTML = `
          <div class="product-image">
            <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" />
          </div>

          <div class="product-body">
            <span class="product-brand">${escapeHTML(product.brand)}</span>

            <div class="product-meta">
              <span class="product-pill">
                ${product.categoryIcon ? `<i class="${escapeHTML(product.categoryIcon)}"></i>&nbsp;` : ""}
                Categoría: ${escapeHTML(product.category)}
              </span>

              <span class="product-pill">
                <i class="fa-solid fa-sitemap"></i>&nbsp;
                Subcategoría: ${escapeHTML(product.subcategory)}
              </span>
            </div>

            <h3>${escapeHTML(product.name)}</h3>

            <p>${escapeHTML(product.desc)}</p>

            <div class="product-footer">
              <span class="stock ${getStockClass(product.stock)}">${escapeHTML(product.stock)}</span>
              ${
                product.stockQuantity !== null
                  ? `<span class="product-pill"><i class="fa-solid fa-boxes-stacked"></i>&nbsp; ${escapeHTML(product.stockQuantity)} und.</span>`
                  : ""
              }
            </div>

            <div class="product-actions">
              <a href="${escapeHTML(getProductDetailUrl(product))}" class="btn btn-primary btn-sm">Ver detalle</a>
              <button class="btn btn-secondary btn-sm" type="button" data-quote-add="${escapeHTML(product.id)}">Agregar a cotización</button>
              <a
                href="${escapeHTML(getProductWhatsappUrl(product))}"
                class="btn btn-whatsapp btn-sm"
                target="_blank"
                rel="noopener"
              >
                Consultar
              </a>
            </div>
          </div>
        `;

    return article;
  }

  function renderProducts() {
    catalogGrid.innerHTML = "";

    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    const pageProducts = filteredProducts.slice(start, end);

    if (pageProducts.length === 0) {
      emptyState.classList.add("show");
      renderPagination(0);
      return;
    }

    emptyState.classList.remove("show");
    pageProducts.forEach((product) => {
      catalogGrid.appendChild(createProductCard(product));
    });

    catalogGrid.querySelectorAll("[data-quote-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find((item) => item.id === button.dataset.quoteAdd);
        if (product) addProductToQuote(product);
      });
    });

    renderPagination(filteredProducts.length);
    updateQuotePanel();

    // Scroll suave al inicio del catálogo al cambiar página
    catalogGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderPagination(total) {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let html = `
          <button ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}" aria-label="Página anterior">
            <i class="fa-solid fa-angle-left"></i>
          </button>
        `;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<button disabled>…</button>`;
      }
    }

    html += `
          <button ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}" aria-label="Página siguiente">
            <i class="fa-solid fa-angle-right"></i>
          </button>
        `;

    pagination.innerHTML = html;

    pagination.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = parseInt(btn.dataset.page);
        renderProducts();
      });
    });
  }

  function productMatches(product, overrides = {}) {
    const category = overrides.category ?? currentCategory;
    const subcategory = overrides.subcategory ?? currentSubcategory;
    const brand = overrides.brand ?? currentBrand;
    const searchValue = overrides.search ?? currentSearch;
    const catSlug = slugify(product.category);
    const subSlug = slugify(product.subcategory);
    const brandSlug = slugify(product.brand);
    const searchText =
      `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.desc}`.toLowerCase();

    const matchesCategory = category === "all" || catSlug === category;
    const matchesSubcategory = subcategory === "all" || subSlug === subcategory;
    const matchesBrand = brand === "all" || brandSlug === brand;
    const matchesSearch = searchValue === "" || searchText.includes(searchValue);

    return matchesCategory && matchesSubcategory && matchesBrand && matchesSearch;
  }

  function addFilterOption(options, value, label) {
    const current = options.get(value);
    options.set(value, {
      label,
      count: (current?.count || 0) + 1,
    });
  }

  function renderFilterButtons(container, type, options, allLabel, iconClass, activeValue) {
    const total = [...options.values()].reduce((sum, option) => sum + option.count, 0);
    container.innerHTML = `
          <button class="filter-btn ${activeValue === "all" ? "active" : ""}" type="button" data-filter-type="${type}" data-filter-value="all">
            <span class="filter-label">${escapeHTML(allLabel)}</span>
            <span class="filter-meta">
              <span class="filter-count">${total}</span>
              <i class="${escapeHTML(iconClass)}"></i>
            </span>
          </button>
        `;

    [...options.entries()]
      .sort((a, b) => a[1].label.localeCompare(b[1].label))
      .forEach(([value, option]) => {
        container.innerHTML += `
              <button class="filter-btn ${activeValue === value ? "active" : ""}" type="button" data-filter-type="${type}" data-filter-value="${escapeHTML(value)}">
                <span class="filter-label">${escapeHTML(option.label)}</span>
                <span class="filter-meta">
                  <span class="filter-count">${option.count}</span>
                  <i class="fa-solid fa-chevron-down"></i>
                </span>
              </button>
            `;
      });
  }

  function updateDynamicFilters() {
    let categories = new Map();
    let brands = new Map();
    let subcategories = new Map();

    for (let pass = 0; pass < 3; pass += 1) {
      let changed = false;

      categories = new Map();
      brands = new Map();
      subcategories = new Map();

      products
        .filter((product) => productMatches(product, { category: "all", subcategory: "all" }))
        .forEach((product) => {
          addFilterOption(categories, slugify(product.category), product.category);
        });

      if (currentCategory !== "all" && !categories.has(currentCategory)) {
        currentCategory = "all";
        currentSubcategory = "all";
        changed = true;
      }

      products
        .filter((product) => productMatches(product, { brand: "all" }))
        .forEach((product) => {
          addFilterOption(brands, slugify(product.brand), product.brand);
        });

      if (currentBrand !== "all" && !brands.has(currentBrand)) {
        currentBrand = "all";
        changed = true;
      }

      if (currentCategory !== "all") {
        products
          .filter((product) => productMatches(product, { subcategory: "all" }))
          .forEach((product) => {
            const subcategory = product.subcategory || "";
            if (
              subcategory &&
              subcategory !== "Subcategoría no definida" &&
              subcategory !== "SubcategorÃ­a no definida"
            ) {
              addFilterOption(subcategories, slugify(subcategory), subcategory);
            }
          });
      } else if (currentSubcategory !== "all") {
        currentSubcategory = "all";
        changed = true;
      }

      if (currentSubcategory !== "all" && !subcategories.has(currentSubcategory)) {
        currentSubcategory = "all";
        changed = true;
      }

      if (!changed) break;
    }

    renderFilterButtons(
      categoryFilters,
      "category",
      categories,
      "Todas las categorías",
      "fa-solid fa-layer-group",
      currentCategory,
    );
    renderFilterButtons(brandFilters, "brand", brands, "Todas las marcas", "fa-solid fa-tags", currentBrand);

    if (currentCategory === "all" || subcategories.size === 0) {
      subcategoryFilterGroup.style.display = "none";
      subcategoryFilters.innerHTML = "";
      return;
    }

    subcategoryFilterGroup.style.display = "";
    renderFilterButtons(
      subcategoryFilters,
      "subcategory",
      subcategories,
      "Todas",
      "fa-solid fa-sitemap",
      currentSubcategory,
    );
  }

  function getFilterLabel(type, value) {
    if (value === "all") return "Todas";
    const button = document.querySelector(`[data-filter-type="${type}"][data-filter-value="${value}"] span`);
    return button ? button.textContent.trim() : value;
  }

  function updateTags() {
    const tags = [
      `<span class="active-filter-tag">Categoría: ${escapeHTML(getFilterLabel("category", currentCategory))}</span>`,
      `<span class="active-filter-tag">Marca: ${escapeHTML(getFilterLabel("brand", currentBrand))}</span>`,
    ];

    if (currentSubcategory !== "all") {
      tags.push(
        `<span class="active-filter-tag">Subcategoría: ${escapeHTML(getFilterLabel("subcategory", currentSubcategory))}</span>`,
      );
    }

    if (currentSearch) {
      tags.push(`<span class="active-filter-tag">Búsqueda: ${escapeHTML(currentSearch)}</span>`);
    }

    activeFilters.innerHTML = tags.join("");
  }

  function filterProducts() {
    updateDynamicFilters();
    filteredProducts = products.filter((product) => productMatches(product));
    const total = filteredProducts.length;

    resultSummary.textContent = total === 1 ? "Mostrando 1 producto." : `Mostrando ${total} productos.`;

    emptyState.classList.toggle("show", total === 0);
    currentPage = 1;
    renderProducts();
    updateTags();
  }

  function bindFilters() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-type]");
      if (!button) return;

      if (button.dataset.filterType === "category") {
        currentCategory = button.dataset.filterValue;
        currentSubcategory = "all";
        filterProducts();
      }

      if (button.dataset.filterType === "brand") {
        currentBrand = button.dataset.filterValue;
        filterProducts();
      }

      if (button.dataset.filterType === "subcategory") {
        currentSubcategory = button.dataset.filterValue;
        filterProducts();
      }
    });

    searchInput.addEventListener("input", () => {
      currentSearch = searchInput.value.trim().toLowerCase();
      filterProducts();
    });
  }

  async function loadProducts() {
    try {
      if (!window.nymSupabase) {
        throw new Error("Supabase no está configurado.");
      }

      const pageSize = 1000;
      const rows = [];

      for (let from = 0; ; from += pageSize) {
        const to = from + pageSize - 1;
        const { data, error } = await window.nymSupabase
          .from("products")
          .select(
            `
              *,
              brands (
                name,
                logo_url
              ),
              categories (
                name,
                icon
              )
            `,
          )
          .neq("is_active", false)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          throw error;
        }

        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }

      products = rows.map(normalizeProduct);

      bindFilters();
      filterProducts();
    } catch (error) {
      console.error("No se pudieron cargar los productos:", error);

      catalogGrid.innerHTML = "";
      categoryFilters.innerHTML = "";
      brandFilters.innerHTML = "";

      resultSummary.textContent = "No se pudieron cargar los productos.";
      emptyState.classList.add("show");
    }
  }

  loadQuoteProducts();
  quoteClear?.addEventListener("click", () => {
    quoteProducts = [];
    saveQuoteProducts();
    updateQuotePanel();
  });

  quoteSend?.addEventListener("click", async (event) => {
    event.preventDefault();
    if (quoteProducts.length === 0) return;

    const href = quoteSend.href;
    quoteSend.textContent = "Preparando...";
    quoteSend.setAttribute("aria-busy", "true");

    try {
      await registerQuoteLead();
    } catch (error) {
      console.error("No se pudo guardar la cotizacion como lead:", error);
    } finally {
      quoteSend.textContent = "Enviar cotizacion";
      quoteSend.removeAttribute("aria-busy");
      window.open(href, "_blank", "noopener");
    }
  });

  await loadProducts();
});
