fields.image.addEventListener("input", () => {
  if (!selectedProductFile) {
    imagePreview.src = fields.image.value.trim() || DEFAULT_IMAGE;
  }
});

imagePreview.addEventListener("error", () => {
  imagePreview.src = DEFAULT_IMAGE;
});

search.addEventListener("input", resetAdminProductPage);
brandFilter.addEventListener("change", resetAdminProductPage);
categoryFilter.addEventListener("change", () => {
  const selectedCategory = categoryFilter.value;

  const activeSubcategories = subcategories
    .filter((subcategory) => subcategory.is_active !== false)
    .filter((subcategory) => selectedCategory === "all" || subcategory.category_id === selectedCategory)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  subcategoryFilter.innerHTML =
    '<option value="all">Todas las subcategorías</option>' +
    activeSubcategories
      .map((subcategory) => `<option value="${escapeHTML(subcategory.id)}">${escapeHTML(subcategory.name)}</option>`)
      .join("");

  subcategoryFilter.value = "all";
  resetAdminProductPage();
});
subcategoryFilter.addEventListener("change", resetAdminProductPage);
stockFilter.addEventListener("change", resetAdminProductPage);
productSort?.addEventListener("change", () => {
  adminProductSort = productSort.value;
  resetAdminProductPage();
});

productPageSize?.addEventListener("change", () => {
  adminProductPageSize = Number(productPageSize.value) || 25;
  resetAdminProductPage();
});

productExportCsv?.addEventListener("click", downloadAdminProductsCsv);

productImportTrigger?.addEventListener("click", () => {
  productImportFile?.click();
});

productImportFile?.addEventListener("change", async () => {
  const file = productImportFile.files?.[0];
  if (!file) return;

  productImportTrigger.disabled = true;
  try {
    await importAdminProductsFromFile(file);
  } catch (error) {
    console.error(error);
    showNotice(notice, error.message || "No se pudo importar el archivo.", "error");
  } finally {
    productImportTrigger.disabled = false;
    productImportFile.value = "";
  }
});

productAddShortcut?.addEventListener("click", () => {
  resetForm();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  fields.name.focus();
});

resetBtn.addEventListener("click", resetForm);
brandResetBtn.addEventListener("click", resetBrandForm);
categoryResetBtn.addEventListener("click", resetCategoryForm);
subcategoryResetBtn.addEventListener("click", resetSubcategoryForm);
