document.addEventListener("DOMContentLoaded", async () => {

  const defaultCompanyData = {
    phone: "966 441 035",
    phone_raw: "51966441035",
    email: "oliveravelasquezluis@gmail.com",
    address: "Av. Republica de Argentina 211, Lima 15079",
    hours: "Lun - Sáb / 10:00 am - 5:00 pm",
    whatsapp_url: "https://wa.me/51966441035",
    map_url: "https://www.google.com/maps/place/Av.+Republica+de+Argentina+211,+Lima+15079/",
    map_embed: "https://www.google.com/maps?q=Av.%20Republica%20de%20Argentina%20211,%20Lima%2015079&output=embed"
  };

  let companyData = defaultCompanyData;

  function applyCompanyData(data) {
    const phone = data.phone || defaultCompanyData.phone;
    const phoneRaw = data.phone_raw || defaultCompanyData.phone_raw;
    const email = data.email || defaultCompanyData.email;
    const address = data.address || defaultCompanyData.address;
    const hours = data.hours || defaultCompanyData.hours;
    const whatsappUrl = data.whatsapp_url || `https://wa.me/${phoneRaw}`;
    const mapUrl = data.map_url || defaultCompanyData.map_url;
    const mapEmbed = data.map_embed || defaultCompanyData.map_embed;

    document.querySelectorAll("[data-company-phone]").forEach(el => el.textContent = phone);
    document.querySelectorAll("[data-company-email]").forEach(el => el.textContent = email);
    document.querySelectorAll("[data-company-address]").forEach(el => el.textContent = address);
    document.querySelectorAll("[data-company-hours]").forEach(el => el.textContent = hours);

    document.querySelectorAll("[data-whatsapp-link]").forEach(el => el.href = whatsappUrl);
    document.querySelectorAll("[data-company-email-link]").forEach(el => el.href = `mailto:${email}`);
    document.querySelectorAll("[data-company-maps-link]").forEach(el => el.href = mapUrl);

    const mapFrame = document.querySelector(".map-frame");
    if (mapFrame) {
      if (mapEmbed.includes("<iframe")) {
        const match = mapEmbed.match(/src="([^"]+)"/);
        if (match && match[1]) mapFrame.src = match[1];
      } else {
        mapFrame.src = mapEmbed;
      }
    }

    companyData = {
      phone,
      phone_raw: phoneRaw,
      email,
      address,
      hours,
      whatsapp_url: whatsappUrl,
      map_url: mapUrl,
      map_embed: mapEmbed
    };
  }

  async function loadCompanySettings() {
    try {
      if (!window.nymSupabase) {
        applyCompanyData(defaultCompanyData);
        return;
      }

      const { data, error } = await window.nymSupabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      applyCompanyData(data || defaultCompanyData);

    } catch (err) {
      console.error("Error cargando configuración:", err);
      applyCompanyData(defaultCompanyData);
    }
  }

  await loadCompanySettings();

  // FORMULARIO → WHATSAPP
  const form = document.getElementById("contact-form");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre")?.value || "";
      const empresa = document.getElementById("empresa")?.value || "";
      const correo = document.getElementById("correo")?.value || "";
      const telefono = document.getElementById("telefono")?.value || "";
      const mensaje = document.getElementById("mensaje")?.value || "";

      const text = `
Hola, quiero una cotización:

Nombre: ${nombre}
Empresa: ${empresa}
Correo: ${correo}
Teléfono: ${telefono}

Mensaje:
${mensaje}
      `;

      const url = `https://wa.me/${companyData.phone_raw}?text=${encodeURIComponent(text)}`;

      window.open(url, "_blank");
    });
  }

});
