async function deleteCategory(id) {
  const categoryHasProducts = products.some((product) => product.category_id === id);
  const categoryHasSubcategories = subcategories.some((subcategory) => subcategory.category_id === id);

  if (categoryHasProducts || categoryHasSubcategories) {
    throw new Error("No puedes eliminar esta categoría porque tiene productos o subcategorías relacionadas.");
  }

  const { error } = await window.nymSupabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function deleteSubcategory(id) {
  const inUse = products.some((product) => product.subcategory_id === id);

  if (inUse) {
    throw new Error("No puedes eliminar esta subcategoría porque está asignada a uno o más productos.");
  }

  const { error } = await window.nymSupabase
    .from("subcategories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
