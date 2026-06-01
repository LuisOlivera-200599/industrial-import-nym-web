function getProductCurrentQuantity(product) {
  return Number.isFinite(Number(product?.stock_quantity)) ? Number(product.stock_quantity) : 0;
}

function getStockMovementLabel(type) {
  const labels = {
    entrada: "Entrada",
    salida: "Salida",
    ajuste: "Ajuste",
  };

  return labels[type] || type || "Movimiento";
}

function getStockMovementClass(type) {
  if (type === "salida") return "unavailable";
  if (type === "ajuste") return "preorder";
  return "available";
}

function formatStockMovementDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderStockMovementProductOptions() {
  if (!stockMovementProduct) return;

  const activeProducts = products.filter((product) => product.is_active !== false).sort(sortAdminProducts);

  stockMovementProduct.innerHTML = [
    '<option value="">Selecciona un producto</option>',
    ...activeProducts.map((product) => {
      const quantity = getProductCurrentQuantity(product);
      const brand = product.brand ? ` / ${product.brand}` : "";
      return `<option value="${escapeHTML(product.id)}">${escapeHTML(product.name || "Producto sin nombre")}${escapeHTML(brand)} (${quantity} und.)</option>`;
    }),
  ].join("");
}

function renderStockMovements() {
  if (!stockMovementList) return;

  stockMovementList.innerHTML = stockMovements.length
    ? stockMovements
        .slice(0, 40)
        .map((movement) => {
          const productName = movement.products?.name || "Producto eliminado";
          const productBrand = movement.products?.brand ? ` / ${movement.products.brand}` : "";
          const delta = Number(movement.quantity_delta || 0);
          const deltaLabel = delta > 0 ? `+${delta}` : String(delta);

          return `
            <div class="simple-item stock-history-item">
              <span>
                ${escapeHTML(productName)}
                <small>
                  ${escapeHTML(productBrand.replace(/^ \/ /, ""))}
                  ${movement.note ? " / " + escapeHTML(movement.note) : ""}
                </small>
              </span>

              <span class="table-meta">
                <span class="admin-tag stock-tag ${getStockMovementClass(movement.movement_type)}">
                  ${escapeHTML(getStockMovementLabel(movement.movement_type))}
                </span>
                <small>${escapeHTML(deltaLabel)} und. / nuevo: ${escapeHTML(movement.new_quantity)}</small>
                <small>${escapeHTML(formatStockMovementDate(movement.created_at))}</small>
              </span>
            </div>
          `;
        })
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <h3>Sin movimientos registrados</h3>
        <p>Cuando registres entradas, salidas o ajustes, aparecerán aquí.</p>
      </div>
    `;
}

async function loadStockMovements() {
  if (!stockMovementList) return;

  const { data, error } = await window.nymSupabase
    .from("stock_movements")
    .select("*, products(name, brand)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    stockMovementList.innerHTML = `
      <div class="empty-state-admin">
        <i class="fa-solid fa-database"></i>
        <h3>No se pudo cargar el historial</h3>
        <p>${escapeHTML(error.message || "Aplica la migración de movimientos de stock.")}</p>
      </div>
    `;
    return;
  }

  stockMovements = data || [];
  renderStockMovements();
}

function calculateStockMovement(product, type, quantity) {
  const previousQuantity = getProductCurrentQuantity(product);
  let newQuantity = previousQuantity;

  if (type === "entrada") newQuantity += quantity;
  if (type === "salida") newQuantity -= quantity;
  if (type === "ajuste") newQuantity = quantity;

  if (newQuantity < 0) {
    throw new Error("La salida no puede dejar el stock en negativo.");
  }

  return {
    previousQuantity,
    newQuantity,
    quantityDelta: newQuantity - previousQuantity,
  };
}

async function saveStockMovement(event) {
  event.preventDefault();

  const product = products.find((item) => String(item.id) === String(stockMovementProduct.value));
  const type = stockMovementType.value;
  const quantity = Number(stockMovementQuantity.value);

  if (!product || !type || !Number.isInteger(quantity) || quantity < 0) {
    showNotice(stockMovementNotice, "Selecciona producto, tipo y una cantidad válida.", "error");
    return;
  }

  if (quantity === 0 && type !== "ajuste") {
    showNotice(stockMovementNotice, "Entradas y salidas deben ser mayores a cero.", "error");
    return;
  }

  try {
    const movement = calculateStockMovement(product, type, quantity);
    const nextStockStatus =
      movement.newQuantity <= 0
        ? "Sin stock"
        : String(product.stock_status || "")
              .toLowerCase()
              .includes("sin")
          ? "Disponible"
          : product.stock_status || "Disponible";

    const { error: productError } = await window.nymSupabase
      .from("products")
      .update({
        stock_quantity: movement.newQuantity,
        stock_status: nextStockStatus,
      })
      .eq("id", product.id);

    if (productError) throw productError;

    const { error: movementError } = await window.nymSupabase.from("stock_movements").insert([
      {
        product_id: product.id,
        movement_type: type,
        quantity_delta: movement.quantityDelta,
        previous_quantity: movement.previousQuantity,
        new_quantity: movement.newQuantity,
        note: stockMovementNote.value.trim() || null,
        user_id: currentUser?.id || null,
        user_email: currentUser?.email || null,
      },
    ]);

    if (movementError) throw movementError;

    stockMovementForm.reset();
    showNotice(stockMovementNotice, "Movimiento de stock registrado correctamente.");
    await loadProducts();
    await loadStockMovements();
  } catch (error) {
    console.error(error);
    showNotice(stockMovementNotice, error.message || "No se pudo registrar el movimiento.", "error");
  }
}

stockMovementForm?.addEventListener("submit", saveStockMovement);
