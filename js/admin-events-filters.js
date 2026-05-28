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
    '<option value="all">Todas las subcategorías</option>' +
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
