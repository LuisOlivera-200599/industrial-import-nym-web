async function loadProducts() {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await window.nymSupabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  products = rows;
  renderProductFilters();
  renderProducts();
}

async function saveProduct(payload, id) {
  const legacyPayload = { ...payload };
  delete legacyPayload.stock_quantity;
  delete legacyPayload.low_stock_threshold;

  if (id) {
    const before = products.find((product) => String(product.id) === String(id)) || null;
    let { error } = await window.nymSupabase.from("products").update(payload).eq("id", id);

    if (error && /stock_quantity|low_stock_threshold|column/i.test(error.message || "")) {
      const retry = await window.nymSupabase.from("products").update(legacyPayload).eq("id", id);
      error = retry.error;

      if (!error) {
        showNotice(notice, "Producto actualizado. Para guardar cantidades, aplica la migracion de stock.", "warning");
        return;
      }
    }

    if (error) throw error;

    await recordAdminAudit("product", id, "updated", `Producto actualizado: ${payload.name}`, {
      before,
      after: payload,
    });
    showNotice(notice, "Producto actualizado correctamente.");
  } else {
    let { data, error } = await window.nymSupabase.from("products").insert([payload]).select("id").single();

    if (error && /stock_quantity|low_stock_threshold|column/i.test(error.message || "")) {
      const retry = await window.nymSupabase.from("products").insert([legacyPayload]).select("id").single();
      data = retry.data;
      error = retry.error;

      if (!error) {
        showNotice(notice, "Producto agregado. Para guardar cantidades, aplica la migracion de stock.", "warning");
        return;
      }
    }

    if (error) throw error;

    await recordAdminAudit("product", data?.id || null, "created", `Producto creado: ${payload.name}`, {
      after: payload,
    });
    showNotice(notice, "Producto agregado correctamente.");
  }
}

async function saveQuickProductUpdate(productId, updates) {
  const before = products.find((product) => String(product.id) === String(productId)) || null;
  const { error } = await window.nymSupabase.from("products").update(updates).eq("id", productId);

  if (error) throw error;

  products = products.map((product) =>
    String(product.id) === String(productId) ? { ...product, ...updates } : product,
  );

  await recordAdminAudit("product", productId, "quick_updated", `Edicion rapida: ${before?.name || productId}`, {
    before,
    after: updates,
  });
}
