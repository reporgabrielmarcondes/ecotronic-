// Registra o service worker (só funciona em HTTPS ou localhost — exigência dos navegadores).
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW não registrado:", e));
  });
}
