// Datos en vivo desde el panel de admin: promociones, premios y reseñas.
import { db, configurado, escapar } from "./firebase.js";
import { NEGOCIO } from "./firebase-config.js";
import { collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const porFecha = (a, b) => (b.creado?.seconds || 0) - (a.creado?.seconds || 0);
const ESTRELLA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"/></svg>';

function tarjetaPromo(p) {
  return `<article class="card promo"><div class="tag">Promo</div>` +
    `<div class="display">${escapar(p.titulo)}</div>` +
    (p.detalle ? `<p>${escapar(p.detalle)}</p>` : "") + `</article>`;
}

function pintarPromos(lista) {
  // Inicio: las 3 más recientes
  if ($("promosInicio")) {
    $("promosDestacadas").hidden = !lista.length;
    $("promosInicio").innerHTML = lista.slice(0, 3).map(tarjetaPromo).join("");
  }
  // Servicios: todas
  if ($("listaPromosWeb")) {
    $("promociones").hidden = !lista.length;
    $("listaPromosWeb").innerHTML = lista.map(tarjetaPromo).join("");
  }
}

function pintarResenas(lista) {
  const el = $("listaResenas");
  if (!el || !lista.length) return; // sin reseñas en el panel: se quedan los temas destacados
  el.innerHTML = `<div class="review-grid stagger">` + lista.slice(0, 6).map(r => {
    const n = Math.max(1, Math.min(5, Number(r.estrellas) || 5));
    return `<figure class="review">` +
      `<div class="stars" role="img" aria-label="${n} de 5 estrellas">${ESTRELLA.repeat(n)}</div>` +
      `<blockquote>“${escapar(r.texto)}”</blockquote>` +
      `<figcaption>${escapar(r.nombre)}<span>Reseña de Google</span></figcaption></figure>`;
  }).join("") + `</div>`;
}

if (configurado) {
  if ($("promosInicio") || $("listaPromosWeb")) {
    onSnapshot(collection(db, "promos"), (snap) => {
      if (snap.empty) { pintarPromos(NEGOCIO.promociones); return; }
      pintarPromos(snap.docs.map(d => d.data()).filter(p => p.activa !== false).sort(porFecha));
    }, (ex) => console.error(ex));
  }

  if ($("webMitad")) {
    onSnapshot(doc(db, "config", "negocio"), (snap) => {
      const cfg = snap.exists() ? snap.data() : {};
      $("webMitad").textContent = (cfg.premioMitad || NEGOCIO.premioMitad.texto).toLowerCase();
      $("webFinal").textContent = (cfg.premioFinal || NEGOCIO.premioFinal.texto).toLowerCase();
      $("webCumple").textContent = (cfg.promoCumple || NEGOCIO.promoCumple).toLowerCase();
    }, (ex) => console.error(ex));
  }

  if ($("listaResenas")) {
    onSnapshot(collection(db, "resenas"), (snap) => {
      pintarResenas(snap.docs.map(d => d.data()).filter(r => r.activa !== false).sort(porFecha));
    }, (ex) => console.error(ex));
  }
}
