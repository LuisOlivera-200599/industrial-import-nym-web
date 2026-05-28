async function saveBrand(payload, id) {
  if (id) {
    const { error } = await window.nymSupabase
      .from("brands")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    showNotice(brandNotice, "Marca actualizada correctamente.");
  } else {
    const { error } = await window.nymSupabase
      .from("brands")
      .insert([payload]);

    if (error) throw error;

    showNotice(brandNotice, "Marca agregada correctamente.");
  }
}
