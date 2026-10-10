// Animaciones de las páginas públicas: aparecer al hacer scroll y contadores.
(function () {
  var reducir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var soporta = "IntersectionObserver" in window;
  if (reducir || !soporta) return; // sin animaciones: todo se ve normal
  document.documentElement.classList.add("anim");

  function contar(el) {
    var meta = parseFloat(el.getAttribute("data-contar"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var inicio = null, dur = 1300;
    function paso(t) {
      if (!inicio) inicio = t;
      var p = Math.min(1, (t - inicio) / dur);
      var suave = 1 - Math.pow(1 - p, 3);
      el.textContent = (meta * suave).toFixed(dec);
      if (p < 1) requestAnimationFrame(paso);
      else el.textContent = meta.toFixed(dec);
    }
    requestAnimationFrame(paso);
  }

  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-contar]").forEach(contar);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  function iniciar() {
    document.querySelectorAll(".reveal").forEach(function (el) { obs.observe(el); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
