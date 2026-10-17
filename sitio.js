// Partes de la página que salen de firebase-config.js (precios, barberos, pago, horario).
// No depende de Firebase: si no hay internet a Google, esto igual se muestra.
import { NEGOCIO } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pesos = (n) => "$" + Number(n).toLocaleString("es-MX");
const pendiente = (v) => !v || /^\s*\[.*\]\s*$/.test(String(v));   // vacío o [POR LLENAR]
const EXT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const CHECK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// ---------- Precios (Servicios) ----------
function pintarPrecios() {
  const el = $("listaPrecios");
  if (!el) return;
  const lista = NEGOCIO.servicios.filter((s) => !s.soloCaja);
  const una = lista.every((s) => s.sinCita === s.conCita);   // mismo precio con y sin cita: una sola columna
  el.classList.toggle("una", una);
  el.innerHTML =
    `<div class="precio-head" aria-hidden="true"><span>Servicio</span><span>${una ? "" : "Sin cita"}</span><span>${una ? "Precio" : "Con cita"}</span><span></span></div>` +
    lista.map((s) =>
      `<a class="precio-row" href="agendar.html?servicio=${encodeURIComponent(s.id)}" aria-label="${esc(s.nombre)}: ${pesos(s.sinCita)} sin cita, ${pesos(s.conCita)} con cita. Agendar">` +
      `<span class="p-nombre">${esc(s.nombre)}</span><span class="p-sin">${s.desde ? "desde " : ""}${pesos(s.sinCita)}</span>` +
      `<span class="p-con">${s.desde ? "desde " : ""}${pesos(s.conCita)}</span><span class="p-ir" aria-hidden="true">›</span></a>`
    ).join("");
  if ($("notaPrecios") && NEGOCIO.notaPrecios) $("notaPrecios").textContent = NEGOCIO.notaPrecios;
}

function pintarBeneficios() {
  const lista = (arr) => arr.map((b) => `<li>${CHECK}<span>${esc(b)}</span></li>`).join("");
  if ($("benSin")) $("benSin").innerHTML = lista(NEGOCIO.beneficios.sinCita);
  if ($("benCon")) $("benCon").innerHTML = lista(NEGOCIO.beneficios.conCita);
}

// ---------- Quién te corta ----------
function pintarBarberos() {
  const el = $("listaBarberos");
  if (!el) return;
  const varios = NEGOCIO.barberos.length > 1;
  el.innerHTML = NEGOCIO.barberos.map((b) => {
    const redes = [["Instagram", b.instagram], ["TikTok", b.tiktok], ["Facebook", b.facebook]]
      .filter(([, u]) => u && /^https?:\/\//.test(u));
    const foto = b.foto
      ? `<img src="${esc(b.foto)}" alt="${esc(b.nombre)}" loading="lazy">`
      : `<div class="b-vacia"><img src="logo.png" alt="" width="900" height="377" style="width:70%;height:auto;opacity:.35"><span>[FOTO]</span></div>`;
    const nombreCorto = pendiente(b.nombre) ? "" : b.nombre.split(" ")[0];
    const agendar = "agendar.html" + (varios && !pendiente(b.nombre) ? "?barbero=" + encodeURIComponent(b.nombre) : "");
    return `<article class="barbero">
      <div class="b-foto">${foto}</div>
      <div class="b-info">
        <div class="b-rol script">${esc(b.rol || "Barbero")}</div>
        <h3 class="display">${esc(b.nombre)}</h3>
        <p>${esc(b.descripcion)}</p>
        ${redes.length ? `<div class="b-redes">${redes.map(([n, u]) => `<a class="btn btn-ghost btn-sm" href="${esc(u)}" target="_blank" rel="noopener">${n} ${EXT}</a>`).join("")}</div>` : ""}
        <a class="btn btn-primary" href="${agendar}">${nombreCorto ? "Agenda con " + esc(nombreCorto) : "Agenda tu cita"}</a>
      </div>
    </article>`;
  }).join("");
}

// ---------- Botones que se despliegan ----------
function prepararVentajas() {
  const botones = [...document.querySelectorAll(".v-btn")];
  if (!botones.length) return;
  const panel = (b) => $(b.getAttribute("aria-controls"));
  botones.forEach((b) => b.addEventListener("click", () => {
    const abrir = b.getAttribute("aria-expanded") !== "true";
    botones.forEach((o) => {
      o.setAttribute("aria-expanded", "false");
      panel(o).classList.remove("abierto");
      panel(o).inert = true;
    });
    if (!abrir) return;
    b.setAttribute("aria-expanded", "true");
    const p = panel(b);
    p.classList.add("abierto");
    p.inert = false;
    setTimeout(() => {
      const r = p.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 16) p.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 420);
  }));
}

// ---------- Datos de transferencia ----------
function prepararPago() {
  const pago = NEGOCIO.pago || {};
  document.querySelectorAll("[data-pago]").forEach((el) => {
    const v = pago[el.dataset.pago];
    el.textContent = v || "—";
  });
  document.querySelectorAll("[data-si]").forEach((el) => {
    if (!pago[el.dataset.si]) el.hidden = true;
  });
  document.querySelectorAll("[data-copiar]").forEach((btn) => {
    const valor = pago[btn.dataset.copiar];
    const etiqueta = btn.querySelector("span");
    if (pendiente(valor)) { btn.disabled = true; etiqueta.textContent = "Pendiente"; return; }
    btn.addEventListener("click", async () => {
      const limpio = String(valor).replace(/\s+/g, "");
      try {
        await navigator.clipboard.writeText(limpio);
        etiqueta.textContent = "¡Copiado!";
        btn.classList.add("copiado");
      } catch {
        window.prompt("Copia este número:", limpio);
      }
      setTimeout(() => { etiqueta.textContent = "Copiar"; btn.classList.remove("copiado"); }, 2200);
    });
  });
}

// ---------- Horario y "abierto ahora" (hora de Pachuca) ----------
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const hora12 = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
function ahoraPachuca() {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});
  const dia = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[partes.weekday];
  return { dia, min: (Number(partes.hour) % 24) * 60 + Number(partes.minute) };
}
// Horario de la semana (lo puede cambiar el barbero desde el panel → evento "tb-agenda")
let agendaVivo = null;
function semana() {
  const h = NEGOCIO.horario;
  const base = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ abierto: h.dias.includes(d), abre: h.abre, cierra: h.cierra }));
  const s = agendaVivo && Array.isArray(agendaVivo.semana) && agendaVivo.semana.length === 7 ? agendaVivo.semana : null;
  return s ? s.map((x, i) => ({ abierto: !!x.abierto, abre: x.abre || base[i].abre, cierra: x.cierra || base[i].cierra })) : base;
}
function fechaPachuca(diasMas) {
  const d = new Date(Date.now() + diasMas * 86400000);
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return p;   // "2026-10-11"
}
function infoDia(diasMas, diaSemana) {
  const n = semana()[diaSemana];
  const esp = agendaVivo && agendaVivo.dias ? agendaVivo.dias[fechaPachuca(diasMas)] : null;
  if (esp) return esp.cerrado ? { abierto: false, abre: n.abre, cierra: n.cierra, especial: true } : { abierto: true, abre: esp.abre || n.abre, cierra: esp.cierra || n.cierra, especial: true };
  return { ...n, especial: false };
}
function prepararHorario() {
  const { dia, min } = ahoraPachuca();
  const hoy = infoDia(0, dia);
  const abierto = hoy.abierto && min >= aMin(hoy.abre) && min < aMin(hoy.cierra);
  let corto, largo;
  if (abierto) {
    corto = `Abierto ahora · cierra ${hora12(aMin(hoy.cierra))}`;
    largo = `Abierto ahora · cierra a las ${hora12(aMin(hoy.cierra))}`;
  } else {
    let cuando = "hoy", sig = hoy;
    if (!(hoy.abierto && min < aMin(hoy.abre))) {
      sig = null;
      for (let i = 1; i <= 21 && !sig; i++) {
        const d = (dia + i) % 7, info = infoDia(i, d);
        if (info.abierto) { sig = info; cuando = i === 1 ? "mañana" : "el " + DIAS[d].toLowerCase(); }
      }
    }
    corto = sig ? `Cerrado · abre ${cuando} ${hora12(aMin(sig.abre))}` : "Cerrado por ahora";
    largo = sig ? `Cerrado ahora · abre ${cuando} a las ${hora12(aMin(sig.abre))}` : "Cerrado por ahora";
  }
  if ($("estadoCorto")) $("estadoCorto").textContent = corto;
  if ($("estadoLargo")) {
    $("estadoLargo").textContent = largo;
    $("estadoLargo").classList.toggle("abierto", abierto);
  }
  const tabla = $("tablaHorario");
  if (tabla) {
    const sem = semana();
    const orden = [1, 2, 3, 4, 5, 6, 0];
    let filas = orden.map((d) =>
      `<tr${d === dia ? ' class="hoy"' : ""}><td>${DIAS[d]}${d === dia ? " · hoy" : ""}</td>` +
      `<td>${sem[d].abierto ? `${hora12(aMin(sem[d].abre))} a ${hora12(aMin(sem[d].cierra))}` : "Cerrado"}</td></tr>`).join("");
    // Días especiales de las próximas 2 semanas
    for (let i = 0; i < 14; i++) {
      const d = (dia + i) % 7, info = infoDia(i, d);
      if (!info.especial) continue;
      const [, m, dd] = fechaPachuca(i).split("-").map(Number);
      filas += `<tr class="especial"><td>⚠ ${DIAS[d]} ${dd}/${m}</td><td>${info.abierto ? `${hora12(aMin(info.abre))} a ${hora12(aMin(info.cierra))}` : "Cerrado"}</td></tr>`;
    }
    tabla.tBodies[0].innerHTML = filas;
  }
}
document.addEventListener("tb-agenda", (e) => { agendaVivo = e.detail; prepararHorario(); });

// ---------- Barra de navegación abajo (solo en celular) ----------
function barraApp() {
  if (document.querySelector(".barra-app")) return;
  const ic = (d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const items = [
    ["index.html", "Inicio", ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>')],
    ["servicios.html", "Servicios", ic('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>')],
    ["agendar.html", "Agendar", ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')],
    ["galeria.html", "Galería", ic('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>')],
    ["visitanos.html", "Visítanos", ic('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')]
  ];
  const actual = (location.pathname.split("/").pop() || "index.html");
  const nav = document.createElement("nav");
  nav.className = "barra-app"; nav.setAttribute("aria-label", "Secciones");
  nav.innerHTML = items.map(([href, txt, svg]) =>
    `<a href="${href}" class="${href === "agendar.html" ? "ba-cta" : ""}"${href === actual ? ' aria-current="page"' : ""}><span class="ba-ic">${svg}</span><span>${txt}</span></a>`).join("");
  document.body.appendChild(nav);
}

// Tarjeta de ejemplo del inicio: se inclina al arrastrarla y se voltea al tocarla (igual que la tarjeta real)
function tarjetaDemo() {
  const caja = document.getElementById("rcDemo");
  if (!caja) return;
  const giro = caja.firstElementChild;
  let base = 0, x0 = 0, y0 = 0, activo = false, movio = false;
  const poner = (ry, rx, suave) => { giro.style.transition = suave ? "transform .6s cubic-bezier(.2,.8,.2,1.15)" : "none"; giro.style.transform = `rotateY(${ry}deg) rotateX(${rx}deg)`; };
  caja.addEventListener("pointerdown", (e) => { activo = true; movio = false; x0 = e.clientX; y0 = e.clientY; caja.classList.add("activa"); });
  window.addEventListener("pointermove", (e) => {
    if (!activo) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movio = true;
    poner(base + dx * 0.6, Math.max(-25, Math.min(25, -dy * 0.25)), false);
  });
  window.addEventListener("pointerup", (e) => {
    if (!activo) return;
    activo = false; caja.classList.remove("activa");
    const dx = e.clientX - x0;
    if (!movio) base += 180; else if (Math.abs(dx) > 90) base += dx > 0 ? 180 : -180;
    poner(base, 0, true);
  });
  window.addEventListener("pointercancel", () => { if (activo) { activo = false; caja.classList.remove("activa"); poner(base, 0, true); } });
}

barraApp();
tarjetaDemo();
pintarPrecios();
pintarBeneficios();
pintarBarberos();
prepararVentajas();
prepararPago();
prepararHorario();
setInterval(prepararHorario, 60000);
