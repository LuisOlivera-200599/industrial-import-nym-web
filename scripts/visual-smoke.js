const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = process.cwd();
const outputDir = path.join(root, ".visual-smoke");
const port = 4178;
const baseUrl = `http://127.0.0.1:${port}`;

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const productDir = path.join(root, "producto");
const firstGeneratedProduct = fs.existsSync(productDir)
  ? fs.readdirSync(productDir, { withFileTypes: true }).find((entry) => entry.isDirectory())?.name
  : "";

const pages = [
  ["inicio", "/index.html"],
  ["productos", "/productos.html"],
  ["producto-dinamico", "/producto.html"],
  firstGeneratedProduct ? ["producto-generado", `/producto/${firstGeneratedProduct}/index.html`] : null,
  ["marcas", "/marcas.html"],
  ["contacto", "/contacto.html"],
  ["admin-login", "/admin-login.html"],
].filter(Boolean);

function getBrowserPaths() {
  const browserPaths = chromeCandidates.filter((candidate) => fs.existsSync(candidate));

  if (!browserPaths.length) {
    throw new Error("No se encontró Chrome o Edge para la prueba visual headless.");
  }

  return browserPaths;
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".svg": "image/svg+xml",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
  };

  return types[extension] || "application/octet-stream";
}

function createServer() {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, baseUrl);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": getContentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });
}

function runChrome(chromePath, pageName, url) {
  return new Promise((resolve, reject) => {
    const screenshotPath = path.join(outputDir, `${pageName}.png`);
    const userDataDir = path.join(outputDir, `profile-${pageName}-${Date.now()}`);
    const args = [
      "--headless",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--no-sandbox",
      "--hide-scrollbars",
      "--window-size=1440,1200",
      `--user-data-dir=${userDataDir}`,
      `--screenshot=${screenshotPath}`,
      url,
    ];
    const child = spawn(chromePath, args, { stdio: "ignore" });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Chrome falló al capturar ${pageName}. Código ${code}.`));
        return;
      }

      const size = fs.existsSync(screenshotPath) ? fs.statSync(screenshotPath).size : 0;
      if (size < 1024) {
        reject(new Error(`Captura visual vacía o inválida: ${screenshotPath}`));
        return;
      }

      resolve(screenshotPath);
    });
  });
}

async function main() {
  const browserPaths = getBrowserPaths();
  fs.mkdirSync(outputDir, { recursive: true });

  const server = createServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

  try {
    const screenshots = [];

    for (const [pageName, pagePath] of pages) {
      let screenshot = "";
      let lastError = null;

      for (const browserPath of browserPaths) {
        try {
          screenshot = await runChrome(browserPath, pageName, `${baseUrl}${pagePath}`);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!screenshot) throw lastError;
      screenshots.push(path.relative(root, screenshot));
    }

    console.log(`Visual smoke OK: ${screenshots.join(", ")}`);
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
