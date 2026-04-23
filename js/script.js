const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    const isClickInsideMenu = navMenu.contains(event.target);
    const isClickOnButton = menuToggle.contains(event.target);

    if (!isClickInsideMenu && !isClickOnButton) {
      navMenu.classList.remove("open");
    }
  });
}
