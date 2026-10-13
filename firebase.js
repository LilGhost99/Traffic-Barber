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

// Dibuja la cuadrícula de sellos dentro de `el`
export function pintarSellos(el, sellos, NEGOCIO) {
  el.innerHTML = "";
  for (let i = 1; i <= NEGOCIO.sellosPorTarjeta; i++) {
    const s = document.createElement("div");
    const premio = i === NEGOCIO.premioMitad.en ? NEGOCIO.premioMitad.texto : i === NEGOCIO.premioFinal.en ? NEGOCIO.premioFinal.texto : "";
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

// Horas para citas: cada hora desde que abre (ej. abre 11:30 → 11:30, 12:30, 1:30…),
// la última al menos 30 min antes de cerrar.
export function horasCitaDe(info) {
  if (!info || !info.abierto) return [];
  const out = [];
  const desde = aMinH(info.abre), hasta = aMinH(info.cierra) - 30;
  for (let m = desde; m <= hasta; m += 60) out.push(aHH(m));
  return out;
}

// ¿Esa hora choca con otra cita? (cada cita dura 1 hora)
export function chocaHora(hora, ocupadas) {
  const m = aMinH(hora);
  return ocupadas.some((o) => Math.abs(aMinH(o) - m) < 60);
}

// "11:30" → "11:30 am", "13:00" → "1 pm"
export function horaBonita(hhmm) {
  const m = aMinH(hhmm), h = Math.floor(m / 60), mm = m % 60;
  return `${((h + 11) % 12) + 1}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}`;
}
