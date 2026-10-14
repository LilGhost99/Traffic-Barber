// Conexión a Firebase (no necesitas editar este archivo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const configurado = !String(firebaseConfig.apiKey).includes("PEGA_AQUI");
export const app = configurado ? initializeApp(firebaseConfig) : null;
export const db = configurado ? getFirestore(app) : null;
export const auth = configurado ? getAuth(app) : null;

// Utilidades compartidas
export const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export function esMesDeCumple(cumple) {
  if (!cumple) return false;
  const mes = Number(cumple.split("-")[0]);
  return mes === new Date().getMonth() + 1;
}

export function cumpleBonito(cumple) {
  if (!cumple) return "";
  const [m, d] = cumple.split("-").map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

export function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// Versión corta del premio para que quepa dentro del círculo: "Facial gratis" → "FACIAL\nGRATIS", "50% de descuento…" → "50%\nDESC."
export function premioCorto(texto) {
  const t = String(texto || "").trim();
  const pct = t.match(/(\d+)\s*%/);
  if (pct) return `${pct[1]}%\nDESC.`;
  const palabras = t.split(/\s+/).filter((w) => !/^(de|en|el|la|los|las|tu|tus|un|una|y|con|al|del|para)$/i.test(w));
  return palabras.slice(0, 2).join("\n").toUpperCase();
}

// Nivel PRO: ya llenó al menos una tarjeta
export const esPro = (c) => (c?.tarjetas || 0) >= 1;
export function premiosDe(c, NEGOCIO) {
  const pro = esPro(c) && NEGOCIO.pro;
  return {
    pro: !!pro,
    mitad: { en: NEGOCIO.premioMitad.en, texto: pro ? NEGOCIO.pro.premioMitad : NEGOCIO.premioMitad.texto },
    fin: { en: NEGOCIO.premioFinal.en, texto: pro ? NEGOCIO.pro.premioFinal : NEGOCIO.premioFinal.texto }
  };
}

// Dibuja la cuadrícula de sellos dentro de `el` (c = el cliente, para saber si es PRO)
export function pintarSellos(el, sellos, NEGOCIO, c) {
  el.innerHTML = "";
  const { mitad, fin } = premiosDe(c, NEGOCIO);
  for (let i = 1; i <= NEGOCIO.sellosPorTarjeta; i++) {
    const s = document.createElement("div");
    const premio = i === mitad.en ? mitad.texto : i === fin.en ? fin.texto : "";
    s.className = "sello" + (i <= sellos ? " lleno" : "") + (premio ? " premio" : "") + (premio && i > sellos ? " con-texto" : "");
    s.textContent = i <= sellos ? "✓" : (premio ? premioCorto(premio) : i);
    if (premio) s.title = premio;
    s.setAttribute("aria-label", `Sello ${i}${i <= sellos ? ", obtenido" : ""}${premio ? ", premio: " + premio : ""}`);
    el.appendChild(s);
  }
}

// ---------- Horario y días abiertos ----------
// Se guarda en config/agenda desde el panel:
//   semana: [ {abierto, abre, cierra} ×7 ]   (0 = domingo … 6 = sábado)
//   dias:   { "2026-10-18": {cerrado:true} | {abre, cierra} }   (días especiales)
// Si todavía no existe, se usa el horario de firebase-config.js.
const aMinH = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + (m || 0); };
const aHH = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function semanaBase(NEGOCIO) {
  const h = NEGOCIO.horario;
  return [0, 1, 2, 3, 4, 5, 6].map((d) => ({ abierto: h.dias.includes(d), abre: h.abre, cierra: h.cierra }));
}

export function agendaLimpia(agenda, NEGOCIO) {
  const base = semanaBase(NEGOCIO);
  const semana = Array.isArray(agenda?.semana) && agenda.semana.length === 7
    ? agenda.semana.map((s, i) => ({ abierto: !!s?.abierto, abre: s?.abre || base[i].abre, cierra: s?.cierra || base[i].cierra }))
    : base;
  return { semana, dias: (agenda && typeof agenda.dias === "object" && agenda.dias) || {} };
}

// Cómo queda un día: { abierto, abre, cierra, especial }
export function diaDe(agenda, NEGOCIO, fecha) {
  const a = agendaLimpia(agenda, NEGOCIO);
  const [y, m, d] = fecha.split("-").map(Number);
  const normal = a.semana[new Date(y, m - 1, d).getDay()];
  const esp = a.dias[fecha];
  if (esp) {
    if (esp.cerrado) return { abierto: false, abre: normal.abre, cierra: normal.cierra, especial: true };
    return { abierto: true, abre: esp.abre || normal.abre, cierra: esp.cierra || normal.cierra, especial: true };
  }
  return { ...normal, especial: false };
}

// Horas para citas: cada `paso` min desde que abre; la última cita empieza a la hora de cierre.
export function horasCitaDe(info, paso = 30, dur = paso) {   // dur ya no limita el final (se queda por compatibilidad)
  if (!info || !info.abierto) return [];
  const out = [];
  for (let m = aMinH(info.abre); m <= aMinH(info.cierra); m += paso) out.push(aHH(m));
  return out;
}

// ¿Una cita de `dur` min a esa hora se encima con otra? ocupadas: [{hora, min}] (sin min = 60, citas viejas)
export function chocaHora(hora, ocupadas, dur = 60) {
  const a = aMinH(hora);
  return ocupadas.some((o) => { const b = aMinH(o.hora), d = Number(o.min) || 60; return a < b + d && b < a + dur; });
}
export const durDe = (NEGOCIO, servicioId) => (NEGOCIO.servicios.find((s) => s.id === servicioId) || {}).min || 60;

// "11:30" → "11:30 am", "13:00" → "1 pm"
export function horaBonita(hhmm) {
  const m = aMinH(hhmm), h = Math.floor(m / 60), mm = m % 60;
  return `${((h + 11) % 12) + 1}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}`;
}
