document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");

  if (!menuToggle || !navMenu) return;

  const closeMenu = () => {
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    navMenu.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
  };

  const toggleMenu = () => {
    if (navMenu.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-controls", "nav-menu");

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  navMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    if (window.innerWidth <= 860) {
      closeMenu();
    }
  });

  const navLinks = navMenu.querySelectorAll("a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 860) {
        closeMenu();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
    }
  });
});
