async function uploadBrandLogo(file) {
  if (!file) return brandFields.logo.value.trim();

  const validationError = validateImageFile(file, MAX_BRAND_LOGO_SIZE, "logo");
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const filePath = `logos/${Date.now()}-${cleanName || "marca"}.${extension}`;

  setBrandUploadStatus("Subiendo logo a Supabase Storage...");

  const { error: uploadError } = await window.nymSupabase.storage
    .from(BRAND_LOGOS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = window.nymSupabase.storage
    .from(BRAND_LOGOS_BUCKET)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública del logo.");
  }

  setBrandUploadStatus("Logo subido correctamente.", "success");
  return data.publicUrl;
}

function renderBrandsList() {
  brandsList.innerHTML = brands.length
    ? brands.map((brand) => `
        <div class="simple-item">
          <span>
            ${escapeHTML(brand.name || "Marca sin nombre")}
            ${brand.is_active === false ? '<span class="admin-tag stock-tag unavailable">Inactivo</span>' : ""}
          </span>

          <div class="brand-actions">
            <button class="icon-action" type="button" data-brand-edit="${escapeHTML(brand.id)}" title="Editar marca">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="icon-action danger" type="button" data-brand-delete="${escapeHTML(brand.id)}" title="Eliminar marca">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-tags"></i>
        <h3>No hay marcas registradas</h3>
        <p>Agrega tu primera marca desde el formulario.</p>
      </div>
    `;
}
