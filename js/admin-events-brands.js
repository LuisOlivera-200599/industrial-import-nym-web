brandForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!brandFields.name.value.trim()) {
    showNotice(brandNotice, "Completa el nombre de la marca.", "error");
    return;
  }

  brandSaveBtn.disabled = true;

  try {
    const uploadedLogoUrl = await uploadBrandLogo(selectedBrandFile);

    const payload = {
      name: brandFields.name.value.trim(),
      logo_url: uploadedLogoUrl,
      description: brandFields.description.value.trim(),
      sort_order: Number(brandFields.sort.value || 0),
      is_active: brandFields.active.value === "true",
    };

    await saveBrand(payload, brandFields.id.value);
    resetBrandForm();
    await loadBrands();
  } catch (error) {
    console.error(error);
    setBrandUploadStatus(error.message || "No se pudo subir el logo.", "error");
    showNotice(brandNotice, error.message || "No se pudo guardar la marca.", "error");
  } finally {
    brandSaveBtn.disabled = false;
  }
});

brandsList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-brand-edit]");
  const deleteButton = event.target.closest("[data-brand-delete]");

  if (editButton) {
    const brand = brands.find((item) => item.id === editButton.dataset.brandEdit);
    if (!brand) return;

    brandFields.id.value = brand.id;
    brandFields.name.value = brand.name || "";
    brandFields.logo.value = brand.logo_url || "";
    brandFields.description.value = brand.description || "";
    brandFields.sort.value = brand.sort_order || 0;
    brandFields.active.value = String(brand.is_active !== false);

    selectedBrandFile = null;
    brandFileInput.value = "";

    setBrandUploadStatus("Puedes mantener el logo actual o seleccionar uno nuevo.");
    brandFormTitle.textContent = "Editar marca";
    brandSaveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar marca';
  }

  if (deleteButton) {
    const brand = brands.find((item) => item.id === deleteButton.dataset.brandDelete);

    const shouldDelete = await showAdminDialog({
      title: "Eliminar marca",
      message: `¿Seguro que deseas eliminar "${brand?.name || "esta marca"}"?`,
      confirmText: "Eliminar",
      danger: true,
    });

    if (!shouldDelete) return;

    try {
      await deleteBrand(deleteButton.dataset.brandDelete);
      await loadBrands();
      showNotice(brandNotice, "Marca eliminada correctamente.");
    } catch (error) {
      console.error(error);
      showNotice(brandNotice, error.message || "No se pudo eliminar la marca.", "error");
    }
  }
});
