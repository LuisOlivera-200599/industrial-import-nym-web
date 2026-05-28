async function deleteBrand(id) {
  const inUse = products.some((product) => product.brand_id === id);

  if (inUse) {
    throw new Error("No puedes eliminar esta marca porque está asignada a uno o más productos.");
  }

  const { error } = await window.nymSupabase
    .from("brands")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
