const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const failures = [];

function walk(dir, filter, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules"].includes(entry.name)) continue;
      walk(fullPath, filter, results);
    } else if (filter(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

for (const file of walk(root, (item) => item.endsWith(".js"))) {
  try {
    new Function(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${path.relative(root, file)}: ${error.message}`);
  }
}

for (const file of walk(root, (item) => item.endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  let index = 0;

  for (const match of scripts) {
    index += 1;
    const attrs = match[1] || "";
    const code = match[2] || "";

    if (/\bsrc\s*=|application\/ld\+json/i.test(attrs) || !code.trim()) continue;

    try {
      new Function(code);
    } catch (error) {
      failures.push(`${path.relative(root, file)} inline script ${index}: ${error.message}`);
    }
  }
}

for (const file of ["robots.txt", "sitemap.xml", "404.html"]) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`${file}: missing`);
}

if (fs.existsSync(path.join(root, "sitemap.xml"))) {
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  if (!sitemap.includes("<urlset") || !sitemap.includes("</urlset>")) {
    failures.push("sitemap.xml: invalid urlset");
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Project check OK");
