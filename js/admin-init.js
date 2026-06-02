logoutBtn.addEventListener("click", async () => {
  await window.nymSupabase.auth.signOut();
  localStorage.removeItem("nymAdminSession");
  localStorage.removeItem("nymAdminUser");
  window.location.href = "admin-login.html";
});

(async function initAdmin() {
  try {
    cleanVisibleAdminText();
    const sessionOk = await requireSession();
    if (!sessionOk) return;

    await loadBrands();
    await loadCategories();
    await loadSubcategories();
    await loadProducts();
    await loadStockMovements();
    await loadCompanySettings();
    await loadContactLeads();
  } catch (error) {
    console.error(error);
    await showAdminAlert("No se pudo cargar el admin", error.message || String(error));
  }
})();
