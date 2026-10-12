// Pinta los datos del negocio (firebase-config.js → NEGOCIO) en la página.
// No necesitas editar este archivo. En el HTML se usa así:
//   data-t="Texto con {nombre} y {zona}"   → cambia el texto (o el content de un <meta>, o el <title>)
//   data-href="maps"                       → pone el link (whatsapp, tel, maps, resena, facebook, instagram, tiktok)
//   data-msg="Hola, tengo una pregunta"    → con data-href="whatsapp", el mensaje que ya va escrito
//   data-hay="instagram"                   → esconde el elemento si ese dato está vacío
import { NEGOCIO } from "./firebase-config.js";

const d = NEGOCIO.direccion || {};
const g = NEGOCIO.google || {};
const r = NEGOCIO.redes || {};
const wa = String(NEGOCIO.whatsapp || "").replace(/\D/g, "");
const local = wa.slice(-10);

export const CAMPOS = {
  nombre: NEGOCIO.nombre || "",
  nombreGoogle: NEGOCIO.nombreGoogle || NEGOCIO.nombre || "",
  lema: NEGOCIO.lema || "",
  descripcion: NEGOCIO.descripcion || "",
  calle: d.calle || "",
  zona: d.zona || "",
  cp: d.cp || "",
  ciudad: d.ciudad || "",
  ciudadOficial: d.ciudadOficial || d.ciudad || "",
  estado: d.estado || "",
  estrellas: g.estrellas ? Number(g.estrellas).toFixed(1) : "",
  resenas: g.resenas ? String(g.resenas) : "",
  telefono: local.length === 10 ? `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}` : local,
  responsable: NEGOCIO.legal?.responsable || "",
  correo: NEGOCIO.legal?.correo || ""
};

const busquedaMaps = encodeURIComponent([CAMPOS.nombreGoogle, CAMPOS.zona, CAMPOS.ciudad].filter(Boolean).join(" "));

export const LINKS = {
  whatsapp: wa ? `https://wa.me/${wa}` : "",
  tel: wa ? `tel:+${wa}` : "",
  maps: `https://www.google.com/maps/search/?api=1&query=${busquedaMaps}` + (g.placeId ? `&query_place_id=${g.placeId}` : ""),
  resena: g.placeId ? `https://search.google.com/local/writereview?placeid=${g.placeId}` : "",
  facebook: r.facebook || "",
  instagram: r.instagram || "",
  tiktok: r.tiktok || ""
};

export const llenar = (plantilla) => String(plantilla).replace(/\{(\w+)\}/g, (_, k) => CAMPOS[k] ?? "");

function pintar(raiz = document) {
  raiz.querySelectorAll("[data-t]").forEach((el) => {
    const texto = llenar(el.dataset.t);
    if (el.tagName === "META") el.setAttribute("content", texto);
    else el.textContent = texto;
  });
  raiz.querySelectorAll("[data-href]").forEach((el) => {
    let url = LINKS[el.dataset.href] || "";
    if (url && el.dataset.msg) url += "?text=" + encodeURIComponent(llenar(el.dataset.msg));
    if (url) el.setAttribute("href", url); else el.hidden = true;
  });
  raiz.querySelectorAll("[data-hay]").forEach((el) => {
    if (!(CAMPOS[el.dataset.hay] || LINKS[el.dataset.hay])) el.hidden = true;
  });
  // Logos y nombre del negocio en lectores de pantalla
  raiz.querySelectorAll("img.brand-logo, img.foot-logo, img.hero-marca").forEach((img) => { img.alt = CAMPOS.nombre; });
  raiz.querySelectorAll("a.brand").forEach((a) => a.setAttribute("aria-label", `${CAMPOS.nombre}, inicio`));
  // Calificación de Google (el número que se anima)
  raiz.querySelectorAll("[data-contar-de]").forEach((el) => {
    const v = CAMPOS[el.dataset.contarDe];
    if (v) { el.dataset.contar = v; el.textContent = v; }
  });
}

pintar();
