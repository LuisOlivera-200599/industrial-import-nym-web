productFileInput.addEventListener("change", () => {
  const file = productFileInput.files?.[0];

  if (!file) {
    selectedProductFile = null;
    setUploadStatus("Selecciona una imagen. Se subirá al guardar el producto.");
    return;
  }

  const validationError = validateImageFile(file, MAX_PRODUCT_IMAGE_SIZE, "producto");
  if (validationError) {
    selectedProductFile = null;
    productFileInput.value = "";
    setUploadStatus(validationError, "error");
    return;
  }

  selectedProductFile = file;
  imagePreview.src = URL.createObjectURL(file);
  setUploadStatus(`Imagen lista: ${file.name} (${formatFileSize(file.size)})`);
});

brandFileInput.addEventListener("change", () => {
  const file = brandFileInput.files?.[0];

  if (!file) {
    selectedBrandFile = null;
    setBrandUploadStatus("Selecciona un logo. Se subirá al guardar la marca.");
    return;
  }

  const validationError = validateImageFile(file, MAX_BRAND_LOGO_SIZE, "logo");
  if (validationError) {
    selectedBrandFile = null;
    brandFileInput.value = "";
    setBrandUploadStatus(validationError, "error");
    return;
  }

  selectedBrandFile = file;
  setBrandUploadStatus(`Logo listo: ${file.name} (${formatFileSize(file.size)})`);
});

fields.category.addEventListener("change", () => {
  renderSubcategoryProductSelector(fields.category.value);
});

// Al elegir subcategoría → auto-selecciona su categoría padre
fields.subcategory.addEventListener("change", () => {
  const subId = fields.subcategory.value;
  if (!subId) return;

  const sub = subcategories.find((s) => s.id === subId);
  if (!sub || !sub.category_id) return;

  // Si la categoría padre es distinta a la actual, actualizarla
  if (fields.category.value !== sub.category_id) {
    fields.category.value = sub.category_id;
    // Refrescar lista de subcategorías para mostrar solo las de esa categoría
    // manteniendo la subcategoría que el usuario ya eligió
    renderSubcategoryProductSelector(sub.category_id, subId);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedBrand = brands.find((brand) => brand.id === fields.brand.value);
  const selectedCategory = categories.find((category) => category.id === fields.category.value);
  const selectedSubcategory = subcategories.find((subcategory) => subcategory.id === fields.subcategory.value);

  if (!fields.name.value.trim() || !selectedBrand || !selectedCategory) {
    showNotice(notice, "Completa nombre, marca y categoría.", "error");
    return;
  }

  saveBtn.disabled = true;

  try {
    const finalImageUrl = await uploadProductImage(selectedProductFile);

    const payload = {
      name: fields.name.value.trim(),
      brand_id: selectedBrand.id,
      category_id: selectedCategory.id,
      subcategory_id: selectedSubcategory?.id || null,
      brand: selectedBrand.name || "",
      category: selectedCategory.name || "",
      subcategory: selectedSubcategory?.name || "",
      image_url: finalImageUrl,
      stock_status: fields.stock.value,
      stock_quantity: fields.stockQuantity.value === "" ? null : Number(fields.stockQuantity.value),
      low_stock_threshold: fields.lowStock.value === "" ? null : Number(fields.lowStock.value),
      description: fields.desc.value.trim(),
      is_active: true,
    };

    await saveProduct(payload, fields.id.value);
    resetForm();
    await loadProducts();
  } catch (error) {
    console.error(error);
    setUploadStatus(error.message || "No se pudo subir la imagen.", "error");
    showNotice(notice, error.message || "No se pudo guardar el producto.", "error");
  } finally {
    saveBtn.disabled = false;
  }
});

list.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const product = products.find((item) => item.id === editButton.dataset.edit);
    if (!product) return;

    const brandId = product.brand_id || brands.find((brand) => brand.name === product.brand)?.id || "";
    const categoryId =
      product.category_id || categories.find((category) => category.name === product.category)?.id || "";
    const subcategoryId =
      product.subcategory_id || subcategories.find((subcategory) => subcategory.name === product.subcategory)?.id || "";

    fields.id.value = product.id;
    fields.name.value = product.name || "";
    fields.image.value = product.image_url || "";
    fields.stock.value = product.stock_status || "Disponible";
    fields.stockQuantity.value = Number.isFinite(Number(product.stock_quantity)) ? Number(product.stock_quantity) : "";
    fields.lowStock.value = Number.isFinite(Number(product.low_stock_threshold))
      ? Number(product.low_stock_threshold)
      : "";
    fields.desc.value = product.description || "";
    imagePreview.src = product.image_url || DEFAULT_IMAGE;

    selectedProductFile = null;
    productFileInput.value = "";

    setUploadStatus("Puedes mantener la imagen actual o seleccionar una nueva.");
    renderProductSelectors(brandId, categoryId, subcategoryId);

    formTitle.textContent = "Editar producto";
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar producto';

    openSection("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (deleteButton) {
    const product = products.find((item) => item.id === deleteButton.dataset.delete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar producto",
      message: `¿Seguro que deseas eliminar "${product?.name || "este producto"}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      danger: true,
    });

    if (!shouldDelete) return;

    try {
      await deleteProduct(deleteButton.dataset.delete);
      await loadProducts();
      showNotice(notice, "Producto eliminado correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(notice, error.message || "No se pudo eliminar el producto.", "error");
    }
  }
});

productPagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button || button.disabled) return;

  adminProductPage += button.dataset.productPage === "next" ? 1 : -1;
  renderProducts();

  list.scrollIntoView({ behavior: "smooth", block: "start" });
});

productPagination?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-product-page-size]");
  if (!select) return;

  adminProductPageSize = Number(select.value) || 25;
  resetAdminProductPage();
});

list.addEventListener("click", (event) => {
  const sortButton = event.target.closest("[data-product-sort]");
  if (!sortButton) return;

  adminProductSort = sortButton.dataset.productSort;
  if (productSort) productSort.value = adminProductSort;
  resetAdminProductPage();
});
