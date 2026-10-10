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

// Dibuja la cuadrícula de sellos dentro de `el`
export function pintarSellos(el, sellos, NEGOCIO) {
  el.innerHTML = "";
  for (let i = 1; i <= NEGOCIO.sellosPorTarjeta; i++) {
    const s = document.createElement("div");
    const premio = i === NEGOCIO.premioMitad.en || i === NEGOCIO.premioFinal.en;
    s.className = "sello" + (i <= sellos ? " lleno" : "") + (premio ? " premio" : "");
    s.textContent = i <= sellos ? "✓" : (premio ? i + "°" : i);
    s.setAttribute("aria-label", `Sello ${i}${i <= sellos ? ", obtenido" : ""}${premio ? ", premio" : ""}`);
    el.appendChild(s);
  }
}
