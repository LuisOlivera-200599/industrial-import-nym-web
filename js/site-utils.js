(function () {
  const defaultCompanyData = {
    phone: "966 441 035",
    phone_raw: "51966441035",
    email: "oliveravelasquezluis@gmail.com",
    address: "Av. Republica de Argentina 211, Lima 15079",
    hours: "Lun - Sab / 10:00 am - 5:00 pm",
    whatsapp_url: "https://wa.me/51966441035",
    map_url: "https://www.google.com/maps/place/Av.+Republica+de+Argentina+211,+Lima+15079/",
    map_embed: "https://www.google.com/maps?q=Av.%20Republica%20de%20Argentina%20211,%20Lima%2015079&output=embed",
  };

  function escapeHTML(text) {
    return String(text || "")
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
    slugify,
    getCompanyData,
    getWhatsappNumber,
    buildWhatsappUrl,
  };
})();
