async function loadProducts() {
  const { data, error } = await window.nymSupabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  products = data || [];
  renderProductFilters();
  renderProducts();
}

async function saveProduct(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase
      .from("products")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    showNotice(notice, "Producto actualizado correctamente.");
  } else {
    const { error } = await window.nymSupabase
      .from("products")
      .insert([payload]);

    if (error) throw error;

    showNotice(notice, "Producto agregado correctamente.");
  }
}
