(function () {
  const defaultCompanyData = {
    phone: "966 441 035",
    phone_raw: "51966441035",
    email: "oliveravelasquezluis@gmail.com",
    address: "Urbanizacion Esmeralda etapa 4, Lima, Peru",
    hours: "Lun - Sab / 10:00 am - 5:00 pm",
    whatsapp_url: "https://wa.me/51966441035",
    map_url: "https://www.google.com/maps?q=-11.8665833,-77.0571389",
    map_embed: "https://www.google.com/maps?q=-11.8665833,-77.0571389&z=17&output=embed",
  };

  function cleanText(text) {
    return String(text || "")
      .replace(/Ã¡/g, "á")
      .replace(/Ã©/g, "é")
      .replace(/Ã­/g, "í")
      .replace(/Ã³/g, "ó")
      .replace(/Ãº/g, "ú")
      .replace(/Ã±/g, "ñ")
      .replace(/Ã/g, "Á")
      .replace(/Ã‰/g, "É")
      .replace(/Ã/g, "Í")
      .replace(/Ã“/g, "Ó")
      .replace(/Ãš/g, "Ú")
      .replace(/Ã‘/g, "Ñ")
      .replace(/Â¿/g, "¿")
      .replace(/Â¡/g, "¡")
      .replace(/Â/g, "")
      .replace(/â€¦/g, "...")
      .replace(/â†’/g, "->");
  }

  function escapeHTML(text) {
    return cleanText(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function getCompanyData() {
    return window.nymSite?.companyData || defaultCompanyData;
  }

  function getWhatsappNumber() {
    const data = getCompanyData();
    const raw = data.phone_raw || data.whatsapp_url || defaultCompanyData.phone_raw;
    const match = String(raw).match(/\d{8,}/);
    return match ? match[0] : defaultCompanyData.phone_raw;
  }

  function buildWhatsappUrl(message = "") {
    const base = `https://wa.me/${getWhatsappNumber()}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  window.nymSite = {
    ...(window.nymSite || {}),
    defaultCompanyData,
    escapeHTML,
    cleanText,
    slugify,
    getCompanyData,
    getWhatsappNumber,
    buildWhatsappUrl,
  };
})();
