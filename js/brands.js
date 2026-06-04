document.addEventListener("DOMContentLoaded", async () => {
  const brandFilters = document.getElementById("brand-filters");
  const brandSearch = document.getElementById("brand-search");
  const brandsGrid = document.getElementById("brands-grid");
  const brandLogoRow = document.getElementById("brand-logo-row");
  const brandSummary = document.getElementById("brand-summary");
  const activeBrandFilters = document.getElementById("active-brand-filters");
  const emptyState = document.getElementById("empty-state");

  let brands = [];
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

  function normalizeBrand(row) {
    return {
      id: row.id,
      name: row.name || "Marca sin nombre",
      slug: slugify(row.name || "marca"),
      logo: row.logo_url || "",
      description:
        row.description || "Marca disponible para consultas comerciales, productos relacionados y cotización.",
      sort: row.sort_order || 0,
    };
  }

  function createFilterButton(value, label, active = false) {
    return `
          <button class="filter-btn ${active ? "active" : ""}" type="button" data-filter-value="${escapeHTML(value)}">
            <span>${escapeHTML(label)}</span>
            <i class="fa-solid ${value === "all" ? "fa-layer-group" : "fa-angle-right"}"></i>
          </button>
        `;
  }

  function renderFilters() {
    brandFilters.innerHTML =
      createFilterButton("all", "Todas las marcas", true) +
      brands.map((brand) => createFilterButton(brand.slug, brand.name)).join("");

    brandFilters.querySelectorAll("[data-filter-value]").forEach((button) => {
      button.addEventListener("click", () => {
        currentBrand = button.dataset.filterValue;

        brandFilters.querySelectorAll(".filter-btn").forEach((item) => {
          item.classList.toggle("active", item === button);
        });

        filterBrands();
      });
    });
  }

  function renderLogos() {
    if (!brandLogoRow) return;

    const withLogo = brands.filter((brand) => brand.logo).slice(0, 6);
    const source = withLogo.length ? withLogo : brands.slice(0, 6);

    brandLogoRow.innerHTML = source
      .map(
        (brand) => `
            <div class="logo-card">
              ${
                brand.logo
                  ? `<img src="${escapeHTML(brand.logo)}" alt="${escapeHTML(brand.name)}" loading="lazy" decoding="async" />`
                  : `<span>${escapeHTML(brand.name)}</span>`
              }
            </div>
          `,
      )
      .join("");
  }

  function renderCards() {
    brandsGrid.innerHTML = brands
      .map(
        (brand) => `
            <article class="brand-card catalog-brand"
              data-brand="${escapeHTML(brand.slug)}"
              data-name="${escapeHTML(`${brand.name} ${brand.description}`.toLowerCase())}">
              <div>
                <div class="brand-icon">
                  ${
                    brand.logo
                      ? `<img src="${escapeHTML(brand.logo)}" alt="${escapeHTML(brand.name)}" loading="lazy" decoding="async" />`
                      : `<i class="fa-solid fa-tags"></i>`
                  }
                </div>

                <div class="brand-top">
                  <h3 class="brand-name">${escapeHTML(brand.name)}</h3>
                  <span class="brand-category">Marca registrada</span>
                </div>

                <p>${escapeHTML(brand.description)}</p>

                <div class="brand-tags">
                  <span class="brand-tag">Industrial</span>
                  <a class="brand-tag brand-tag-link" href="productos.html?brand=${encodeURIComponent(brand.slug)}">Catálogo</a>
                  <a class="brand-tag brand-tag-link" href="contacto.html">Cotización</a>
                </div>
              </div>

              <div class="brand-card-footer">
                <span class="brand-status">Disponible</span>
                <a href="contacto.html" class="brand-link">Consultar</a>
              </div>
            </article>
          `,
      )
      .join("");
  }

  function getBrandLabel() {
    if (currentBrand === "all") return "Todas";
    const found = brands.find((brand) => brand.slug === currentBrand);
    return found ? found.name : currentBrand;
  }

  function updateTags() {
    const tags = [`<span class="active-filter-tag">Marca: ${escapeHTML(getBrandLabel())}</span>`];

    if (currentSearch) {
      tags.push(`<span class="active-filter-tag">Búsqueda: ${escapeHTML(currentSearch)}</span>`);
    }

    activeBrandFilters.innerHTML = tags.join("");
  }

  function filterBrands() {
    let visibleCount = 0;

    document.querySelectorAll(".catalog-brand").forEach((card) => {
      const matchesBrand = currentBrand === "all" || card.dataset.brand === currentBrand;

      const matchesSearch = currentSearch === "" || card.dataset.name.includes(currentSearch);

      const show = matchesBrand && matchesSearch;

      card.style.display = show ? "" : "none";

      if (show) visibleCount++;
    });

    brandSummary.textContent = visibleCount === 1 ? "Mostrando 1 marca." : `Mostrando ${visibleCount} marcas.`;

    emptyState.classList.toggle("show", visibleCount === 0);
    updateTags();
  }

  async function loadBrands() {
    try {
      if (!window.nymSupabase) {
        throw new Error("Supabase no está configurado.");
      }

      const { data, error } = await window.nymSupabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      brands = (data || []).map(normalizeBrand);

      if (!brands.length) {
        brandFilters.innerHTML = createFilterButton("all", "Todas las marcas", true);
        brandLogoRow.innerHTML = "";
        brandsGrid.innerHTML = "";
        brandSummary.textContent = "Mostrando 0 marcas.";
        emptyState.classList.add("show");
        return;
      }

      renderFilters();
      renderLogos();
      renderCards();
      filterBrands();
    } catch (error) {
      console.error("Error cargando marcas:", error);
      brandSummary.textContent = "No se pudieron cargar las marcas.";
      emptyState.classList.add("show");
    }
  }

  brandSearch.addEventListener("input", () => {
    currentSearch = brandSearch.value.trim().toLowerCase();
    filterBrands();
  });

  await loadBrands();
});
