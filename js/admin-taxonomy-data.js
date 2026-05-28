async function loadCategories() {
  const { data, error } = await window.nymSupabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  categories = data || [];
  renderCategoriesList();
  renderSubcategoryCategorySelector(subcategoryFields.category.value);
  renderProductSelectors(fields.brand.value, fields.category.value, fields.subcategory.value);
  updateStats();
}

async function loadSubcategories() {
  const { data, error } = await window.nymSupabase
    .from("subcategories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  subcategories = data || [];
  renderSubcategoriesList();
  renderSubcategoryCategorySelector(subcategoryFields.category.value);
  renderSubcategoryProductSelector(fields.category.value, fields.subcategory.value);
  updateStats();
}
