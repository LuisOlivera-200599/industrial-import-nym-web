menuButtons.forEach((button) => {
  button.addEventListener("click", () => openSection(button.dataset.section));
});
