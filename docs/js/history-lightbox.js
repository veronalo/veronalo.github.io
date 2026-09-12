(() => {
  const lightbox = document.querySelector("[data-history-lightbox]");
  const image = document.querySelector("[data-history-lightbox-image]");
  const closeButton = document.querySelector("[data-history-lightbox-close]");
  const links = document.querySelectorAll("[data-history-image]");
  if (!lightbox || !image || !closeButton || !links.length) return;

  let previousFocus = null;

  const close = () => {
    if (!lightbox.open) return;
    lightbox.close();
    image.removeAttribute("src");
    document.documentElement.classList.remove("history-lightbox-open");
    previousFocus?.focus();
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      previousFocus = link;
      const thumbnail = link.querySelector("img");
      image.src = link.href;
      image.alt = thumbnail?.alt || "网站历史截图";
      document.documentElement.classList.add("history-lightbox-open");
      lightbox.showModal();
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  lightbox.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  lightbox.addEventListener("close", () => {
    document.documentElement.classList.remove("history-lightbox-open");
  });
})();
