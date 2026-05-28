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

      const PRODUCTS_PER_PAGE = 9;

      let products = [];
      let filteredProducts = [];
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
        return String(text || "")
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
          image: row.image_url || "imagenes/productos/productos-1.png",
          stock: row.stock_status || "Disponible",
          desc: row.description || "Producto disponible para consulta comercial."
        };
      }

      function createProductCard(product) {
        const article = document.createElement("article");

        article.className = "product-card large catalog-product";
        article.dataset.category = slugify(product.category);
        article.dataset.subcategory = slugify(product.subcategory);
        article.dataset.brand = slugify(product.brand);
        article.dataset.name = `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.desc}`.toLowerCase();

        article.innerHTML = `
          <div class="product-image">
            <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" />
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
            </div>

            <div class="product-actions">
              <a href="contacto.html" class="btn btn-primary btn-sm">Solicitar cotización</a>
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
        const end   = start + PRODUCTS_PER_PAGE;
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

        renderPagination(filteredProducts.length);

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
          if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
          ) {
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

      function updateDynamicFilters() {
        const categories = new Map();
        const brands = new Map();
        const subcategoriesByCategory = new Map();

        products.forEach((product) => {
          const catSlug = slugify(product.category);
          categories.set(catSlug, product.category);
          brands.set(slugify(product.brand), product.brand);

          if (product.subcategory && product.subcategory !== "Subcategoría no definida") {
            if (!subcategoriesByCategory.has(catSlug)) {
              subcategoriesByCategory.set(catSlug, new Map());
            }
            subcategoriesByCategory.get(catSlug).set(slugify(product.subcategory), product.subcategory);
          }
        });

        window._nymSubcatMap = subcategoriesByCategory;

        categoryFilters.innerHTML = `
          <button class="filter-btn active" type="button" data-filter-type="category" data-filter-value="all">
            <span>Todas las categorías</span>
            <i class="fa-solid fa-layer-group"></i>
          </button>
        `;

        [...categories.entries()]
          .sort((a, b) => a[1].localeCompare(b[1]))
          .forEach(([value, label]) => {
            categoryFilters.innerHTML += `
              <button class="filter-btn" type="button" data-filter-type="category" data-filter-value="${escapeHTML(value)}">
                <span>${escapeHTML(label)}</span>
                <i class="fa-solid fa-angle-right"></i>
              </button>
            `;
          });

        brandFilters.innerHTML = `
          <button class="filter-btn active" type="button" data-filter-type="brand" data-filter-value="all">
            <span>Todas las marcas</span>
            <i class="fa-solid fa-tags"></i>
          </button>
        `;

        [...brands.entries()]
          .sort((a, b) => a[1].localeCompare(b[1]))
          .forEach(([value, label]) => {
            brandFilters.innerHTML += `
              <button class="filter-btn" type="button" data-filter-type="brand" data-filter-value="${escapeHTML(value)}">
                <span>${escapeHTML(label)}</span>
                <i class="fa-solid fa-angle-right"></i>
              </button>
            `;
          });

        renderSubcategoryFilters(currentCategory);
      }

      function renderSubcategoryFilters(catSlug) {
        const map = window._nymSubcatMap || new Map();
        const subs = map.get(catSlug);

        if (!subs || subs.size === 0 || catSlug === "all") {
          subcategoryFilterGroup.style.display = "none";
          subcategoryFilters.innerHTML = "";
          return;
        }

        subcategoryFilterGroup.style.display = "";
        subcategoryFilters.innerHTML = `
          <button class="filter-btn active" type="button" data-filter-type="subcategory" data-filter-value="all">
            <span>Todas</span>
            <i class="fa-solid fa-sitemap"></i>
          </button>
        `;

        [...subs.entries()]
          .sort((a, b) => a[1].localeCompare(b[1]))
          .forEach(([value, label]) => {
            subcategoryFilters.innerHTML += `
              <button class="filter-btn" type="button" data-filter-type="subcategory" data-filter-value="${escapeHTML(value)}">
                <span>${escapeHTML(label)}</span>
                <i class="fa-solid fa-angle-right"></i>
              </button>
            `;
          });

        subcategoryFilters.querySelectorAll("[data-filter-type='subcategory']").forEach(btn => {
          btn.classList.toggle("active", btn.dataset.filterValue === currentSubcategory);
          btn.addEventListener("click", () => {
            currentSubcategory = btn.dataset.filterValue;
            subcategoryFilters.querySelectorAll("[data-filter-type='subcategory']").forEach(b => {
              b.classList.toggle("active", b === btn);
            });
            filterProducts();
          });
        });
      }

      function getFilterLabel(type, value) {
        if (value === "all") return "Todas";
        const button = document.querySelector(
          `[data-filter-type="${type}"][data-filter-value="${value}"] span`
        );
        return button ? button.textContent.trim() : value;
      }

      function updateTags() {
        const tags = [
          `<span class="active-filter-tag">Categoría: ${escapeHTML(getFilterLabel("category", currentCategory))}</span>`,
          `<span class="active-filter-tag">Marca: ${escapeHTML(getFilterLabel("brand", currentBrand))}</span>`
        ];

        if (currentSubcategory !== "all") {
          tags.push(`<span class="active-filter-tag">Subcategoría: ${escapeHTML(getFilterLabel("subcategory", currentSubcategory))}</span>`);
        }

        if (currentSearch) {
          tags.push(`<span class="active-filter-tag">Búsqueda: ${escapeHTML(currentSearch)}</span>`);
        }

        activeFilters.innerHTML = tags.join("");
      }

      function filterProducts() {
        filteredProducts = products.filter((product) => {
          const catSlug = slugify(product.category);
          const subSlug = slugify(product.subcategory);
          const brandSlug = slugify(product.brand);
          const searchText = `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.desc}`.toLowerCase();

          const matchesCategory    = currentCategory    === "all" || catSlug   === currentCategory;
          const matchesSubcategory = currentSubcategory === "all" || subSlug   === currentSubcategory;
          const matchesBrand       = currentBrand       === "all" || brandSlug === currentBrand;
          const matchesSearch      = currentSearch      === ""    || searchText.includes(currentSearch);

          return matchesCategory && matchesSubcategory && matchesBrand && matchesSearch;
        });

        const total = filteredProducts.length;

        resultSummary.textContent =
          total === 1
            ? "Mostrando 1 producto."
            : `Mostrando ${total} productos.`;

        emptyState.classList.toggle("show", total === 0);
        currentPage = 1;
        renderProducts();
        updateTags();
      }

      function bindFilters() {
        // Categorías — al cambiar resetea subcategoría
        categoryFilters.querySelectorAll("[data-filter-type='category']").forEach((button) => {
          button.addEventListener("click", () => {
            currentCategory = button.dataset.filterValue;
            currentSubcategory = "all";

            categoryFilters.querySelectorAll("[data-filter-type='category']").forEach(b => {
              b.classList.toggle("active", b === button);
            });

            // Mostrar subcategorías de la categoría elegida
            renderSubcategoryFilters(currentCategory);
            filterProducts();
          });
        });

        // Marcas
        brandFilters.querySelectorAll("[data-filter-type='brand']").forEach((button) => {
          button.addEventListener("click", () => {
            currentBrand = button.dataset.filterValue;
            brandFilters.querySelectorAll("[data-filter-type='brand']").forEach(b => {
              b.classList.toggle("active", b === button);
            });
            filterProducts();
          });
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

          const { data, error } = await window.nymSupabase
            .from("products")
            .select(`
              *,
              brands (
                name,
                logo_url
              ),
              categories (
                name,
                icon
              )
            `)
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          products = (data || []).map(normalizeProduct);

          renderProducts();
          updateDynamicFilters();
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

      await loadProducts();
    });
