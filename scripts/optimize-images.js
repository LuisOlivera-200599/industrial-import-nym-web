const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const root = process.cwd();
const inputRoot = path.join(root, "imagenes");
const outputRoot = path.join(inputRoot, "optimized");

async function walk(dir, results = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "optimized") continue;
      await walk(fullPath, results);
    } else if (entry.name.toLowerCase().endsWith(".png")) {
      results.push(fullPath);
    }
  }
  return results;
}

function maxWidthFor(relativePath) {
  if (relativePath.startsWith(`productos${path.sep}`)) return 720;
  if (relativePath.startsWith(`marcas${path.sep}`)) return 720;
  return 1280;
}

(async () => {
  await fs.rm(outputRoot, { recursive: true, force: true });

  const files = await walk(inputRoot);

  for (const file of files) {
    const relative = path.relative(inputRoot, file);
    const outFile = path.join(outputRoot, relative).replace(/\.png$/i, ".webp");

    await fs.mkdir(path.dirname(outFile), { recursive: true });

    await sharp(file)
      .resize({ width: maxWidthFor(relative), withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(outFile);
  }

  console.log(`Optimized ${files.length} images`);
})();
