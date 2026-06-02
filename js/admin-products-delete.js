async function deleteProduct(id) {
  const product = products.find((item) => String(item.id) === String(id)) || null;
  const { error } = await window.nymSupabase.from("products").delete().eq("id", id);

  if (error) throw error;

  await recordAdminAudit("product", id, "deleted", `Producto eliminado: ${product?.name || id}`, {
    before: product,
  });
}
