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
    '<option value="all">Todas las categorías</option>' +
    activeCategories
      .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`)
      .join("");

  subcategoryFilter.innerHTML =
    '<option value="all">Todas las subcategorías</option>' +
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
    '<option value="">Selecciona una categoría</option>' +
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

  // Si no hay categoría seleccionada, mostrar todas con el nombre de categoría entre paréntesis
  const showCategoryHint = !categoryId;

  fields.subcategory.innerHTML =
    '<option value="">Selecciona una subcategoría</option>' +
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
    '<option value="">Selecciona una categoría</option>' +
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
  setUploadStatus("Selecciona una imagen. Se subirá al guardar el producto.");
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
  setBrandUploadStatus("Selecciona un logo. Se subirá al guardar la marca.");
  brandFormTitle.textContent = "Agregar nueva marca";
  brandSaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar marca';
}

function resetCategoryForm() {
  categoryForm.reset();
  categoryFields.id.value = "";
  categoryFields.sort.value = 0;
  categoryFields.active.value = "true";
  categoryFormTitle.textContent = "Agregar nueva categoría";
  categorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar categoría';
}

function resetSubcategoryForm() {
  subcategoryForm.reset();
  subcategoryFields.id.value = "";
  subcategoryFields.sort.value = 0;
  subcategoryFields.active.value = "true";
  subcategoryFormTitle.textContent = "Agregar nueva subcategoría";
  subcategorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar subcategoría';
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
    throw new Error("No se pudo obtener la URL pública de la imagen.");
  }

  setUploadStatus("Imagen subida correctamente.", "success");
  return data.publicUrl;
}
