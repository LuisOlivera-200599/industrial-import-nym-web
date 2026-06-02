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
let stockMovements = [];
let currentUser = null;
let selectedProductFile = null;
let selectedBrandFile = null;
let adminProductPage = 1;
let adminProductPageSize = 25;
let adminProductSort = "created_desc";
let adminFilteredProducts = [];

const menuButtons = document.querySelectorAll("[data-section]");
const sections = document.querySelectorAll(".admin-section");
const sectionTitle = document.getElementById("section-title");
const sectionDescription = document.getElementById("section-description");

const form = document.getElementById("product-form");
const list = document.getElementById("product-list");
const productPagination = document.getElementById("product-pagination");
const stockList = document.getElementById("stock-list");
const brandsList = document.getElementById("brands-list");
const categoriesList = document.getElementById("categories-list");
const subcategoriesList = document.getElementById("subcategories-list");
const leadsList = document.getElementById("leads-list");
const leadSearch = document.getElementById("lead-search");
const leadStatusFilter = document.getElementById("lead-status-filter");
const leadsNotice = document.getElementById("leads-notice");
const stockMovementForm = document.getElementById("stock-movement-form");
const stockMovementNotice = document.getElementById("stock-movement-notice");
const stockMovementProduct = document.getElementById("stock-movement-product");
const stockMovementType = document.getElementById("stock-movement-type");
const stockMovementQuantity = document.getElementById("stock-movement-quantity");
const stockMovementNote = document.getElementById("stock-movement-note");
const stockMovementList = document.getElementById("stock-movement-list");

const search = document.getElementById("admin-search");
const brandFilter = document.getElementById("brand-filter");
const categoryFilter = document.getElementById("category-filter");
const subcategoryFilter = document.getElementById("subcategory-filter");
const stockFilter = document.getElementById("stock-filter");
const productPageSize = document.getElementById("product-page-size");
const productSort = document.getElementById("product-sort");
const productResultSummary = document.getElementById("product-result-summary");
const productAddShortcut = document.getElementById("product-add-shortcut");
const productExportCsv = document.getElementById("product-export-csv");
const productImportTrigger = document.getElementById("product-import-trigger");
const productImportFile = document.getElementById("product-import-file");
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
const metricLowStock = document.getElementById("metric-low-stock");
const metricNewLeads = document.getElementById("metric-new-leads");
const metricQuotedLeads = document.getElementById("metric-quoted-leads");
const metricTopBrand = document.getElementById("metric-top-brand");

const fields = {
  id: document.getElementById("product-id"),
  name: document.getElementById("product-name"),
  brand: document.getElementById("product-brand"),
  category: document.getElementById("product-category"),
  subcategory: document.getElementById("product-subcategory"),
  image: document.getElementById("product-image"),
  stock: document.getElementById("product-stock"),
  stockQuantity: document.getElementById("product-stock-quantity"),
  lowStock: document.getElementById("product-low-stock"),
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
    title: "Gestión de productos",
    description: "Agrega, edita, elimina y revisa productos con imágenes en Supabase Storage.",
  },
  brands: {
    title: "Gestión de marcas",
    description: "Agrega, edita y elimina marcas guardadas en Supabase.",
  },
  categories: {
    title: "Gestión de categorías",
    description: "Agrega, edita y elimina categorías guardadas en Supabase.",
  },
  subcategories: {
    title: "Gestión de subcategorías",
    description: "Agrega, edita y elimina subcategorías relacionadas a cada categoría.",
  },
  stock: {
    title: "Gestión de stock",
    description: "Registra entradas, salidas y ajustes con historial por producto.",
  },
  company: {
    title: "Datos de empresa",
    description: "Edita teléfono, correo, dirección, horarios y enlaces principales de la empresa.",
  },
  leads: {
    title: "Leads de contacto",
    description: "Revisa las consultas enviadas desde la web.",
  },
  help: {
    title: "Ayuda y estado",
    description: "Resumen de conexión, base de datos y Storage.",
  },
};

function escapeHTML(text) {
  return cleanText(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanText(text) {
  return String(text || "")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Â¿/g, "¿")
    .replace(/Â¡/g, "¡")
    .replace(/Â°/g, "°")
    .replace(/Â/g, "")
    .replace(/â€¦/g, "...")
    .replace(/â†’/g, "->");
}

function cleanVisibleAdminText(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const cleaned = cleanText(node.nodeValue);
    if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
  });

  root.querySelectorAll("[placeholder], [title], [aria-label], [alt]").forEach((element) => {
    ["placeholder", "title", "aria-label", "alt"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const value = element.getAttribute(attribute);
      const cleaned = cleanText(value);
      if (cleaned !== value) element.setAttribute(attribute, cleaned);
    });
  });
}

function showNotice(element, text, type = "success") {
  element.textContent = cleanText(text);
  element.className = `notice show ${type}`;

  setTimeout(() => {
    element.className = "notice";
    element.textContent = "";
  }, 3500);
}

function setUploadStatus(text, type = "") {
  uploadStatus.textContent = cleanText(text);
  uploadStatus.className = type ? `upload-status ${type}` : "upload-status";
}

function setBrandUploadStatus(text, type = "") {
  brandUploadStatus.textContent = cleanText(text);
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
  title = "Confirmar acción",
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

  sectionTitle.textContent = cleanText(sectionInfo[sectionName].title);
  sectionDescription.textContent = cleanText(sectionInfo[sectionName].description);
}

function updateStats() {
  const activeProducts = products.filter((product) => product.is_active !== false);
  const brandCounts = new Map();
  const lowStockProducts = activeProducts.filter((product) => {
    const quantity = Number(product.stock_quantity);
    const threshold = Number(product.low_stock_threshold);
    return Number.isFinite(quantity) && Number.isFinite(threshold) && threshold > 0 && quantity <= threshold;
  });

  activeProducts.forEach((product) => {
    const brandName = product.brand || "Sin marca";
    brandCounts.set(brandName, (brandCounts.get(brandName) || 0) + 1);
  });

  const topBrand = [...brandCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  statProducts.textContent = activeProducts.length;
  statBrands.textContent = brands.filter((brand) => brand.is_active !== false).length;
  statCategories.textContent = categories.filter((category) => category.is_active !== false).length;
  statSubcategories.textContent = subcategories.filter((subcategory) => subcategory.is_active !== false).length;
  if (metricLowStock) metricLowStock.textContent = lowStockProducts.length;
  if (metricNewLeads)
    metricNewLeads.textContent = contactLeads.filter((lead) => (lead.estado || "nuevo") === "nuevo").length;
  if (metricQuotedLeads)
    metricQuotedLeads.textContent = contactLeads.filter((lead) => lead.estado === "cotizado").length;
  if (metricTopBrand) metricTopBrand.textContent = topBrand ? `${topBrand[0]} (${topBrand[1]})` : "-";
}
