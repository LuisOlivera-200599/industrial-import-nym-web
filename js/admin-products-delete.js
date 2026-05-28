async function deleteProduct(id) {
  const { error } = await window.nymSupabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
