import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const DEFAULT_IMAGE = "imagenes/optimized/productos/productos-1.webp";
const PRODUCT_IMAGES_BUCKET = "product-images";
const PAGE_SIZES = [25, 50, 100];
const STOCK_STATUSES = ["Disponible", "Bajo pedido", "Sin stock"];
const LEAD_STATUSES = [
  ["nuevo", "Nuevo"],
  ["atendido", "Atendido"],
  ["cotizado", "Cotizado"],
  ["descartado", "Archivado"],
];

function getClient() {
  if (!window.nymSupabase) throw new Error("Supabase no esta disponible.");
  return window.nymSupabase;
}

function cleanText(value) {
  return String(value || "")
    .replace(/Ã¡/g, "a")
    .replace(/Ã©/g, "e")
    .replace(/Ã­/g, "i")
    .replace(/Ã³/g, "o")
    .replace(/Ãº/g, "u")
    .replace(/Ã±/g, "n")
    .replace(/Â/g, "")
    .replace(/â€¦/g, "...")
    .replace(/â†’/g, "->");
}

function byName(a, b) {
  return String(a.name || "").localeCompare(String(b.name || ""));
}

function getStockClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("sin")) return "bad";
  if (value.includes("pedido")) return "warn";
  return "ok";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

async function fetchAllProducts() {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getClient()
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function recordAudit(entityType, entityId, action, summary, metadata, user) {
  try {
    await getClient()
      .from("admin_audit_log")
      .insert([
        {
          entity_type: entityType,
          entity_id: entityId ? String(entityId) : null,
          action,
          summary,
          metadata: metadata || {},
          user_id: user?.id || null,
          user_email: user?.email || null,
        },
      ]);
  } catch (error) {
    console.warn("Audit unavailable", error.message || error);
  }
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getField(row, aliases) {
  const wanted = aliases.map(normalize);
  const match = Object.entries(row).find(([key]) => wanted.includes(normalize(key)));
  return match ? String(match[1] ?? "").trim() : "";
}

function AdminApp() {
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [audit, setAudit] = useState([]);

  async function loadAll() {
    const client = getClient();
    const [
      productRows,
      brandResult,
      categoryResult,
      subcategoryResult,
      leadsResult,
      stockResult,
      auditResult,
    ] = await Promise.all([
      fetchAllProducts(),
      client.from("brands").select("*").order("name", { ascending: true }),
      client.from("categories").select("*").order("name", { ascending: true }),
      client.from("subcategories").select("*").order("name", { ascending: true }),
      client.from("contact_leads").select("*").order("created_at", { ascending: false }).limit(120),
      client.from("stock_movements").select("*, products(name, brand)").order("created_at", { ascending: false }).limit(120),
      client.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(120),
    ]);

    [brandResult, categoryResult, subcategoryResult, leadsResult, stockResult, auditResult].forEach((result) => {
      if (result.error) throw result.error;
    });

    setProducts(productRows);
    setBrands(brandResult.data || []);
    setCategories(categoryResult.data || []);
    setSubcategories(subcategoryResult.data || []);
    setLeads(leadsResult.data || []);
    setStockMovements(stockResult.data || []);
    setAudit(auditResult.data || []);
  }

  async function refresh(section = "") {
    await loadAll();
    setNotice(section ? `${section} actualizado.` : "Datos actualizados.");
  }

  useEffect(() => {
    (async () => {
      try {
        const client = getClient();
        const { data } = await client.auth.getSession();
        const session = data?.session;

        if (!session) {
          window.location.href = "admin-login.html";
          return;
        }

        setUser(session.user);
        await loadAll();
      } catch (error) {
        console.error(error);
        setNotice(error.message || "No se pudo cargar el admin.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeProducts = products.filter((product) => product.is_active !== false);
  const lowStock = activeProducts.filter((product) => {
    const quantity = Number(product.stock_quantity);
    const threshold = Number(product.low_stock_threshold);
    return Number.isFinite(quantity) && Number.isFinite(threshold) && threshold > 0 && quantity <= threshold;
  });
  const topBrand = useMemo(() => {
    const counts = new Map();
    activeProducts.forEach((product) => counts.set(product.brand || "Sin marca", (counts.get(product.brand || "Sin marca") || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [products]);

  const metrics = [
    ["Productos", activeProducts.length],
    ["Marcas", brands.filter((brand) => brand.is_active !== false).length],
    ["Bajo stock", lowStock.length],
    ["Leads nuevos", leads.filter((lead) => (lead.estado || "nuevo") === "nuevo").length],
    ["Cotizados", leads.filter((lead) => lead.estado === "cotizado").length],
    ["Movimientos stock", stockMovements.length],
    ["Auditoria", audit.length],
    ["Marca lider", topBrand ? `${topBrand[0]} (${topBrand[1]})` : "-"],
  ];

  async function logout() {
    await getClient().auth.signOut();
    localStorage.removeItem("nymAdminSession");
    localStorage.removeItem("nymAdminUser");
    window.location.href = "admin-login.html";
  }

  if (loading) return <div className="loading-react">Cargando panel React...</div>;

  return (
    <div className="admin-app">
      <div className="admin-shell">
        <aside className="admin-sidebar-react">
          <div className="admin-brand-react">
            <div className="admin-brand-mark">IIC</div>
            <div>
              <strong>INDUSTRIAL IMPORT</strong>
              <small>Admin React/Vite</small>
            </div>
          </div>

          <nav className="admin-nav-react">
            {[
              ["dashboard", "fa-chart-line", "Dashboard"],
              ["products", "fa-box", "Productos"],
              ["leads", "fa-inbox", "Leads"],
              ["stock", "fa-boxes-stacked", "Stock"],
              ["audit", "fa-clock-rotate-left", "Auditoria"],
            ].map(([key, icon, label]) => (
              <button key={key} className={active === key ? "active" : ""} type="button" onClick={() => setActive(key)}>
                <i className={`fa-solid ${icon}`} />
                {label}
              </button>
            ))}
            <a className="admin-legacy-link" href="admin-legacy.html">
              <i className="fa-solid fa-layer-group" />
              Admin clasico
            </a>
          </nav>
        </aside>

        <main className="admin-main-react">
          <header className="admin-top-react">
            <div>
              <h1>{getTitle(active)}</h1>
              <p>{user?.email || "Sesion administrativa"}</p>
            </div>
            <div className="admin-top-actions">
              <a className="admin-button" href="productos.html">
                <i className="fa-solid fa-eye" />
                Catalogo
              </a>
              <button className="admin-button" type="button" onClick={() => refresh()}>
                <i className="fa-solid fa-rotate" />
                Actualizar
              </button>
              <button className="admin-button danger" type="button" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket" />
                Salir
              </button>
            </div>
          </header>

          <div className="admin-content-react">
            {notice ? <div className="notice-react">{notice}</div> : null}
            {active === "dashboard" ? <Dashboard metrics={metrics} lowStock={lowStock} leads={leads} audit={audit} /> : null}
            {active === "products" ? (
              <ProductsPanel
                products={products}
                setProducts={setProducts}
                brands={brands}
                categories={categories}
                subcategories={subcategories}
                user={user}
                refresh={refresh}
                setNotice={setNotice}
              />
            ) : null}
            {active === "leads" ? <LeadsPanel leads={leads} setLeads={setLeads} user={user} setNotice={setNotice} /> : null}
            {active === "stock" ? (
              <StockPanel
                products={products}
                movements={stockMovements}
                user={user}
                refresh={refresh}
                setNotice={setNotice}
              />
            ) : null}
            {active === "audit" ? <AuditPanel audit={audit} /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function getTitle(active) {
  const titles = {
    dashboard: "Dashboard administrativo",
    products: "Gestion de productos",
    leads: "Pipeline de leads",
    stock: "Movimientos de stock",
    audit: "Auditoria",
  };
  return titles[active] || "Panel";
}

function Dashboard({ metrics, lowStock, leads, audit }) {
  return (
    <>
      <div className="admin-grid-metrics">
        {metrics.map(([label, value]) => (
          <article className="metric-card-react" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <section className="admin-panel-react">
        <div className="admin-panel-header">
          <div>
            <h2>Resumen operativo</h2>
            <p>Bajo stock, leads recientes y ultimos cambios registrados.</p>
          </div>
        </div>
        <div className="list-react">
          <MiniList title="Productos bajo stock" rows={lowStock.slice(0, 6).map((p) => `${p.name} / ${p.stock_quantity ?? 0} und.`)} />
          <MiniList title="Leads recientes" rows={leads.slice(0, 6).map((l) => `${l.nombre || "Sin nombre"} / ${l.estado || "nuevo"}`)} />
          <MiniList title="Auditoria reciente" rows={audit.slice(0, 6).map((item) => `${item.action} / ${item.summary || item.entity_type}`)} />
        </div>
      </section>
    </>
  );
}

function MiniList({ title, rows }) {
  return (
    <div className="list-item-react">
      <div>
        <strong>{title}</strong>
        {rows.length ? rows.map((row) => <small key={row} className="muted">{cleanText(row)}</small>) : <small className="muted">Sin datos.</small>}
      </div>
    </div>
  );
}

function ProductsPanel({ products, setProducts, brands, categories, subcategories, user, refresh, setNotice }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const textQuery = query.trim().toLowerCase();
    return products
      .filter((product) => product.is_active !== false)
      .filter((product) => brand === "all" || product.brand_id === brand)
      .filter((product) => category === "all" || product.category_id === category)
      .filter((product) => status === "all" || product.stock_status === status)
      .filter((product) => {
        if (!textQuery) return true;
        return [product.name, product.brand, product.category, product.subcategory, product.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(textQuery);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [products, query, brand, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageProducts = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function quickSave(product, updates) {
    const { error } = await getClient().from("products").update(updates).eq("id", product.id);
    if (error) throw error;

    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, ...updates } : item)));
    await recordAudit("product", product.id, "quick_updated", `Edicion rapida: ${product.name}`, { before: product, after: updates }, user);
    setNotice("Producto actualizado desde la tabla.");
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Eliminar ${product.name}?`)) return;
    const { error } = await getClient().from("products").delete().eq("id", product.id);
    if (error) throw error;
    await recordAudit("product", product.id, "deleted", `Producto eliminado: ${product.name}`, { before: product }, user);
    await refresh("Productos");
  }

  function exportExcel() {
    const rows = filtered.map((product) => ({
      Producto: product.name || "",
      Marca: product.brand || "",
      Categoria: product.category || "",
      Subcategoria: product.subcategory || "",
      Estado: product.stock_status || "",
      Cantidad: product.stock_quantity ?? "",
      Descripcion: product.description || "",
      ID: product.id || "",
    }));
    const worksheet = window.XLSX.utils.json_to_sheet(rows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    window.XLSX.writeFile(workbook, `productos-industrial-import-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function importFile(file) {
    if (!file) return;
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
    const payloads = rows
      .map((row) => {
        const name = getField(row, ["Producto", "Nombre", "name"]);
        const brandRow = brands.find((item) => normalize(item.name) === normalize(getField(row, ["Marca", "brand"])));
        const categoryRow = categories.find((item) => normalize(item.name) === normalize(getField(row, ["Categoria", "Categoría", "category"])));
        const subcategoryRow = subcategories.find((item) => normalize(item.name) === normalize(getField(row, ["Subcategoria", "Subcategoría", "subcategory"])));
        if (!name || !brandRow || !categoryRow) return null;
        return {
          name,
          brand_id: brandRow.id,
          category_id: categoryRow.id,
          subcategory_id: subcategoryRow?.id || null,
          brand: brandRow.name,
          category: categoryRow.name,
          subcategory: subcategoryRow?.name || "",
          stock_status: getField(row, ["Estado", "stock_status"]) || "Disponible",
          stock_quantity: getField(row, ["Cantidad", "stock_quantity"]) || null,
          description: getField(row, ["Descripcion", "Descripción", "description"]),
          image_url: getField(row, ["Imagen", "image_url"]) || DEFAULT_IMAGE,
          is_active: true,
        };
      })
      .filter(Boolean);

    if (!payloads.length) {
      setNotice("No se encontraron filas validas para importar.");
      return;
    }

    const { error } = await getClient().from("products").insert(payloads);
    if (error) throw error;
    await recordAudit("product", null, "bulk_imported", `${payloads.length} productos importados`, { count: payloads.length, file: file.name }, user);
    await refresh("Importacion");
  }

  return (
    <section className="admin-panel-react">
      <div className="admin-panel-header">
        <div>
          <h2>Productos registrados</h2>
          <p>{filtered.length} productos con los filtros actuales.</p>
        </div>
        <div className="admin-top-actions">
          <button className="admin-button primary" type="button" onClick={() => setEditing({})}>
            <i className="fa-solid fa-plus" />
            Nuevo
          </button>
          <button className="admin-button" type="button" onClick={exportExcel}>
            <i className="fa-solid fa-file-excel" />
            Excel
          </button>
          <label className="admin-button">
            <i className="fa-solid fa-file-import" />
            Importar
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(event) => importFile(event.target.files?.[0])} />
          </label>
        </div>
      </div>

      {editing ? (
        <ProductForm
          product={editing}
          brands={brands}
          categories={categories}
          subcategories={subcategories}
          user={user}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh("Producto");
          }}
        />
      ) : null}

      <div className="admin-toolbar-react">
        <input value={query} placeholder="Buscar producto, marca, categoria..." onChange={(event) => setQuery(event.target.value)} />
        <select value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option value="all">Todas las marcas</option>
          {brands.sort(byName).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Todas las categorias</option>
          {categories.sort(byName).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos los estados</option>
          {STOCK_STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size} por pagina</option>
          ))}
        </select>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table-react">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Marca</th>
              <th>Categoria</th>
              <th>Estado</th>
              <th>Cantidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageProducts.map((product) => (
              <ProductRow key={product.id} product={product} onQuickSave={quickSave} onEdit={setEditing} onDelete={deleteProduct} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-react">
        <span className="muted">
          Pagina {page} de {totalPages}
        </span>
        <div className="admin-top-actions">
          <button className="admin-button" disabled={page <= 1} type="button" onClick={() => setPage((value) => value - 1)}>
            Anterior
          </button>
          <button className="admin-button" disabled={page >= totalPages} type="button" onClick={() => setPage((value) => value + 1)}>
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductRow({ product, onQuickSave, onEdit, onDelete }) {
  const [stockStatus, setStockStatus] = useState(product.stock_status || "Disponible");
  const [quantity, setQuantity] = useState(product.stock_quantity ?? "");

  return (
    <tr>
      <td>
        <div className="product-cell-react">
          <img src={product.image_url || DEFAULT_IMAGE} alt={product.name || "Producto"} />
          <div>
            <strong>{cleanText(product.name || "Producto sin nombre")}</strong>
            <small className="muted">{cleanText(product.description || "Sin descripcion")}</small>
          </div>
        </div>
      </td>
      <td><span className="tag-react">{cleanText(product.brand || "Sin marca")}</span></td>
      <td>
        <strong>{cleanText(product.category || "Sin categoria")}</strong>
        <small className="muted">{cleanText(product.subcategory || "")}</small>
      </td>
      <td>
        <select className="quick-input-react" value={stockStatus} onChange={(event) => setStockStatus(event.target.value)}>
          {STOCK_STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </td>
      <td>
        <input className="quick-input-react" type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      </td>
      <td>
        <div className="row-actions-react">
          <button className="admin-button primary" type="button" onClick={() => onQuickSave(product, { stock_status: stockStatus, stock_quantity: quantity === "" ? null : Number(quantity) })}>
            <i className="fa-solid fa-check" />
          </button>
          <button className="admin-button" type="button" onClick={() => onEdit(product)}>
            <i className="fa-solid fa-pen" />
          </button>
          <button className="admin-button danger" type="button" onClick={() => onDelete(product)}>
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductForm({ product, brands, categories, subcategories, user, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: product.name || "",
    brand_id: product.brand_id || "",
    category_id: product.category_id || "",
    subcategory_id: product.subcategory_id || "",
    image_url: product.image_url || "",
    stock_status: product.stock_status || "Disponible",
    stock_quantity: product.stock_quantity ?? "",
    low_stock_threshold: product.low_stock_threshold ?? "",
    description: product.description || "",
  });
  const [file, setFile] = useState(null);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage() {
    if (!file) return form.image_url || DEFAULT_IMAGE;
    const extension = file.name.split(".").pop() || "webp";
    const path = `products/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
    const { error } = await getClient().storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = getClient().storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit(event) {
    event.preventDefault();
    const brand = brands.find((item) => item.id === form.brand_id);
    const category = categories.find((item) => item.id === form.category_id);
    const subcategory = subcategories.find((item) => item.id === form.subcategory_id);

    if (!form.name || !brand || !category) return;

    const payload = {
      name: form.name.trim(),
      brand_id: brand.id,
      category_id: category.id,
      subcategory_id: subcategory?.id || null,
      brand: brand.name || "",
      category: category.name || "",
      subcategory: subcategory?.name || "",
      image_url: await uploadImage(),
      stock_status: form.stock_status,
      stock_quantity: form.stock_quantity === "" ? null : Number(form.stock_quantity),
      low_stock_threshold: form.low_stock_threshold === "" ? null : Number(form.low_stock_threshold),
      description: form.description.trim(),
      is_active: true,
    };

    if (product.id) {
      const { error } = await getClient().from("products").update(payload).eq("id", product.id);
      if (error) throw error;
      await recordAudit("product", product.id, "updated", `Producto actualizado: ${payload.name}`, { before: product, after: payload }, user);
    } else {
      const { data, error } = await getClient().from("products").insert([payload]).select("id").single();
      if (error) throw error;
      await recordAudit("product", data?.id || null, "created", `Producto creado: ${payload.name}`, { after: payload }, user);
    }

    await onSaved();
  }

  return (
    <form className="admin-form-react" onSubmit={submit}>
      <label className="wide">
        Producto
        <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
      </label>
      <label>
        Marca
        <select value={form.brand_id} onChange={(event) => update("brand_id", event.target.value)} required>
          <option value="">Selecciona</option>
          {brands.sort(byName).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        Categoria
        <select value={form.category_id} onChange={(event) => update("category_id", event.target.value)} required>
          <option value="">Selecciona</option>
          {categories.sort(byName).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        Subcategoria
        <select value={form.subcategory_id} onChange={(event) => update("subcategory_id", event.target.value)}>
          <option value="">Sin subcategoria</option>
          {subcategories
            .filter((item) => !form.category_id || item.category_id === form.category_id)
            .sort(byName)
            .map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
        </select>
      </label>
      <label>
        Estado
        <select value={form.stock_status} onChange={(event) => update("stock_status", event.target.value)}>
          {STOCK_STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Cantidad
        <input type="number" min="0" value={form.stock_quantity} onChange={(event) => update("stock_quantity", event.target.value)} />
      </label>
      <label>
        Bajo stock
        <input type="number" min="0" value={form.low_stock_threshold} onChange={(event) => update("low_stock_threshold", event.target.value)} />
      </label>
      <label className="wide">
        URL imagen
        <input value={form.image_url} onChange={(event) => update("image_url", event.target.value)} />
      </label>
      <label>
        Subir imagen
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>
      <label className="full">
        Descripcion
        <textarea value={form.description} onChange={(event) => update("description", event.target.value)} />
      </label>
      <div className="admin-top-actions full">
        <button className="admin-button primary" type="submit">Guardar producto</button>
        <button className="admin-button" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

function LeadsPanel({ leads, setLeads, user, setNotice }) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const visible = leads.filter((lead) => {
    const matchesStatus = status === "all" || (lead.estado || "nuevo") === status;
    const text = [lead.nombre, lead.empresa, lead.correo, lead.telefono, lead.mensaje].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && (!query || text.includes(query.toLowerCase()));
  });

  async function saveLead(lead, updates) {
    const { error } = await getClient().from("contact_leads").update(updates).eq("id", lead.id);
    if (error) throw error;
    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...updates } : item)));
    await recordAudit("lead", lead.id, "updated", `Lead actualizado: ${lead.nombre || lead.id}`, updates, user);
    setNotice("Lead actualizado.");
  }

  return (
    <section className="admin-panel-react">
      <div className="admin-panel-header">
        <div>
          <h2>Leads</h2>
          <p>{visible.length} leads visibles.</p>
        </div>
      </div>
      <div className="lead-pipeline-react">
        {LEAD_STATUSES.map(([key, label]) => (
          <button className="lead-card-react" key={key} type="button" onClick={() => setStatus(key)}>
            <span>{label}</span>
            <strong>{leads.filter((lead) => (lead.estado || "nuevo") === key).length}</strong>
          </button>
        ))}
      </div>
      <div className="admin-toolbar-react">
        <input placeholder="Buscar lead" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos</option>
          {LEAD_STATUSES.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div className="list-react">
        {visible.length ? (
          visible.map((lead) => <LeadItem key={lead.id} lead={lead} onSave={saveLead} />)
        ) : (
          <div className="empty-react">No hay leads para este filtro.</div>
        )}
      </div>
    </section>
  );
}

function LeadItem({ lead, onSave }) {
  const [notes, setNotes] = useState(lead.admin_notes || "");
  const phone = String(lead.telefono || "").replace(/\D/g, "");
  const whatsapp = phone ? `https://wa.me/${phone.length === 9 ? `51${phone}` : phone}` : "";

  return (
    <div className="list-item-react">
      <div>
        <strong>{cleanText(lead.nombre || "Contacto sin nombre")}</strong>
        <small className="muted">{cleanText(`${lead.empresa || "Sin empresa"} / ${lead.correo || "Sin correo"} / ${lead.telefono || "Sin telefono"}`)}</small>
        <small className="muted">{cleanText(lead.mensaje || "Sin mensaje")}</small>
        <textarea className="lead-notes-react" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="row-actions-react">
        <span className={`tag-react ${lead.estado === "descartado" ? "bad" : lead.estado === "atendido" ? "ok" : "warn"}`}>
          {LEAD_STATUSES.find(([key]) => key === (lead.estado || "nuevo"))?.[1] || "Nuevo"}
        </span>
        {whatsapp ? <a className="admin-button" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        <button className="admin-button" type="button" onClick={() => onSave(lead, { admin_notes: notes })}>Nota</button>
        <button className="admin-button primary" type="button" onClick={() => onSave(lead, { estado: "atendido" })}>Atendido</button>
        <button className="admin-button" type="button" onClick={() => onSave(lead, { estado: "cotizado" })}>Cotizado</button>
        <button className="admin-button danger" type="button" onClick={() => onSave(lead, { estado: "descartado" })}>Archivar</button>
      </div>
    </div>
  );
}

function StockPanel({ products, movements, user, refresh, setNotice }) {
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("entrada");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  async function submit(event) {
    event.preventDefault();
    const product = products.find((item) => item.id === productId);
    const amount = Number(quantity);
    if (!product || !Number.isInteger(amount) || amount < 0) return;
    const previous = Number(product.stock_quantity || 0);
    const next = type === "entrada" ? previous + amount : type === "salida" ? previous - amount : amount;
    if (next < 0) return;
    const delta = next - previous;

    const { error: productError } = await getClient().from("products").update({ stock_quantity: next, stock_status: next <= 0 ? "Sin stock" : "Disponible" }).eq("id", product.id);
    if (productError) throw productError;
    const { error } = await getClient().from("stock_movements").insert([
      {
        product_id: product.id,
        movement_type: type,
        quantity_delta: delta,
        previous_quantity: previous,
        new_quantity: next,
        note: note || null,
        user_id: user?.id || null,
        user_email: user?.email || null,
      },
    ]);
    if (error) throw error;
    await recordAudit("stock", product.id, "stock_moved", `Stock ${type}: ${product.name}`, { previous, next, delta, note }, user);
    setProductId("");
    setQuantity("");
    setNote("");
    setNotice("Movimiento registrado.");
    await refresh("Stock");
  }

  return (
    <section className="admin-panel-react">
      <div className="admin-panel-header">
        <div>
          <h2>Stock</h2>
          <p>Entradas, salidas y ajustes con historial.</p>
        </div>
      </div>
      <form className="admin-form-react" onSubmit={submit}>
        <label className="wide">
          Producto
          <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
            <option value="">Selecciona producto</option>
            {products.filter((p) => p.is_active !== false).sort(byName).map((product) => (
              <option key={product.id} value={product.id}>{product.name} / {product.stock_quantity ?? 0} und.</option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </label>
        <label>
          Cantidad
          <input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </label>
        <label className="wide">
          Nota
          <input value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <div className="admin-top-actions">
          <button className="admin-button primary" type="submit">Registrar</button>
        </div>
      </form>
      <div className="list-react">
        {movements.map((movement) => (
          <div className="list-item-react" key={movement.id}>
            <div>
              <strong>{cleanText(movement.products?.name || "Producto eliminado")}</strong>
              <small className="muted">{formatDate(movement.created_at)} / {movement.note || "Sin nota"}</small>
            </div>
            <span className="tag-react">{movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta} und.</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditPanel({ audit }) {
  return (
    <section className="admin-panel-react">
      <div className="admin-panel-header">
        <div>
          <h2>Auditoria</h2>
          <p>{audit.length} eventos recientes.</p>
        </div>
      </div>
      <div className="list-react">
        {audit.length ? (
          audit.map((item) => (
            <div className="list-item-react" key={item.id}>
              <div>
                <strong>{cleanText(item.summary || item.action)}</strong>
                <small className="muted">{item.entity_type} / {item.action} / {item.user_email || "Sin usuario"}</small>
                <small className="muted">{formatDate(item.created_at)}</small>
              </div>
              <span className="tag-react">{item.entity_id || "general"}</span>
            </div>
          ))
        ) : (
          <div className="empty-react">Aun no hay eventos de auditoria.</div>
        )}
      </div>
    </section>
  );
}

const rootElement = document.getElementById("admin-root");
window.__nymReactAdminMounted = true;
if (window.__nymReactAdminFallbackTimer) window.clearTimeout(window.__nymReactAdminFallbackTimer);
createRoot(rootElement).render(<AdminApp />);
