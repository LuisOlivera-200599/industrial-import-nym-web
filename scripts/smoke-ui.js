const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const failures = [];
const baseUrl = "https://luisolivera-200599.github.io/industrial-import-nym-web/";

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function expectIncludes(file, expected) {
  const content = read(file);
  if (!content.includes(expected)) {
    failures.push(`${file}: missing ${expected}`);
  }
}

function normalizeLocalRef(ref) {
  if (
    !ref ||
    ref.startsWith("#") ||
    ref.startsWith("http:") ||
    ref.startsWith("https:") ||
    ref.startsWith("mailto:") ||
    ref.startsWith("tel:") ||
    ref.startsWith("javascript:")
  ) {
    return "";
  }

  return decodeURIComponent(ref.split("#")[0].split("?")[0]).replace(/^\.\//, "");
}

function collectRefs(file) {
  const content = read(file);
  const refs = [];
  const attrRegex = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

  for (const match of content.matchAll(attrRegex)) {
    const ref = normalizeLocalRef(match[1]);
    if (ref && !ref.startsWith("//")) refs.push(ref);
  }

  return refs;
}

for (const file of [
  "index.html",
  "productos.html",
  "producto.html",
  "marcas.html",
  "nosotros.html",
  "clientes.html",
  "contacto.html",
  "admin.html",
  "admin-legacy.html",
  "admin-login.html",
  "404.html",
]) {
  if (!exists(file)) {
    failures.push(`${file}: missing`);
    continue;
  }

  for (const ref of collectRefs(file)) {
    if (/\.(html|css|js|png|jpg|jpeg|webp|ico|mp4|xml|txt)$/i.test(ref) && !exists(ref)) {
      failures.push(`${file}: broken local reference ${ref}`);
    }
  }
}

expectIncludes("index.html", "videos/hero-electronica-optimized.mp4");
expectIncludes("index.html", `<link rel="canonical" href="${baseUrl}"`);
expectIncludes("productos.html", "quote-panel");
expectIncludes("productos.html", "quote-items");
expectIncludes("productos.html", "js/catalog.js");
expectIncludes("js/catalog.js", "producto/${slugify(product.name)}--");
expectIncludes("producto.html", "js/product-detail.js");
expectIncludes("admin.html", "admin-root");
expectIncludes("admin.html", "css/admin-react.css");
expectIncludes("admin.html", "js/admin-react.iife.js");
expectIncludes("admin.html", "xlsx.full.min.js");
expectIncludes("src/admin/main.jsx", "BrandsPanel");
expectIncludes("src/admin/main.jsx", "CategoriesPanel");
expectIncludes("src/admin/main.jsx", "SubcategoriesPanel");
expectIncludes("src/admin/main.jsx", "CompanyPanel");
expectIncludes("src/admin/main.jsx", "AdminUsersPanel");
expectIncludes("src/admin/main.jsx", "TrashPanel");
expectIncludes("src/admin/main.jsx", "globalResults");
expectIncludes("admin-legacy.html", "section-leads");
expectIncludes("admin-legacy.html", "lead-status-filter");
expectIncludes("admin-legacy.html", "product-sort");
expectIncludes("admin-legacy.html", "product-stock-quantity");
expectIncludes("admin-legacy.html", "stock-movement-form");
expectIncludes("admin-legacy.html", 'type="module" src="js/admin-app.js?v=20260602-admin-pro"');
expectIncludes("admin-legacy.html", "product-export-csv");
expectIncludes("admin-legacy.html", "product-page-size");
expectIncludes("admin-legacy.html", "product-import-trigger");
expectIncludes("admin-legacy.html", "metric-low-stock");
expectIncludes("admin-legacy.html", "admin-modal");
expectIncludes("src/admin/main.jsx", "createRoot");
expectIncludes("src/admin/main.jsx", "AuditPanel");
expectIncludes("js/admin-components.js", "data-product-page-size");
expectIncludes("js/admin-components.js", "data-quick-save");
expectIncludes("js/admin-products-data.js", "downloadAdminProductsCsv");
expectIncludes("js/admin-products-data.js", "importAdminProductsFromFile");
expectIncludes("js/admin-leads.js", "cotizado");
expectIncludes("js/admin-audit.js", "recordAdminAudit");
expectIncludes("js/admin-leads.js", "data-lead-save-notes");
expectIncludes("js/admin-stock.js", "stock_movements");
expectIncludes("robots.txt", `${baseUrl}sitemap.xml`);
expectIncludes("sitemap.xml", `${baseUrl}productos.html`);
expectIncludes("sitemap.xml", `${baseUrl}producto/`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("UI smoke check OK");
