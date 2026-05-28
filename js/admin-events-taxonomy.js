categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: categoryFields.name.value.trim(),
    description: categoryFields.description.value.trim(),
    icon: categoryFields.icon.value.trim(),
    sort_order: Number(categoryFields.sort.value || 0),
    is_active: categoryFields.active.value === "true"
  };

  if (!payload.name) {
    showNotice(categoryNotice, "Completa el nombre de la categoría.", "error");
    return;
  }

  categorySaveBtn.disabled = true;

  try {
    await saveCategory(payload, categoryFields.id.value);
    resetCategoryForm();
    await loadCategories();
  } catch (error) {
    console.error(error);
    showNotice(categoryNotice, error.message || "No se pudo guardar la categoría.", "error");
  } finally {
    categorySaveBtn.disabled = false;
  }
});

categoriesList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-category-edit]");
  const deleteButton = event.target.closest("[data-category-delete]");

  if (editButton) {
    const category = categories.find((item) => item.id === editButton.dataset.categoryEdit);
    if (!category) return;

    categoryFields.id.value = category.id;
    categoryFields.name.value = category.name || "";
    categoryFields.description.value = category.description || "";
    categoryFields.icon.value = category.icon || "";
    categoryFields.sort.value = category.sort_order || 0;
    categoryFields.active.value = String(category.is_active !== false);

    categoryFormTitle.textContent = "Editar categoría";
    categorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar categoría';
  }

  if (deleteButton) {
    const category = categories.find((item) => item.id === deleteButton.dataset.categoryDelete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar categoría",
      message: `¿Seguro que deseas eliminar "${category?.name || "esta categoría"}"?`,
      confirmText: "Eliminar",
      danger: true
    });

    if (!shouldDelete) return;

    try {
      await deleteCategory(deleteButton.dataset.categoryDelete);
      await loadCategories();
      await loadSubcategories();
      showNotice(categoryNotice, "Categoría eliminada correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(categoryNotice, error.message || "No se pudo eliminar la categoría.", "error");
    }
  }
});

subcategoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedCategory = categories.find((category) => category.id === subcategoryFields.category.value);

  const payload = {
    name: subcategoryFields.name.value.trim(),
    category_id: selectedCategory?.id || null,
    description: subcategoryFields.description.value.trim(),
    sort_order: Number(subcategoryFields.sort.value || 0),
    is_active: subcategoryFields.active.value === "true"
  };

  if (!payload.name || !payload.category_id) {
    showNotice(subcategoryNotice, "Completa nombre y categoría principal.", "error");
    return;
  }

  subcategorySaveBtn.disabled = true;

  try {
    await saveSubcategory(payload, subcategoryFields.id.value);
    resetSubcategoryForm();
    await loadSubcategories();
  } catch (error) {
    console.error(error);
    showNotice(subcategoryNotice, error.message || "No se pudo guardar la subcategoría.", "error");
  } finally {
    subcategorySaveBtn.disabled = false;
  }
});

subcategoriesList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-subcategory-edit]");
  const deleteButton = event.target.closest("[data-subcategory-delete]");

  if (editButton) {
    const subcategory = subcategories.find((item) => item.id === editButton.dataset.subcategoryEdit);
    if (!subcategory) return;

    subcategoryFields.id.value = subcategory.id;
    subcategoryFields.name.value = subcategory.name || "";
    subcategoryFields.category.value = subcategory.category_id || "";
    subcategoryFields.description.value = subcategory.description || "";
    subcategoryFields.sort.value = subcategory.sort_order || 0;
    subcategoryFields.active.value = String(subcategory.is_active !== false);

    subcategoryFormTitle.textContent = "Editar subcategoría";
    subcategorySaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar subcategoría';
  }

  if (deleteButton) {
    const subcategory = subcategories.find((item) => item.id === deleteButton.dataset.subcategoryDelete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar subcategoría",
      message: `¿Seguro que deseas eliminar "${subcategory?.name || "esta subcategoría"}"?`,
      confirmText: "Eliminar",
      danger: true
    });

    if (!shouldDelete) return;

    try {
      await deleteSubcategory(deleteButton.dataset.subcategoryDelete);
      await loadSubcategories();
      showNotice(subcategoryNotice, "Subcategoría eliminada correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(subcategoryNotice, error.message || "No se pudo eliminar la subcategoría.", "error");
    }
  }
});
