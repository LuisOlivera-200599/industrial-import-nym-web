document.addEventListener("DOMContentLoaded", async () => {
  const detail = document.getElementById("product-detail");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const fallbackImage = "imagenes/optimized/productos/productos-1.webp";
  const escapeHTML = window.nymSite?.escapeHTML || ((text) => String(text || ""));

  function getStockClass(stock) {
    const value = String(stock || "").toLowerCase();
    if (value.includes("sin")) return "unavailable";
    if (value.includes("pedido")) return "preorder";
    return "available";
  }

  function quoteUrl(product) {
    const message = `Hola, quiero consultar por el producto: ${product.name} - Marca: ${product.brand}`;
    return window.nymSite?.buildWhatsappUrl
      ? window.nymSite.buildWhatsappUrl(message)
      : `https://wa.me/51966441035?text=${encodeURIComponent(message)}`;
  }

  function saveQuote(product) {
    const key = "nymQuoteProducts";
    let items = [];

    try {
      items = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      items = [];
    }

    if (!items.some((item) => item.id === product.id)) {
      items.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
      });
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  function render(product) {
    detail.innerHTML = `
      <div class="detail-media">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" decoding="async" />
      </div>
      <div class="detail-info">
        <span class="product-brand">${escapeHTML(product.brand)}</span>
        <h2>${escapeHTML(product.name)}</h2>
        <p>${escapeHTML(product.desc)}</p>
        <div class="detail-meta">
          <span class="product-pill">Categoría: ${escapeHTML(product.category)}</span>
          <span class="product-pill">Subcategoría: ${escapeHTML(product.subcategory)}</span>
          <span class="stock ${getStockClass(product.stock)}">${escapeHTML(product.stock)}</span>
        </div>
        <div class="detail-actions">
          <a class="btn btn-whatsapp" href="${escapeHTML(quoteUrl(product))}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          <button class="btn btn-secondary" type="button" id="add-detail-quote">Agregar a cotización</button>
          <a class="btn btn-secondary" href="productos.html">Ver catálogo</a>
        </div>
      </div>
    `;

    document.getElementById("add-detail-quote")?.addEventListener("click", (event) => {
      saveQuote(product);
      event.currentTarget.textContent = "Agregado";
      event.currentTarget.disabled = true;
    });
  }

  if (!id || !window.nymSupabase) {
    detail.innerHTML = "<p>No se pudo cargar el producto solicitado.</p>";
    return;
  }

  try {
    const { data, error } = await window.nymSupabase
      .from("products")
      .select("*, brands(name), categories(name, icon)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Producto no encontrado.");

    render({
      id: data.id,
      name: data.name || "Producto sin nombre",
      brand: data.brands?.name || data.brand || "Marca no definida",
      category: data.categories?.name || data.category || "Categoría no definida",
      subcategory: data.subcategory || data.subcategory_name || "Subcategoría no definida",
      image: data.image_url || fallbackImage,
      stock: data.stock_status || "Disponible",
      desc: data.description || "Producto disponible para consulta comercial.",
    });
  } catch (error) {
    console.error(error);
    detail.innerHTML = `
      <div class="detail-info">
        <h2>No encontramos este producto</h2>
        <p>${escapeHTML(error.message || "Intenta volver al catálogo.")}</p>
        <div class="detail-actions">
          <a class="btn btn-primary" href="productos.html">Volver al catálogo</a>
        </div>
      </div>
    `;
  }
});
