async function loadBrands() {
  const { data, error } = await window.nymSupabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  brands = data || [];
  renderBrandsList();
  renderProductSelectors(fields.brand.value, fields.category.value, fields.subcategory.value);
  updateStats();
}
