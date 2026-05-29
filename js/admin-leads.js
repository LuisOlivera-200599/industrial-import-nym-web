const leadStatusLabels = {
  nuevo: "Nuevo",
  atendido: "Atendido",
  descartado: "Archivado",
};

function formatLeadDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

function getLeadStatusClass(status) {
  if (status === "atendido") return "available";
  if (status === "descartado") return "unavailable";
  return "preorder";
}

function getLeadSearchText(lead) {
  return [lead.nombre, lead.empresa, lead.correo, lead.telefono, lead.tipo, lead.categoria, lead.estado, lead.mensaje]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildLeadWhatsappUrl(lead) {
  const phone = String(lead.telefono || "").replace(/\D/g, "");
  if (!phone) return "";

  const normalizedPhone = phone.length === 9 ? `51${phone}` : phone;
  const message = [
    `Hola ${lead.nombre || ""}`.trim(),
    "Te escribimos de Industrial Import NYM para atender tu consulta.",
  ].join("\n");

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function getFilteredLeads() {
  const query = (leadSearch?.value || "").trim().toLowerCase();
  const status = leadStatusFilter?.value || "all";

  return contactLeads.filter((lead) => {
    const matchesSearch = !query || getLeadSearchText(lead).includes(query);
    const matchesStatus = status === "all" || (lead.estado || "nuevo") === status;
    return matchesSearch && matchesStatus;
  });
}

function renderLeads() {
  if (!leadsList) return;

  const leads = getFilteredLeads();

  leadsList.innerHTML = leads.length
    ? leads
        .map((lead) => {
          const status = lead.estado || "nuevo";
          const whatsappUrl = buildLeadWhatsappUrl(lead);

          return `
          <div class="simple-item lead-item">
            <span class="lead-item-main">
              ${escapeHTML(lead.nombre || "Contacto sin nombre")}
              <small>
                ${escapeHTML(lead.empresa || "Sin empresa")} /
                ${escapeHTML(lead.correo || "Sin correo")} /
                ${escapeHTML(lead.telefono || "Sin telefono")}
              </small>
              <small>
                ${escapeHTML(lead.tipo || "Consulta")} - ${escapeHTML(lead.categoria || "Sin categoria")}
              </small>
              <small class="lead-message">${escapeHTML(lead.mensaje || "Sin mensaje")}</small>
              <label class="lead-notes">
                <small>Notas internas</small>
                <textarea data-lead-notes="${escapeHTML(lead.id)}" placeholder="Ej: llamar por la tarde, pidio ABB...">${escapeHTML(lead.admin_notes || "")}</textarea>
              </label>
              <small>${escapeHTML(formatLeadDate(lead.created_at))}</small>
            </span>

            <span class="lead-actions">
              <span class="admin-tag stock-tag ${getLeadStatusClass(status)}">${escapeHTML(leadStatusLabels[status] || status)}</span>
              ${whatsappUrl ? `<a class="admin-btn admin-btn-light" href="${escapeHTML(whatsappUrl)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ""}
              <button class="admin-btn admin-btn-light" type="button" data-lead-save-notes="${escapeHTML(lead.id)}">Guardar nota</button>
              ${status !== "atendido" ? `<button class="admin-btn admin-btn-primary" type="button" data-lead-status="atendido" data-lead-id="${escapeHTML(lead.id)}">Atendido</button>` : ""}
              ${status !== "descartado" ? `<button class="admin-btn admin-btn-light" type="button" data-lead-status="descartado" data-lead-id="${escapeHTML(lead.id)}">Archivar</button>` : ""}
              ${status !== "nuevo" ? `<button class="admin-btn admin-btn-light" type="button" data-lead-status="nuevo" data-lead-id="${escapeHTML(lead.id)}">Reabrir</button>` : ""}
            </span>
          </div>
        `;
        })
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-inbox"></i>
        <h3>No hay leads para este filtro</h3>
        <p>Las consultas nuevas y cotizaciones guardadas apareceran aqui.</p>
      </div>
    `;

  leadsList.querySelectorAll("[data-lead-status]").forEach((button) => {
    button.addEventListener("click", () => {
      saveLeadStatus(button.dataset.leadId, button.dataset.leadStatus);
    });
  });

  leadsList.querySelectorAll("[data-lead-save-notes]").forEach((button) => {
    button.addEventListener("click", () => {
      const textarea = leadsList.querySelector(`[data-lead-notes="${CSS.escape(button.dataset.leadSaveNotes)}"]`);
      saveLeadNotes(button.dataset.leadSaveNotes, textarea?.value || "");
    });
  });
}

async function saveLeadStatus(leadId, status) {
  if (!leadId || !status) return;

  try {
    const { error } = await window.nymSupabase.from("contact_leads").update({ estado: status }).eq("id", leadId);

    if (error) throw error;

    contactLeads = contactLeads.map((lead) =>
      String(lead.id) === String(leadId) ? { ...lead, estado: status } : lead,
    );

    renderLeads();
    if (leadsNotice) showNotice(leadsNotice, "Lead actualizado correctamente.");
  } catch (error) {
    console.error(error);
    if (leadsNotice) showNotice(leadsNotice, error.message || "No se pudo actualizar el lead.", "error");
  }
}

async function saveLeadNotes(leadId, notes) {
  if (!leadId) return;

  try {
    const { error } = await window.nymSupabase
      .from("contact_leads")
      .update({ admin_notes: notes.trim() })
      .eq("id", leadId);

    if (error) throw error;

    contactLeads = contactLeads.map((lead) =>
      String(lead.id) === String(leadId) ? { ...lead, admin_notes: notes.trim() } : lead,
    );

    if (leadsNotice) showNotice(leadsNotice, "Nota guardada correctamente.");
  } catch (error) {
    console.error(error);
    if (leadsNotice) {
      showNotice(
        leadsNotice,
        "No se pudo guardar la nota. Aplica la migracion de leads si falta la columna.",
        "warning",
      );
    }
  }
}

async function loadContactLeads() {
  if (!leadsList) return;

  try {
    const { data, error } = await window.nymSupabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    contactLeads = data || [];
    renderLeads();
  } catch (error) {
    console.error(error);
    leadsList.innerHTML = `
      <div class="empty-state-admin">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>No se pudieron cargar los leads</h3>
        <p>${escapeHTML(error.message || "Revisa las politicas RLS de contact_leads.")}</p>
      </div>
    `;
  }
}

leadSearch?.addEventListener("input", renderLeads);
leadStatusFilter?.addEventListener("change", renderLeads);
