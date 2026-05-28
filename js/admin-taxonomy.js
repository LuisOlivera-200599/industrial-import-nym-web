function renderCategoriesList() {
  categoriesList.innerHTML = categories.length
    ? categories
        .map(
          (category) => `
        <div class="simple-item">
          <span>
            ${escapeHTML(category.name || "Categoría sin nombre")}
            ${category.is_active === false ? '<span class="admin-tag stock-tag unavailable">Inactivo</span>' : ""}
          </span>

          <div class="brand-actions">
            <button class="icon-action" type="button" data-category-edit="${escapeHTML(category.id)}" title="Editar categoría">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="icon-action danger" type="button" data-category-delete="${escapeHTML(category.id)}" title="Eliminar categoría">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `,
        )
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-layer-group"></i>
        <h3>No hay categorías registradas</h3>
        <p>Agrega tu primera categoría desde el formulario.</p>
      </div>
    `;
}

function renderSubcategoriesList() {
  subcategoriesList.innerHTML = subcategories.length
    ? subcategories
        .map((subcategory) => {
          const parentCategory = categories.find((category) => category.id === subcategory.category_id);

          return `
          <div class="simple-item">
            <span>
              ${escapeHTML(subcategory.name || "Subcategoría sin nombre")}
              <small>Categoría: ${escapeHTML(parentCategory?.name || "Sin categoría")}</small>
              ${subcategory.is_active === false ? '<span class="admin-tag stock-tag unavailable">Inactivo</span>' : ""}
            </span>

            <div class="brand-actions">
              <button class="icon-action" type="button" data-subcategory-edit="${escapeHTML(subcategory.id)}" title="Editar subcategoría">
                <i class="fa-solid fa-pen"></i>
              </button>

              <button class="icon-action danger" type="button" data-subcategory-delete="${escapeHTML(subcategory.id)}" title="Eliminar subcategoría">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;
        })
        .join("")
    : `
      <div class="empty-state-admin">
        <i class="fa-solid fa-sitemap"></i>
        <h3>No hay subcategorías registradas</h3>
        <p>Agrega tu primera subcategoría desde el formulario.</p>
      </div>
    `;
}
