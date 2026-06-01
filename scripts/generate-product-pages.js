const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");

const root = process.cwd();
const baseUrl = "https://luisolivera-200599.github.io/industrial-import-nym-web";
const outputDir = path.join(root, "producto");
const config = fs.readFileSync(path.join(root, "js", "supabase-config.js"), "utf8");
const urlMatch = config.match(/SUPABASE_URL\s*=\s*"([^"]+)"/);
const keyMatch = config.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*"([^"]+)"/);

if (!urlMatch || !keyMatch) {
  throw new Error("No se pudo leer la configuracion publica de Supabase.");
}

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

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
    .replace(/Â/g, "")
    .replace(/â€¦/g, "...")
    .replace(/â†’/g, "->");
}

function getProductUrl(product) {
  const slug = slugify(product.name || "producto");
  return `${baseUrl}/producto/${slug}--${encodeURIComponent(product.id)}/`;
}

function renderProductPage(product) {
  const name = product.name || "Producto Industrial";
  const description =
    product.description || "Producto disponible para consulta comercial en INDUSTRIAL IMPORT COMPANY S.R.L..";
  const canonical = getProductUrl(product);
  const image = product.image_url || "imagenes/optimized/productos/productos-1.webp";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="../../" />
    <meta name="description" content="${escapeHTML(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHTML(canonical)}" />
    <meta property="og:title" content="${escapeHTML(name)} | INDUSTRIAL IMPORT COMPANY S.R.L." />
    <meta property="og:description" content="${escapeHTML(description)}" />
    <meta property="og:image" content="${escapeHTML(image)}" />
    <title>${escapeHTML(name)} | INDUSTRIAL IMPORT COMPANY S.R.L.</title>
    <link rel="icon" href="imagenes/optimized/banners/banner-1.webp" type="image/webp" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
    <link rel="stylesheet" href="css/style.css" />
    <link rel="stylesheet" href="css/product-detail.css" />
  </head>
  <body>
    <header class="header">
      <div class="container nav">
        <a href="index.html" class="logo">
          <div class="logo-mark">IIC</div>
          <div class="logo-text">
            <h1>INDUSTRIAL IMPORT COMPANY S.R.L.</h1>
            <p>Catalogo industrial</p>
          </div>
        </a>

        <nav class="nav-menu" id="nav-menu">
          <a href="index.html">Inicio</a>
          <a href="productos.html" class="active">Productos</a>
          <a href="marcas.html">Marcas</a>
          <a href="contacto.html">Contacto</a>
        </nav>
      </div>
    </header>

    <main class="detail-section">
      <div class="container">
        <a href="productos.html" class="section-badge"><i class="fa-solid fa-arrow-left"></i>&nbsp; Volver al catalogo</a>
        <div class="detail-shell" id="product-detail">
          <div class="detail-media">
            <img src="${escapeHTML(image)}" alt="${escapeHTML(name)}" />
          </div>
          <div class="detail-info">
            <span class="product-brand">Cargando...</span>
            <h2>${escapeHTML(name)}</h2>
            <p>${escapeHTML(description)}</p>
          </div>
        </div>
      </div>
    </main>

    <script>
      window.NYM_PRODUCT_ID = ${JSON.stringify(product.id)};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-config.js?v=20260601-products"></script>
    <script src="js/site-utils.js?v=20260601-products"></script>
    <script src="js/product-detail.js?v=20260601-products"></script>
  </body>
</html>
`;
}

function renderSitemap(products) {
  const staticPages = [
    ["", "weekly", "1.0"],
    ["productos.html", "weekly", "0.9"],
    ["marcas.html", "monthly", "0.7"],
    ["nosotros.html", "monthly", "0.6"],
    ["clientes.html", "monthly", "0.6"],
    ["contacto.html", "monthly", "0.8"],
  ];

  const today = new Date().toISOString().slice(0, 10);
  const urls = staticPages
    .map(([page, freq, priority]) => {
      const loc = page ? `${baseUrl}/${page}` : `${baseUrl}/`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  const productUrls = products
    .map(
      (product) => `  <url>
    <loc>${getProductUrl(product)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
${productUrls}
</urlset>
`;
}

async function fetchProducts() {
  const pageSize = 1000;
  const products = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const endpoint = new URL(`${supabaseUrl}/rest/v1/products`);
    endpoint.searchParams.set(
      "select",
      "id,name,description,image_url,stock_status,brand,category,subcategory,brands(name),categories(name)",
    );
    endpoint.searchParams.set("is_active", "neq.false");
    endpoint.searchParams.set("order", "created_at.desc");

    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Range: `${from}-${to}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase respondio ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    products.push(...data);

    if (data.length < pageSize) break;
  }

  return products;
}

async function main() {
  const products = await fetchProducts();
  fs.rmSync(outputDir, { recursive: true, force: true });

  for (const product of products) {
    const slug = `${slugify(product.name || "producto")}--${product.id}`;
    const productDir = path.join(outputDir, slug);
    const html = await prettier.format(renderProductPage(product), {
      parser: "html",
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
    });

    fs.mkdirSync(productDir, { recursive: true });
    fs.writeFileSync(path.join(productDir, "index.html"), html, "utf8");
  }

  fs.writeFileSync(path.join(root, "sitemap.xml"), renderSitemap(products), "utf8");
  console.log(`Generated ${products.length} product pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
