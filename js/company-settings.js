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

    document.querySelectorAll("[data-company-phone]").forEach((item) => {
      item.textContent = phone;
    });

    document.querySelectorAll("[data-company-email]").forEach((item) => {
      item.textContent = email;
    });

    document.querySelectorAll("[data-company-address]").forEach((item) => {
      item.textContent = address;
    });

    document.querySelectorAll("[data-company-hours]").forEach((item) => {
      item.textContent = hours;
    });

    document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
      link.href = whatsappUrl;
    });

    document.querySelectorAll("[data-company-email-link]").forEach((link) => {
      link.href = `mailto:${email}`;
    });

    document.querySelectorAll("[data-company-maps-link]").forEach((link) => {
      link.href = mapUrl;
    });

    const mapFrame = document.querySelector(".map-frame");

    if (mapFrame) {
      if (mapEmbed.includes("<iframe")) {
        const match = mapEmbed.match(/src="([^"]+)"/);

        if (match && match[1]) {
          mapFrame.src = match[1];
        }
      } else {
        mapFrame.src = mapEmbed;
      }
    }

    window.nymCompanyData = {
      phone,
      phone_raw: phoneRaw,
      email,
      address,
      hours,
      whatsapp_url: whatsappUrl,
      map_url: mapUrl,
      map_embed: mapEmbed
    };

    companyData = window.nymCompanyData;
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
    } catch (error) {
      console.error("No se pudo cargar company_settings:", error);
      applyCompanyData(defaultCompanyData);
    }
  }

  await loadCompanySettings();

  const contactForm = document.getElementById("contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const nombre = document.getElementById("nombre")?.value.trim() || "";
      const empresa = document.getElementById("empresa")?.value.trim() || "";
      const correo = document.getElementById("correo")?.value.trim() || "";
      const telefono = document.getElementById("telefono")?.value.trim() || "";
      const tipo = document.getElementById("tipo")?.value.trim() || "";
      const categoria = document.getElementById("categoria")?.value.trim() || "";
      const mensaje = document.getElementById("mensaje")?.value.trim() || "";

      const whatsappMessage = `
Hola, deseo realizar una consulta desde la web de Industrial Import NYM.

Nombre: ${nombre || "No indicado"}
Empresa: ${empresa || "No indicada"}
Correo: ${correo || "No indicado"}
Teléfono: ${telefono || "No indicado"}
Tipo de solicitud: ${tipo || "No indicado"}
Categoría de interés: ${categoria || "No indicada"}

Mensaje:
${mensaje || "No indicado"}
      `.trim();

      const phoneRaw = companyData.phone_raw || defaultCompanyData.phone_raw;
      const whatsappBase = companyData.whatsapp_url || `https://wa.me/${phoneRaw}`;
      const separator = whatsappBase.includes("?") ? "&" : "?";
      const whatsappUrl = `${whatsappBase}${separator}text=${encodeURIComponent(whatsappMessage)}`;

      window.open(whatsappUrl, "_blank", "noopener");
    });
  }
});
