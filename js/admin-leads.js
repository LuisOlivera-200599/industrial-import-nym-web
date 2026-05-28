function formatLeadDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

function renderLeads(leads) {
  leadsList.innerHTML = leads.length
    ? leads.map((lead) => `
        <div class="simple-item">
          <span>
            ${escapeHTML(lead.nombre || "Contacto sin nombre")}
            <small>
              ${escapeHTML(lead.empresa || "Sin empresa")} /
              ${escapeHTML(lead.correo || "Sin correo")} /
              ${escapeHTML(lead.telefono || "Sin teléfono")}
            </small>
            <small>
              ${escapeHTML(lead.tipo || "Consulta")} - ${escapeHTML(lead.categoria || "Sin categoría")}
            </small>
            <small>${escapeHTML(lead.mensaje || "Sin mensaje")}</small>
          </span>
          <span class="admin-tag stock-tag available">${escapeHTML(formatLeadDate(lead.created_at))}</span>
        </div>
      `).join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-inbox"></i>
        <h3>No hay leads registrados</h3>
        <p>Las consultas enviadas desde contacto aparecerán aquí.</p>
      </div>
    `;
}

async function loadContactLeads() {
  if (!leadsList) return;

  try {
    const { data, error } = await window.nymSupabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    renderLeads(data || []);
  } catch (error) {
    console.error(error);
    leadsList.innerHTML = `
      <div class="empty-state-admin">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>No se pudieron cargar los leads</h3>
        <p>${escapeHTML(error.message || "Revisa las políticas RLS de contact_leads.")}</p>
      </div>
    `;
  }
}
