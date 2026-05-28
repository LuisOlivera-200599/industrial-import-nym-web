// Admin panel entrypoint. Loaded as an ES module to keep panel state scoped.

// ---- admin-core.js ----
const DEFAULT_IMAGE = "imagenes/optimized/productos/productos-1.webp";
const PRODUCT_IMAGES_BUCKET = "product-images";
const BRAND_LOGOS_BUCKET = "brand-logos";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PRODUCT_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_BRAND_LOGO_SIZE = 2 * 1024 * 1024;

let products = [];
let brands = [];
let categories = [];
let subcategories = [];
let contactLeads = [];
let currentUser = null;
let selectedProductFile = null;
let selectedBrandFile = null;

const menuButtons = document.querySelectorAll("[data-section]");
const sections = document.querySelectorAll(".admin-section");
const sectionTitle = document.getElementById("section-title");
const sectionDescription = document.getElementById("section-description");

const form = document.getElementById("product-form");
const list = document.getElementById("product-list");
const stockList = document.getElementById("stock-list");
const brandsList = document.getElementById("brands-list");
const categoriesList = document.getElementById("categories-list");
const subcategoriesList = document.getElementById("subcategories-list");
const leadsList = document.getElementById("leads-list");
const leadSearch = document.getElementById("lead-search");
const leadStatusFilter = document.getElementById("lead-status-filter");
const leadsNotice = document.getElementById("leads-notice");

const search = document.getElementById("admin-search");
const brandFilter = document.getElementById("brand-filter");
const categoryFilter = document.getElementById("category-filter");
const subcategoryFilter = document.getElementById("subcategory-filter");
const stockFilter = document.getElementById("stock-filter");
const notice = document.getElementById("notice");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");
const logoutBtn = document.getElementById("logout-btn");
const adminModal = document.getElementById("admin-modal");
const adminModalTitle = document.getElementById("admin-modal-title");
const adminModalMessage = document.getElementById("admin-modal-message");
const adminModalCancel = document.getElementById("admin-modal-cancel");
const adminModalConfirm = document.getElementById("admin-modal-confirm");

const imagePreview = document.getElementById("image-preview");
const productFileInput = document.getElementById("product-file");
const uploadStatus = document.getElementById("upload-status");

const brandFileInput = document.getElementById("brand-file");
const brandUploadStatus = document.getElementById("brand-upload-status");

const statProducts = document.getElementById("stat-products");
const statBrands = document.getElementById("stat-brands");
const statCategories = document.getElementById("stat-categories");
const statSubcategories = document.getElementById("stat-subcategories");

const fields = {
  id: document.getElementById("product-id"),
  name: document.getElementById("product-name"),
  brand: document.getElementById("product-brand"),
  category: document.getElementById("product-category"),
  subcategory: document.getElementById("product-subcategory"),
  image: document.getElementById("product-image"),
  stock: document.getElementById("product-stock"),
  desc: document.getElementById("product-description"),
};

const brandForm = document.getElementById("brand-form");
const brandNotice = document.getElementById("brand-notice");
const brandFormTitle = document.getElementById("brand-form-title");
const brandSaveBtn = document.getElementById("brand-save-btn");
const brandResetBtn = document.getElementById("brand-reset-btn");

const brandFields = {
  id: document.getElementById("brand-id"),
  name: document.getElementById("brand-name"),
  logo: document.getElementById("brand-logo"),
  description: document.getElementById("brand-description"),
  sort: document.getElementById("brand-sort"),
  active: document.getElementById("brand-active"),
};

const categoryForm = document.getElementById("category-form");
const categoryNotice = document.getElementById("category-notice");
const categoryFormTitle = document.getElementById("category-form-title");
const categorySaveBtn = document.getElementById("category-save-btn");
const categoryResetBtn = document.getElementById("category-reset-btn");

const categoryFields = {
  id: document.getElementById("category-id"),
  name: document.getElementById("category-name"),
  description: document.getElementById("category-description"),
  icon: document.getElementById("category-icon"),
  sort: document.getElementById("category-sort"),
  active: document.getElementById("category-active"),
};

const subcategoryForm = document.getElementById("subcategory-form");
const subcategoryNotice = document.getElementById("subcategory-notice");
const subcategoryFormTitle = document.getElementById("subcategory-form-title");
const subcategorySaveBtn = document.getElementById("subcategory-save-btn");
const subcategoryResetBtn = document.getElementById("subcategory-reset-btn");

const subcategoryFields = {
  id: document.getElementById("subcategory-id"),
  name: document.getElementById("subcategory-name"),
  category: document.getElementById("subcategory-category"),
  description: document.getElementById("subcategory-description"),
  sort: document.getElementById("subcategory-sort"),
  active: document.getElementById("subcategory-active"),
};

const companyForm = document.getElementById("company-form");
const companyNotice = document.getElementById("company-notice");
const companySaveBtn = document.getElementById("company-save-btn");
const companyReloadBtn = document.getElementById("company-reload-btn");

const companyFields = {
  id: document.getElementById("company-id"),
  phone: document.getElementById("company-phone"),
  phoneRaw: document.getElementById("company-phone-raw"),
  email: document.getElementById("company-email"),
  address: document.getElementById("company-address"),
  hours: document.getElementById("company-hours"),
  whatsappUrl: document.getElementById("company-whatsapp-url"),
  mapUrl: document.getElementById("company-map-url"),
  mapEmbed: document.getElementById("company-map-embed"),
};

const companyPreview = {
  phone: document.getElementById("preview-company-phone"),
  email: document.getElementById("preview-company-email"),
  address: document.getElementById("preview-company-address"),
  hours: document.getElementById("preview-company-hours"),
};
const sectionInfo = {
  products: {
    title: "GestiÃ³n de productos",
    description: "Agrega, edita, elimina y revisa productos con imÃ¡genes en Supabase Storage.",
  },
  brands: {
    title: "GestiÃ³n de marcas",
    description: "Agrega, edita y elimina marcas guardadas en Supabase.",
  },
  categories: {
    title: "GestiÃ³n de categorÃ­as",
    description: "Agrega, edita y elimina categorÃ­as guardadas en Supabase.",
  },
  subcategories: {
    title: "GestiÃ³n de subcategorÃ­as",
    description: "Agrega, edita y elimina subcategorÃ­as relacionadas a cada categorÃ­a.",
  },
  stock: {
    title: "GestiÃ³n rÃ¡pida de stock",
    description: "Revisa el estado de disponibilidad de todos los productos.",
  },
  company: {
    title: "Datos de empresa",
    description: "Edita telÃ©fono, correo, direcciÃ³n, horarios y enlaces principales de la empresa.",
  },
  leads: {
    title: "Leads de contacto",
    description: "Revisa las consultas enviadas desde la web.",
  },
  help: {
    title: "Ayuda y estado",
    description: "Resumen de conexiÃ³n, base de datos y Storage.",
  },
};

function escapeHTML(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showNotice(element, text, type = "success") {
  element.textContent = text;
  element.className = `notice show ${type}`;

  setTimeout(() => {
    element.className = "notice";
    element.textContent = "";
  }, 3500);
}

function setUploadStatus(text, type = "") {
  uploadStatus.textContent = text;
  uploadStatus.className = type ? `upload-status ${type}` : "upload-status";
}

function setBrandUploadStatus(text, type = "") {
  brandUploadStatus.textContent = text;
  brandUploadStatus.className = type ? `upload-status ${type}` : "upload-status";
}

function getStockClass(stock) {
  const value = String(stock || "").toLowerCase();
  if (value.includes("sin")) return "unavailable";
  if (value.includes("pedido")) return "preorder";
  return "available";
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateImageFile(file, maxSize, label = "imagen") {
  if (!file) return null;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `El archivo debe ser JPG, PNG o WebP.`;
  }

  if (file.size > maxSize) {
    return `El ${label} supera ${formatFileSize(maxSize)}. Comprime el archivo antes de subirlo.`;
  }

  return null;
}

function showAdminDialog({
  title = "Confirmar acciÃ³n",
  message = "",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = true,
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    adminModalTitle.textContent = title;
    adminModalMessage.textContent = message;
    adminModalConfirm.textContent = confirmText;
    adminModalCancel.textContent = cancelText;
    adminModalCancel.style.display = showCancel ? "" : "none";
    adminModalConfirm.className = danger ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-primary";

    const close = (value) => {
      adminModal.classList.remove("show");
      adminModal.setAttribute("aria-hidden", "true");
      adminModalConfirm.removeEventListener("click", onConfirm);
      adminModalCancel.removeEventListener("click", onCancel);
      adminModal.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKeydown);
      resolve(value);
    };

    const onConfirm = () => close(true);
    const onCancel = () => close(false);
    const onBackdrop = (event) => {
      if (event.target === adminModal) close(false);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") close(false);
    };

    adminModalConfirm.addEventListener("click", onConfirm);
    adminModalCancel.addEventListener("click", onCancel);
    adminModal.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKeydown);

    adminModal.classList.add("show");
    adminModal.setAttribute("aria-hidden", "false");
    adminModalConfirm.focus();
  });
}

function showAdminAlert(title, message) {
  return showAdminDialog({
    title,
    message,
    confirmText: "Entendido",
    showCancel: false,
  });
}

function openSection(sectionName) {
  menuButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionName);
  });

  sections.forEach((section) => {
    section.classList.toggle("active", section.id === `section-${sectionName}`);
  });

  sectionTitle.textContent = sectionInfo[sectionName].title;
  sectionDescription.textContent = sectionInfo[sectionName].description;
}

function updateStats() {
  const activeProducts = products.filter((product) => product.is_active !== false);

  statProducts.textContent = activeProducts.length;
  statBrands.textContent = brands.filter((brand) => brand.is_active !== false).length;
  statCategories.textContent = categories.filter((category) => category.is_active !== false).length;
  statSubcategories.textContent = subcategories.filter((subcategory) => subcategory.is_active !== false).length;
}

// ---- admin-products.js ----
function renderProductFilters() {
  const activeBrands = brands
    .filter((brand) => brand.is_active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const activeCategories = categories
    .filter((category) => category.is_active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const activeSubcategories = subcategories
    .filter((subcategory) => subcategory.is_active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const selectedBrand = brandFilter.value || "all";
  const selectedCategory = categoryFilter.value || "all";
  const selectedSubcategory = subcategoryFilter.value || "all";

  brandFilter.innerHTML =
    '<option value="all">Todas las marcas</option>' +
    activeBrands.map((brand) => `<option value="${escapeHTML(brand.id)}">${escapeHTML(brand.name)}</option>`).join("");

  categoryFilter.innerHTML =
    '<option value="all">Todas las categorÃ­as</option>' +
    activeCategories
      .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`)
      .join("");

  subcategoryFilter.innerHTML =
    '<option value="all">Todas las subcategorÃ­as</option>' +
    activeSubcategories
      .map((subcategory) => `<option value="${escapeHTML(subcategory.id)}">${escapeHTML(subcategory.name)}</option>`)
      .join("");

  brandFilter.value = activeBrands.some((brand) => brand.id === selectedBrand) ? selectedBrand : "all";
  categoryFilter.value = activeCategories.some((category) => category.id === selectedCategory)
    ? selectedCategory
    : "all";
  subcategoryFilter.value = activeSubcategories.some((subcategory) => subcategory.id === selectedSubcategory)
    ? selectedSubcategory
    : "all";
}

function renderProductSelectors(selectedBrandId = "", selectedCategoryId = "", selectedSubcategoryId = "") {
  const activeBrands = brands
    .filter((brand) => brand.is_active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const activeCategories = categories
    .filter((category) => category.is_active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  fields.brand.innerHTML =
    '<option value="">Selecciona una marca</option>' +
    activeBrands.map((brand) => `<option value="${escapeHTML(brand.id)}">${escapeHTML(brand.name)}</option>`).join("");

  fields.category.innerHTML =
    '<option value="">Selecciona una categorÃ­a</option>' +
    activeCategories
      .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`)
      .join("");

  fields.brand.value = selectedBrandId || "";
  fields.category.value = selectedCategoryId || "";

  renderSubcategoryProductSelector(selectedCategoryId, selectedSubcategoryId);
}

function renderSubcategoryProductSelector(categoryId = "", selectedSubcategoryId = "") {
  const filteredSubcategories = subcategories
    .filter((subcategory) => subcategory.is_active !== false)
    .filter((subcategory) => !categoryId || subcategory.category_id === categoryId)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  // Si no hay categorÃ­a seleccionada, mostrar todas con el nombre de categorÃ­a entre parÃ©ntesis
  const showCategoryHint = !categoryId;

  fields.subcategory.innerHTML =
    '<option value="">Selecciona una subcategorÃ­a</option>' +
    filteredSubcategories
      .map((subcategory) => {
        const catName = showCategoryHint ? categories.find((c) => c.id === subcategory.category_id)?.name || "" : "";
        const label = catName
          ? `${escapeHTML(subcategory.name)} (${escapeHTML(catName)})`
          : escapeHTML(subcategory.name);
        return `<option value="${escapeHTML(subcategory.id)}">${label}</option>`;
      })
      .join("");

  fields.subcategory.value = selectedSubcategoryId || "";
}

function renderSubcategoryCategorySelector(selectedCategoryId = "") {
  const activeCategories = categories
    .filter((category) => category.is_active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  subcategoryFields.category.innerHTML =
    '<option value="">Selecciona una categorÃ­a</option>' +
    activeCategories
      .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`)
      .join("");

  subcategoryFields.category.value = selectedCategoryId || "";
}

function resetForm() {
  form.reset();
  fields.id.value = "";
  fields.image.value = "";
  selectedProductFile = null;
  productFileInput.value = "";
  imagePreview.src = DEFAULT_IMAGE;
  setUploadStatus("Selecciona una imagen. Se subirÃ¡ al guardar el producto.");
  formTitle.textContent = "Agregar nuevo producto";
  saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar producto';
  renderProductSelectors();
}

function resetBrandForm() {
  brandForm.reset();
  brandFields.id.value = "";
  brandFields.sort.value = 0;
  brandFields.active.value = "true";
  selectedBrandFile = null;
  brandFileInput.value = "";
  setBrandUploadStatus("Selecciona un logo. Se subirÃ¡ al guardar la marca.");
  brandFormTitle.textContent = "Agregar nueva marca";
  brandSaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar marca';
}

function resetCategoryForm() {
  categoryForm.reset();
  categoryFields.id.value = "";
  categoryFields.sort.value = 0;
  categoryFields.active.value = "true";
  categoryFormTitle.textContent = "Agregar nueva categorÃ­a";
  categorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar categorÃ­a';
}

function resetSubcategoryForm() {
  subcategoryForm.reset();
  subcategoryFields.id.value = "";
  subcategoryFields.sort.value = 0;
  subcategoryFields.active.value = "true";
  subcategoryFormTitle.textContent = "Agregar nueva subcategorÃ­a";
  subcategorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar subcategorÃ­a';
  renderSubcategoryCategorySelector();
}

async function uploadProductImage(file) {
  if (!file) return fields.image.value.trim() || DEFAULT_IMAGE;

  const validationError = validateImageFile(file, MAX_PRODUCT_IMAGE_SIZE, "producto");
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const filePath = `products/${Date.now()}-${cleanName || "producto"}.${extension}`;

  setUploadStatus("Subiendo imagen a Supabase Storage...");

  const { error: uploadError } = await window.nymSupabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data } = window.nymSupabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("No se pudo obtener la URL pÃºblica de la imagen.");
  }

  setUploadStatus("Imagen subida correctamente.", "success");
  return data.publicUrl;
}

// ---- admin-brands.js ----
async function uploadBrandLogo(file) {
  if (!file) return brandFields.logo.value.trim();

  const validationError = validateImageFile(file, MAX_BRAND_LOGO_SIZE, "logo");
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const filePath = `logos/${Date.now()}-${cleanName || "marca"}.${extension}`;

  setBrandUploadStatus("Subiendo logo a Supabase Storage...");

  const { error: uploadError } = await window.nymSupabase.storage.from(BRAND_LOGOS_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data } = window.nymSupabase.storage.from(BRAND_LOGOS_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("No se pudo obtener la URL pÃºblica del logo.");
  }

  setBrandUploadStatus("Logo subido correctamente.", "success");
  return data.publicUrl;
}

function renderBrandsList() {
  brandsList.innerHTML = brands.length
    ? brands
        .map(
          (brand) => `
        <div class="simple-item">
          <span>
            ${escapeHTML(brand.name || "Marca sin nombre")}
            ${brand.is_active === false ? '<span class="admin-tag stock-tag unavailable">Inactivo</span>' : ""}
          </span>

          <div class="brand-actions">
            <button class="icon-action" type="button" data-brand-edit="${escapeHTML(brand.id)}" title="Editar marca">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="icon-action danger" type="button" data-brand-delete="${escapeHTML(brand.id)}" title="Eliminar marca">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `,
        )
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-tags"></i>
        <h3>No hay marcas registradas</h3>
        <p>Agrega tu primera marca desde el formulario.</p>
      </div>
    `;
}

// ---- admin-taxonomy.js ----
function renderCategoriesList() {
  categoriesList.innerHTML = categories.length
    ? categories
        .map(
          (category) => `
        <div class="simple-item">
          <span>
            ${escapeHTML(category.name || "CategorÃ­a sin nombre")}
            ${category.is_active === false ? '<span class="admin-tag stock-tag unavailable">Inactivo</span>' : ""}
          </span>

          <div class="brand-actions">
            <button class="icon-action" type="button" data-category-edit="${escapeHTML(category.id)}" title="Editar categorÃ­a">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="icon-action danger" type="button" data-category-delete="${escapeHTML(category.id)}" title="Eliminar categorÃ­a">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `,
        )
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-layer-group"></i>
        <h3>No hay categorÃ­as registradas</h3>
        <p>Agrega tu primera categorÃ­a desde el formulario.</p>
      </div>
    `;
}

function renderSubcategoriesList() {
  subcategoriesList.innerHTML = subcategories.length
    ? subcategories
        .map((subcategory) => {
          const parentCategory = categories.find((category) => category.id === subcategory.category_id);

          return `
          <div class="simple-item">
            <span>
              ${escapeHTML(subcategory.name || "SubcategorÃ­a sin nombre")}
              <small>CategorÃ­a: ${escapeHTML(parentCategory?.name || "Sin categorÃ­a")}</small>
              ${subcategory.is_active === false ? '<span class="admin-tag stock-tag unavailable">Inactivo</span>' : ""}
            </span>

            <div class="brand-actions">
              <button class="icon-action" type="button" data-subcategory-edit="${escapeHTML(subcategory.id)}" title="Editar subcategorÃ­a">
                <i class="fa-solid fa-pen"></i>
              </button>

              <button class="icon-action danger" type="button" data-subcategory-delete="${escapeHTML(subcategory.id)}" title="Eliminar subcategorÃ­a">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;
        })
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-sitemap"></i>
        <h3>No hay subcategorÃ­as registradas</h3>
        <p>Agrega tu primera subcategorÃ­a desde el formulario.</p>
      </div>
    `;
}

// ---- admin-products-data.js ----
function renderProductTableRow(product) {
  const image = product.image_url || DEFAULT_IMAGE;

  return `
    <tr>
      <td>
        <div class="table-product-cell">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}" />
          <div>
            <strong>${escapeHTML(product.name || "Producto sin nombre")}</strong>
            <small>${escapeHTML(product.description || "Sin descripciÃ³n registrada.")}</small>
          </div>
        </div>
      </td>

      <td>
        <span class="admin-tag"><i class="fa-solid fa-tag"></i> ${escapeHTML(product.brand || "Sin marca")}</span>
      </td>

      <td>
        <div class="table-meta">
          <span class="admin-tag"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(product.category || "Sin categorÃ­a")}</span>
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
              <th>CategorÃ­a</th>
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
              ${escapeHTML(product.category || "Sin categorÃ­a")}
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
        <p>Cuando agregues productos, aquÃ­ verÃ¡s su stock.</p>
      </div>
    `;
}

// ---- admin-brands-data.js ----
async function loadBrands() {
  const { data, error } = await window.nymSupabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  brands = data || [];
  renderBrandsList();
  renderProductSelectors(fields.brand.value, fields.category.value, fields.subcategory.value);
  updateStats();
}

// ---- admin-taxonomy-data.js ----
async function loadCategories() {
  const { data, error } = await window.nymSupabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  categories = data || [];
  renderCategoriesList();
  renderSubcategoryCategorySelector(subcategoryFields.category.value);
  renderProductSelectors(fields.brand.value, fields.category.value, fields.subcategory.value);
  updateStats();
}

async function loadSubcategories() {
  const { data, error } = await window.nymSupabase
    .from("subcategories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  subcategories = data || [];
  renderSubcategoriesList();
  renderSubcategoryCategorySelector(subcategoryFields.category.value);
  renderSubcategoryProductSelector(fields.category.value, fields.subcategory.value);
  updateStats();
}

// ---- admin-products-save.js ----
async function loadProducts() {
  const { data, error } = await window.nymSupabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  products = data || [];
  renderProductFilters();
  renderProducts();
}

async function saveProduct(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase.from("products").update(payload).eq("id", id);

    if (error) throw error;

    showNotice(notice, "Producto actualizado correctamente.");
  } else {
    const { error } = await window.nymSupabase.from("products").insert([payload]);

    if (error) throw error;

    showNotice(notice, "Producto agregado correctamente.");
  }
}

// ---- admin-brands-save.js ----
async function saveBrand(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase.from("brands").update(payload).eq("id", id);

    if (error) throw error;

    showNotice(brandNotice, "Marca actualizada correctamente.");
  } else {
    const { error } = await window.nymSupabase.from("brands").insert([payload]);

    if (error) throw error;

    showNotice(brandNotice, "Marca agregada correctamente.");
  }
}

// ---- admin-taxonomy-save.js ----
async function saveCategory(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase.from("categories").update(payload).eq("id", id);

    if (error) throw error;

    showNotice(categoryNotice, "CategorÃ­a actualizada correctamente.");
  } else {
    const { error } = await window.nymSupabase.from("categories").insert([payload]);

    if (error) throw error;

    showNotice(categoryNotice, "CategorÃ­a agregada correctamente.");
  }
}

async function saveSubcategory(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase.from("subcategories").update(payload).eq("id", id);

    if (error) throw error;

    showNotice(subcategoryNotice, "SubcategorÃ­a actualizada correctamente.");
  } else {
    const { error } = await window.nymSupabase.from("subcategories").insert([payload]);

    if (error) throw error;

    showNotice(subcategoryNotice, "SubcategorÃ­a agregada correctamente.");
  }
}

// ---- admin-products-delete.js ----
async function deleteProduct(id) {
  const { error } = await window.nymSupabase.from("products").delete().eq("id", id);

  if (error) throw error;
}

// ---- admin-brands-delete.js ----
async function deleteBrand(id) {
  const inUse = products.some((product) => product.brand_id === id);

  if (inUse) {
    throw new Error("No puedes eliminar esta marca porque estÃ¡ asignada a uno o mÃ¡s productos.");
  }

  const { error } = await window.nymSupabase.from("brands").delete().eq("id", id);

  if (error) throw error;
}

// ---- admin-taxonomy-delete.js ----
async function deleteCategory(id) {
  const categoryHasProducts = products.some((product) => product.category_id === id);
  const categoryHasSubcategories = subcategories.some((subcategory) => subcategory.category_id === id);

  if (categoryHasProducts || categoryHasSubcategories) {
    throw new Error("No puedes eliminar esta categorÃ­a porque tiene productos o subcategorÃ­as relacionadas.");
  }

  const { error } = await window.nymSupabase.from("categories").delete().eq("id", id);

  if (error) throw error;
}

async function deleteSubcategory(id) {
  const inUse = products.some((product) => product.subcategory_id === id);

  if (inUse) {
    throw new Error("No puedes eliminar esta subcategorÃ­a porque estÃ¡ asignada a uno o mÃ¡s productos.");
  }

  const { error } = await window.nymSupabase.from("subcategories").delete().eq("id", id);

  if (error) throw error;
}

// ---- admin-company.js ----
function updateCompanyPreview() {
  companyPreview.phone.textContent = companyFields.phone.value || "-";
  companyPreview.email.textContent = companyFields.email.value || "-";
  companyPreview.address.textContent = companyFields.address.value || "-";
  companyPreview.hours.textContent = companyFields.hours.value || "-";
}

async function loadCompanySettings() {
  const { data, error } = await window.nymSupabase.from("company_settings").select("*").limit(1).maybeSingle();

  if (error) throw error;

  if (!data) {
    companyFields.id.value = "";
    companyFields.phone.value = "966 441 035";
    companyFields.phoneRaw.value = "51966441035";
    companyFields.email.value = "oliveravelasquezluis@gmail.com";
    companyFields.address.value = "Av. Republica de Argentina 211, Lima 15079";
    companyFields.hours.value = "Lun - SÃ¡b / 10:00 am - 5:00 pm";
    companyFields.whatsappUrl.value = "https://wa.me/51966441035";
    companyFields.mapUrl.value = "https://www.google.com/maps/place/Av.+Republica+de+Argentina+211,+Lima+15079/";
    companyFields.mapEmbed.value = "";
    updateCompanyPreview();
    return;
  }

  companyFields.id.value = data.id || "";
  companyFields.phone.value = data.phone || "";
  companyFields.phoneRaw.value = data.phone_raw || "";
  companyFields.email.value = data.email || "";
  companyFields.address.value = data.address || "";
  companyFields.hours.value = data.hours || "";
  companyFields.whatsappUrl.value = data.whatsapp_url || "";
  companyFields.mapUrl.value = data.map_url || "";
  companyFields.mapEmbed.value = data.map_embed || "";
  updateCompanyPreview();
}

async function saveCompanySettings() {
  const payload = {
    phone: companyFields.phone.value.trim(),
    phone_raw: companyFields.phoneRaw.value.trim(),
    email: companyFields.email.value.trim(),
    address: companyFields.address.value.trim(),
    hours: companyFields.hours.value.trim(),
    whatsapp_url: companyFields.whatsappUrl.value.trim(),
    map_url: companyFields.mapUrl.value.trim(),
    map_embed: companyFields.mapEmbed.value.trim(),
  };

  if (!payload.phone || !payload.email || !payload.address) {
    showNotice(companyNotice, "Completa telÃ©fono, correo y direcciÃ³n.", "error");
    return;
  }

  companySaveBtn.disabled = true;

  try {
    if (companyFields.id.value) {
      const { error } = await window.nymSupabase
        .from("company_settings")
        .update(payload)
        .eq("id", companyFields.id.value);

      if (error) throw error;
    } else {
      const { data, error } = await window.nymSupabase.from("company_settings").insert([payload]).select().single();

      if (error) throw error;

      companyFields.id.value = data.id;
    }

    updateCompanyPreview();
    showNotice(companyNotice, "Datos de empresa guardados correctamente.");
  } catch (error) {
    console.error(error);
    showNotice(companyNotice, error.message || "No se pudieron guardar los datos.", "error");
  } finally {
    companySaveBtn.disabled = false;
  }
}

// ---- admin-leads.js ----
const leadStatusLabels = {
  nuevo: "Nuevo",
  atendido: "Atendido",
  descartado: "Archivado",
};

function formatLeadDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

function getLeadStatusClass(status) {
  if (status === "atendido") return "available";
  if (status === "descartado") return "unavailable";
  return "preorder";
}

function getLeadSearchText(lead) {
  return [lead.nombre, lead.empresa, lead.correo, lead.telefono, lead.tipo, lead.categoria, lead.estado, lead.mensaje]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildLeadWhatsappUrl(lead) {
  const phone = String(lead.telefono || "").replace(/\D/g, "");
  if (!phone) return "";

  const normalizedPhone = phone.length === 9 ? `51${phone}` : phone;
  const message = [
    `Hola ${lead.nombre || ""}`.trim(),
    "Te escribimos de Industrial Import NYM para atender tu consulta.",
  ].join("\n");

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function getFilteredLeads() {
  const query = (leadSearch?.value || "").trim().toLowerCase();
  const status = leadStatusFilter?.value || "all";

  return contactLeads.filter((lead) => {
    const matchesSearch = !query || getLeadSearchText(lead).includes(query);
    const matchesStatus = status === "all" || (lead.estado || "nuevo") === status;
    return matchesSearch && matchesStatus;
  });
}

function renderLeads() {
  if (!leadsList) return;

  const leads = getFilteredLeads();

  leadsList.innerHTML = leads.length
    ? leads
        .map((lead) => {
          const status = lead.estado || "nuevo";
          const whatsappUrl = buildLeadWhatsappUrl(lead);

          return `
          <div class="simple-item lead-item">
            <span class="lead-item-main">
              ${escapeHTML(lead.nombre || "Contacto sin nombre")}
              <small>
                ${escapeHTML(lead.empresa || "Sin empresa")} /
                ${escapeHTML(lead.correo || "Sin correo")} /
                ${escapeHTML(lead.telefono || "Sin telefono")}
              </small>
              <small>
                ${escapeHTML(lead.tipo || "Consulta")} - ${escapeHTML(lead.categoria || "Sin categoria")}
              </small>
              <small class="lead-message">${escapeHTML(lead.mensaje || "Sin mensaje")}</small>
              <small>${escapeHTML(formatLeadDate(lead.created_at))}</small>
            </span>

            <span class="lead-actions">
              <span class="admin-tag stock-tag ${getLeadStatusClass(status)}">${escapeHTML(leadStatusLabels[status] || status)}</span>
              ${whatsappUrl ? `<a class="admin-btn admin-btn-light" href="${escapeHTML(whatsappUrl)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ""}
              ${status !== "atendido" ? `<button class="admin-btn admin-btn-primary" type="button" data-lead-status="atendido" data-lead-id="${escapeHTML(lead.id)}">Atendido</button>` : ""}
              ${status !== "descartado" ? `<button class="admin-btn admin-btn-light" type="button" data-lead-status="descartado" data-lead-id="${escapeHTML(lead.id)}">Archivar</button>` : ""}
              ${status !== "nuevo" ? `<button class="admin-btn admin-btn-light" type="button" data-lead-status="nuevo" data-lead-id="${escapeHTML(lead.id)}">Reabrir</button>` : ""}
            </span>
          </div>
        `;
        })
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-inbox"></i>
        <h3>No hay leads para este filtro</h3>
        <p>Las consultas nuevas y cotizaciones guardadas apareceran aqui.</p>
      </div>
    `;

  leadsList.querySelectorAll("[data-lead-status]").forEach((button) => {
    button.addEventListener("click", () => {
      saveLeadStatus(button.dataset.leadId, button.dataset.leadStatus);
    });
  });
}

async function saveLeadStatus(leadId, status) {
  if (!leadId || !status) return;

  try {
    const { error } = await window.nymSupabase.from("contact_leads").update({ estado: status }).eq("id", leadId);

    if (error) throw error;

    contactLeads = contactLeads.map((lead) =>
      String(lead.id) === String(leadId) ? { ...lead, estado: status } : lead,
    );

    renderLeads();
    if (leadsNotice) showNotice(leadsNotice, "Lead actualizado correctamente.");
  } catch (error) {
    console.error(error);
    if (leadsNotice) showNotice(leadsNotice, error.message || "No se pudo actualizar el lead.", "error");
  }
}

async function loadContactLeads() {
  if (!leadsList) return;

  try {
    const { data, error } = await window.nymSupabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    contactLeads = data || [];
    renderLeads();
  } catch (error) {
    console.error(error);
    leadsList.innerHTML = `
      <div class="empty-state-admin">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>No se pudieron cargar los leads</h3>
        <p>${escapeHTML(error.message || "Revisa las politicas RLS de contact_leads.")}</p>
      </div>
    `;
  }
}

leadSearch?.addEventListener("input", renderLeads);
leadStatusFilter?.addEventListener("change", renderLeads);

// ---- admin-session.js ----
async function requireSession() {
  const { data, error } = await window.nymSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "admin-login.html";
    return false;
  }

  currentUser = data.session.user;
  localStorage.setItem("nymAdminSession", "active");
  localStorage.setItem("nymAdminUser", currentUser.email || "admin");
  return true;
}

// ---- admin-events-core.js ----
menuButtons.forEach((button) => {
  button.addEventListener("click", () => openSection(button.dataset.section));
});

// ---- admin-events-products.js ----
productFileInput.addEventListener("change", () => {
  const file = productFileInput.files?.[0];

  if (!file) {
    selectedProductFile = null;
    setUploadStatus("Selecciona una imagen. Se subirÃ¡ al guardar el producto.");
    return;
  }

  const validationError = validateImageFile(file, MAX_PRODUCT_IMAGE_SIZE, "producto");
  if (validationError) {
    selectedProductFile = null;
    productFileInput.value = "";
    setUploadStatus(validationError, "error");
    return;
  }

  selectedProductFile = file;
  imagePreview.src = URL.createObjectURL(file);
  setUploadStatus(`Imagen lista: ${file.name} (${formatFileSize(file.size)})`);
});

brandFileInput.addEventListener("change", () => {
  const file = brandFileInput.files?.[0];

  if (!file) {
    selectedBrandFile = null;
    setBrandUploadStatus("Selecciona un logo. Se subirÃ¡ al guardar la marca.");
    return;
  }

  const validationError = validateImageFile(file, MAX_BRAND_LOGO_SIZE, "logo");
  if (validationError) {
    selectedBrandFile = null;
    brandFileInput.value = "";
    setBrandUploadStatus(validationError, "error");
    return;
  }

  selectedBrandFile = file;
  setBrandUploadStatus(`Logo listo: ${file.name} (${formatFileSize(file.size)})`);
});

fields.category.addEventListener("change", () => {
  renderSubcategoryProductSelector(fields.category.value);
});

// Al elegir subcategorÃ­a â†’ auto-selecciona su categorÃ­a padre
fields.subcategory.addEventListener("change", () => {
  const subId = fields.subcategory.value;
  if (!subId) return;

  const sub = subcategories.find((s) => s.id === subId);
  if (!sub || !sub.category_id) return;

  // Si la categorÃ­a padre es distinta a la actual, actualizarla
  if (fields.category.value !== sub.category_id) {
    fields.category.value = sub.category_id;
    // Refrescar lista de subcategorÃ­as para mostrar solo las de esa categorÃ­a
    // manteniendo la subcategorÃ­a que el usuario ya eligiÃ³
    renderSubcategoryProductSelector(sub.category_id, subId);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedBrand = brands.find((brand) => brand.id === fields.brand.value);
  const selectedCategory = categories.find((category) => category.id === fields.category.value);
  const selectedSubcategory = subcategories.find((subcategory) => subcategory.id === fields.subcategory.value);

  if (!fields.name.value.trim() || !selectedBrand || !selectedCategory) {
    showNotice(notice, "Completa nombre, marca y categorÃ­a.", "error");
    return;
  }

  saveBtn.disabled = true;

  try {
    const finalImageUrl = await uploadProductImage(selectedProductFile);

    const payload = {
      name: fields.name.value.trim(),
      brand_id: selectedBrand.id,
      category_id: selectedCategory.id,
      subcategory_id: selectedSubcategory?.id || null,
      brand: selectedBrand.name || "",
      category: selectedCategory.name || "",
      subcategory: selectedSubcategory?.name || "",
      image_url: finalImageUrl,
      stock_status: fields.stock.value,
      description: fields.desc.value.trim(),
      is_active: true,
    };

    await saveProduct(payload, fields.id.value);
    resetForm();
    await loadProducts();
  } catch (error) {
    console.error(error);
    setUploadStatus(error.message || "No se pudo subir la imagen.", "error");
    showNotice(notice, error.message || "No se pudo guardar el producto.", "error");
  } finally {
    saveBtn.disabled = false;
  }
});

list.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const product = products.find((item) => item.id === editButton.dataset.edit);
    if (!product) return;

    const brandId = product.brand_id || brands.find((brand) => brand.name === product.brand)?.id || "";
    const categoryId =
      product.category_id || categories.find((category) => category.name === product.category)?.id || "";
    const subcategoryId =
      product.subcategory_id || subcategories.find((subcategory) => subcategory.name === product.subcategory)?.id || "";

    fields.id.value = product.id;
    fields.name.value = product.name || "";
    fields.image.value = product.image_url || "";
    fields.stock.value = product.stock_status || "Disponible";
    fields.desc.value = product.description || "";
    imagePreview.src = product.image_url || DEFAULT_IMAGE;

    selectedProductFile = null;
    productFileInput.value = "";

    setUploadStatus("Puedes mantener la imagen actual o seleccionar una nueva.");
    renderProductSelectors(brandId, categoryId, subcategoryId);

    formTitle.textContent = "Editar producto";
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar producto';

    openSection("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (deleteButton) {
    const product = products.find((item) => item.id === deleteButton.dataset.delete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar producto",
      message: `Â¿Seguro que deseas eliminar "${product?.name || "este producto"}"? Esta acciÃ³n no se puede deshacer.`,
      confirmText: "Eliminar",
      danger: true,
    });

    if (!shouldDelete) return;

    try {
      await deleteProduct(deleteButton.dataset.delete);
      await loadProducts();
      showNotice(notice, "Producto eliminado correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(notice, error.message || "No se pudo eliminar el producto.", "error");
    }
  }
});

// ---- admin-events-brands.js ----
brandForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!brandFields.name.value.trim()) {
    showNotice(brandNotice, "Completa el nombre de la marca.", "error");
    return;
  }

  brandSaveBtn.disabled = true;

  try {
    const uploadedLogoUrl = await uploadBrandLogo(selectedBrandFile);

    const payload = {
      name: brandFields.name.value.trim(),
      logo_url: uploadedLogoUrl,
      description: brandFields.description.value.trim(),
      sort_order: Number(brandFields.sort.value || 0),
      is_active: brandFields.active.value === "true",
    };

    await saveBrand(payload, brandFields.id.value);
    resetBrandForm();
    await loadBrands();
  } catch (error) {
    console.error(error);
    setBrandUploadStatus(error.message || "No se pudo subir el logo.", "error");
    showNotice(brandNotice, error.message || "No se pudo guardar la marca.", "error");
  } finally {
    brandSaveBtn.disabled = false;
  }
});

brandsList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-brand-edit]");
  const deleteButton = event.target.closest("[data-brand-delete]");

  if (editButton) {
    const brand = brands.find((item) => item.id === editButton.dataset.brandEdit);
    if (!brand) return;

    brandFields.id.value = brand.id;
    brandFields.name.value = brand.name || "";
    brandFields.logo.value = brand.logo_url || "";
    brandFields.description.value = brand.description || "";
    brandFields.sort.value = brand.sort_order || 0;
    brandFields.active.value = String(brand.is_active !== false);

    selectedBrandFile = null;
    brandFileInput.value = "";

    setBrandUploadStatus("Puedes mantener el logo actual o seleccionar uno nuevo.");
    brandFormTitle.textContent = "Editar marca";
    brandSaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar marca';
  }

  if (deleteButton) {
    const brand = brands.find((item) => item.id === deleteButton.dataset.brandDelete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar marca",
      message: `Â¿Seguro que deseas eliminar "${brand?.name || "esta marca"}"?`,
      confirmText: "Eliminar",
      danger: true,
    });

    if (!shouldDelete) return;

    try {
      await deleteBrand(deleteButton.dataset.brandDelete);
      await loadBrands();
      showNotice(brandNotice, "Marca eliminada correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(brandNotice, error.message || "No se pudo eliminar la marca.", "error");
    }
  }
});

// ---- admin-events-taxonomy.js ----
categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: categoryFields.name.value.trim(),
    description: categoryFields.description.value.trim(),
    icon: categoryFields.icon.value.trim(),
    sort_order: Number(categoryFields.sort.value || 0),
    is_active: categoryFields.active.value === "true",
  };

  if (!payload.name) {
    showNotice(categoryNotice, "Completa el nombre de la categorÃ­a.", "error");
    return;
  }

  categorySaveBtn.disabled = true;

  try {
    await saveCategory(payload, categoryFields.id.value);
    resetCategoryForm();
    await loadCategories();
  } catch (error) {
    console.error(error);
    showNotice(categoryNotice, error.message || "No se pudo guardar la categorÃ­a.", "error");
  } finally {
    categorySaveBtn.disabled = false;
  }
});

categoriesList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-category-edit]");
  const deleteButton = event.target.closest("[data-category-delete]");

  if (editButton) {
    const category = categories.find((item) => item.id === editButton.dataset.categoryEdit);
    if (!category) return;

    categoryFields.id.value = category.id;
    categoryFields.name.value = category.name || "";
    categoryFields.description.value = category.description || "";
    categoryFields.icon.value = category.icon || "";
    categoryFields.sort.value = category.sort_order || 0;
    categoryFields.active.value = String(category.is_active !== false);

    categoryFormTitle.textContent = "Editar categorÃ­a";
    categorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar categorÃ­a';
  }

  if (deleteButton) {
    const category = categories.find((item) => item.id === deleteButton.dataset.categoryDelete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar categorÃ­a",
      message: `Â¿Seguro que deseas eliminar "${category?.name || "esta categorÃ­a"}"?`,
      confirmText: "Eliminar",
      danger: true,
    });

    if (!shouldDelete) return;

    try {
      await deleteCategory(deleteButton.dataset.categoryDelete);
      await loadCategories();
      await loadSubcategories();
      showNotice(categoryNotice, "CategorÃ­a eliminada correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(categoryNotice, error.message || "No se pudo eliminar la categorÃ­a.", "error");
    }
  }
});

subcategoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedCategory = categories.find((category) => category.id === subcategoryFields.category.value);

  const payload = {
    name: subcategoryFields.name.value.trim(),
    category_id: selectedCategory?.id || null,
    description: subcategoryFields.description.value.trim(),
    sort_order: Number(subcategoryFields.sort.value || 0),
    is_active: subcategoryFields.active.value === "true",
  };

  if (!payload.name || !payload.category_id) {
    showNotice(subcategoryNotice, "Completa nombre y categorÃ­a principal.", "error");
    return;
  }

  subcategorySaveBtn.disabled = true;

  try {
    await saveSubcategory(payload, subcategoryFields.id.value);
    resetSubcategoryForm();
    await loadSubcategories();
  } catch (error) {
    console.error(error);
    showNotice(subcategoryNotice, error.message || "No se pudo guardar la subcategorÃ­a.", "error");
  } finally {
    subcategorySaveBtn.disabled = false;
  }
});

subcategoriesList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-subcategory-edit]");
  const deleteButton = event.target.closest("[data-subcategory-delete]");

  if (editButton) {
    const subcategory = subcategories.find((item) => item.id === editButton.dataset.subcategoryEdit);
    if (!subcategory) return;

    subcategoryFields.id.value = subcategory.id;
    subcategoryFields.name.value = subcategory.name || "";
    subcategoryFields.category.value = subcategory.category_id || "";
    subcategoryFields.description.value = subcategory.description || "";
    subcategoryFields.sort.value = subcategory.sort_order || 0;
    subcategoryFields.active.value = String(subcategory.is_active !== false);

    subcategoryFormTitle.textContent = "Editar subcategorÃ­a";
    subcategorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar subcategorÃ­a';
  }

  if (deleteButton) {
    const subcategory = subcategories.find((item) => item.id === deleteButton.dataset.subcategoryDelete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar subcategorÃ­a",
      message: `Â¿Seguro que deseas eliminar "${subcategory?.name || "esta subcategorÃ­a"}"?`,
      confirmText: "Eliminar",
      danger: true,
    });

    if (!shouldDelete) return;

    try {
      await deleteSubcategory(deleteButton.dataset.subcategoryDelete);
      await loadSubcategories();
      showNotice(subcategoryNotice, "SubcategorÃ­a eliminada correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(subcategoryNotice, error.message || "No se pudo eliminar la subcategorÃ­a.", "error");
    }
  }
});

// ---- admin-events-filters.js ----
fields.image.addEventListener("input", () => {
  if (!selectedProductFile) {
    imagePreview.src = fields.image.value.trim() || DEFAULT_IMAGE;
  }
});

imagePreview.addEventListener("error", () => {
  imagePreview.src = DEFAULT_IMAGE;
});

search.addEventListener("input", renderProducts);
brandFilter.addEventListener("change", renderProducts);
categoryFilter.addEventListener("change", () => {
  const selectedCategory = categoryFilter.value;

  const activeSubcategories = subcategories
    .filter((subcategory) => subcategory.is_active !== false)
    .filter((subcategory) => selectedCategory === "all" || subcategory.category_id === selectedCategory)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  subcategoryFilter.innerHTML =
    '<option value="all">Todas las subcategorÃ­as</option>' +
    activeSubcategories
      .map((subcategory) => `<option value="${escapeHTML(subcategory.id)}">${escapeHTML(subcategory.name)}</option>`)
      .join("");

  subcategoryFilter.value = "all";
  renderProducts();
});
subcategoryFilter.addEventListener("change", renderProducts);
stockFilter.addEventListener("change", renderProducts);

resetBtn.addEventListener("click", resetForm);
brandResetBtn.addEventListener("click", resetBrandForm);
categoryResetBtn.addEventListener("click", resetCategoryForm);
subcategoryResetBtn.addEventListener("click", resetSubcategoryForm);

// ---- admin-events-company.js ----
companyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveCompanySettings();
});

companyReloadBtn.addEventListener("click", async () => {
  try {
    await loadCompanySettings();
    showNotice(companyNotice, "Datos recargados correctamente.");
  } catch (error) {
    console.error(error);
    showNotice(companyNotice, "No se pudieron recargar los datos.", "error");
  }
});

Object.values(companyFields).forEach((field) => {
  field.addEventListener("input", updateCompanyPreview);
});

// ---- admin-init.js ----
logoutBtn.addEventListener("click", async () => {
  await window.nymSupabase.auth.signOut();
  localStorage.removeItem("nymAdminSession");
  localStorage.removeItem("nymAdminUser");
  window.location.href = "admin-login.html";
});

(async function initAdmin() {
  try {
    const sessionOk = await requireSession();
    if (!sessionOk) return;

    await loadBrands();
    await loadCategories();
    await loadSubcategories();
    await loadProducts();
    await loadCompanySettings();
    await loadContactLeads();
  } catch (error) {
    console.error(error);
    await showAdminAlert("No se pudo cargar el admin", error.message || String(error));
  }
})();
