async function saveCategory(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase
      .from("categories")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    showNotice(categoryNotice, "Categoría actualizada correctamente.");
  } else {
    const { error } = await window.nymSupabase
      .from("categories")
      .insert([payload]);

    if (error) throw error;

    showNotice(categoryNotice, "Categoría agregada correctamente.");
  }
}

async function saveSubcategory(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase
      .from("subcategories")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    showNotice(subcategoryNotice, "Subcategoría actualizada correctamente.");
  } else {
    const { error } = await window.nymSupabase
      .from("subcategories")
      .insert([payload]);

    if (error) throw error;

    showNotice(subcategoryNotice, "Subcategoría agregada correctamente.");
  }
}
