function updateCompanyPreview() {
  companyPreview.phone.textContent = companyFields.phone.value || "-";
  companyPreview.email.textContent = companyFields.email.value || "-";
  companyPreview.address.textContent = companyFields.address.value || "-";
  companyPreview.hours.textContent = companyFields.hours.value || "-";
}

async function loadCompanySettings() {
  const { data, error } = await window.nymSupabase.from("company_settings").select("*").limit(1).maybeSingle();

  if (error) throw error;

  if (!data) {
    companyFields.id.value = "";
    companyFields.phone.value = "966 441 035";
    companyFields.phoneRaw.value = "51966441035";
    companyFields.email.value = "oliveravelasquezluis@gmail.com";
    companyFields.address.value = "Av. Republica de Argentina 211, Lima 15079";
    companyFields.hours.value = "Lun - Sáb / 10:00 am - 5:00 pm";
    companyFields.whatsappUrl.value = "https://wa.me/51966441035";
    companyFields.mapUrl.value = "https://www.google.com/maps/place/Av.+Republica+de+Argentina+211,+Lima+15079/";
    companyFields.mapEmbed.value = "";
    updateCompanyPreview();
    return;
  }

  companyFields.id.value = data.id || "";
  companyFields.phone.value = data.phone || "";
  companyFields.phoneRaw.value = data.phone_raw || "";
  companyFields.email.value = data.email || "";
  companyFields.address.value = data.address || "";
  companyFields.hours.value = data.hours || "";
  companyFields.whatsappUrl.value = data.whatsapp_url || "";
  companyFields.mapUrl.value = data.map_url || "";
  companyFields.mapEmbed.value = data.map_embed || "";
  updateCompanyPreview();
}

async function saveCompanySettings() {
  const payload = {
    phone: companyFields.phone.value.trim(),
    phone_raw: companyFields.phoneRaw.value.trim(),
    email: companyFields.email.value.trim(),
    address: companyFields.address.value.trim(),
    hours: companyFields.hours.value.trim(),
    whatsapp_url: companyFields.whatsappUrl.value.trim(),
    map_url: companyFields.mapUrl.value.trim(),
    map_embed: companyFields.mapEmbed.value.trim(),
  };

  if (!payload.phone || !payload.email || !payload.address) {
    showNotice(companyNotice, "Completa teléfono, correo y dirección.", "error");
    return;
  }

  companySaveBtn.disabled = true;

  try {
    if (companyFields.id.value) {
      const { error } = await window.nymSupabase
        .from("company_settings")
        .update(payload)
        .eq("id", companyFields.id.value);

      if (error) throw error;
    } else {
      const { data, error } = await window.nymSupabase.from("company_settings").insert([payload]).select().single();

      if (error) throw error;

      companyFields.id.value = data.id;
    }

    updateCompanyPreview();
    showNotice(companyNotice, "Datos de empresa guardados correctamente.");
  } catch (error) {
    console.error(error);
    showNotice(companyNotice, error.message || "No se pudieron guardar los datos.", "error");
  } finally {
    companySaveBtn.disabled = false;
  }
}
