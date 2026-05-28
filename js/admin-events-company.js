companyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveCompanySettings();
});

companyReloadBtn.addEventListener("click", async () => {
  try {
    await loadCompanySettings();
    showNotice(companyNotice, "Datos recargados correctamente.");
  } catch (error) {
    console.error(error);
    showNotice(companyNotice, "No se pudieron recargar los datos.", "error");
  }
});

Object.values(companyFields).forEach((field) => {
  field.addEventListener("input", updateCompanyPreview);
});
