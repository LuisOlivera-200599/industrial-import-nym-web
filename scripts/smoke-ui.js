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
expectIncludes("admin.html", "section-leads");
expectIncludes("admin.html", "lead-status-filter");
expectIncludes("admin.html", "product-sort");
expectIncludes("admin.html", "product-stock-quantity");
expectIncludes("admin.html", "stock-movement-form");
expectIncludes("admin.html", 'type="module" src="js/admin-app.js?v=20260602-admin-table"');
expectIncludes("admin.html", "product-export-csv");
expectIncludes("admin.html", "product-page-size");
expectIncludes("admin.html", "admin-modal");
expectIncludes("js/admin-components.js", "data-product-page-size");
expectIncludes("js/admin-products-data.js", "downloadAdminProductsCsv");
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
