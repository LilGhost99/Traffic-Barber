// Agendar cita: elige servicio, día y hora → se crea la tarjeta (si no tiene) y la cita,
// y luego se manda el mensaje por WhatsApp para registrarla en Confirmafy.
import { db, configurado, MESES, escapar } from "./firebase.js";
import { NEGOCIO } from "./firebase-config.js";
import { collection, addDoc, doc, getDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const CLAVE = "tb_tarjeta_id";
const params = new URLSearchParams(location.search);
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_C = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const pesos = (n) => "$" + Number(n).toLocaleString("es-MX");
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const aHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const hora12 = (hhmm) => { const m = aMin(hhmm), h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
const pendiente = (v) => !v || /^\s*\[.*\]\s*$/.test(String(v));
const fechaISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const fechaLarga = (s) => { const d = deISO(s); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; };
const valor = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "";

function leerId() { try { return localStorage.getItem(CLAVE); } catch { return null; } }
function guardarId(id) { try { localStorage.setItem(CLAVE, id); } catch {} }

let cliente = null;        // tarjeta con la que se agenda { id, nombre, telefono, sellos }
let otraPersona = false;   // "No soy yo": no se guarda la tarjeta nueva en este celular
let promo = "";            // título de la promo validada
let promoInfo = null;      // { titulo, tipo, valor, servicioId, dias } si la promo trae descuento
const DIAS_PROMO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

// Precio con la promo aplicada. Devuelve { precio, normal, aplica, motivo }
function precioCon(s, fecha) {
  const normal = s.conCita;
  const p = promoInfo;
  if (!promo || !p || !p.tipo || !(Number(p.valor) > 0)) return { precio: normal, normal, aplica: false, motivo: "" };
  if (p.servicioId && p.servicioId !== s.id) {
    const sv = NEGOCIO.servicios.find((x) => x.id === p.servicioId);
    return { precio: normal, normal, aplica: false, motivo: `La promo es solo para ${sv ? sv.nombre : "otro servicio"}.` };
  }
  if (p.dias && p.dias.length && fecha && !p.dias.includes(deISO(fecha).getDay())) {
    return { precio: normal, normal, aplica: false, motivo: `La promo solo aplica ${p.dias.map((d) => DIAS_PROMO[d]).join(", ")}.` };
  }
  const v = Number(p.valor);
  const precio = p.tipo === "porcentaje" ? Math.round(normal * (1 - Math.min(v, 100) / 100)) : Math.min(v, normal);
  return { precio, normal, aplica: precio < normal, motivo: "" };
}

// ---------- Servicios ----------
function pintarServicios() {
  const pre = params.get("servicio");
  $("opServicios").innerHTML = NEGOCIO.servicios.map((s) => `
    <label class="opcion"><input type="radio" name="servicio" value="${escapar(s.id)}"${s.id === pre ? " checked" : ""}>
      <span class="o-cuerpo"><span class="o-nombre">${escapar(s.nombre)}${s.sinCita !== s.conCita ? `<small>Sin cita ${pesos(s.sinCita)}</small>` : ""}</span>
      <span class="o-precio">${pesos(s.conCita)}</span></span></label>`).join("");
}

// ---------- Barberos (solo si hay más de uno) ----------
function pintarBarberos() {
  const lista = NEGOCIO.barberos.filter((b) => !pendiente(b.nombre));
  if (lista.length < 2) return;
  const pre = params.get("barbero");
  $("pasoBarbero").classList.remove("hidden");
  $("opBarberos").innerHTML =
    `<label class="opcion"><input type="radio" name="barbero" value=""${pre ? "" : " checked"}><span class="o-cuerpo"><b>Cualquiera</b><span>el que esté libre</span></span></label>` +
    lista.map((b) => `<label class="opcion"><input type="radio" name="barbero" value="${escapar(b.nombre)}"${b.nombre === pre ? " checked" : ""}>
      <span class="o-cuerpo"><b>${escapar(b.nombre.split(" ")[0])}</b><span>${escapar(b.rol || "Barbero")}</span></span></label>`).join("");
  document.querySelectorAll("[data-num]").forEach((el, i) => { el.textContent = i + 3; });
}

// ---------- Días y horas ----------
function horasDe(fecha) {
  const c = NEGOCIO.citas, lista = [];
  for (let m = aMin(c.primera); m <= aMin(c.ultima); m += c.cadaMinutos) lista.push(m);
  const hoy = new Date();
  if (fecha === fechaISO(hoy)) {
    const ahora = hoy.getHours() * 60 + hoy.getMinutes() + 30;   // al menos 30 min de anticipación
    return lista.filter((m) => m > ahora).map(aHHMM);
  }
  return lista.map(aHHMM);
}

function pintarDias() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dias = [];
  for (let i = 0; dias.length < NEGOCIO.citas.diasAdelante && i < 60; i++) {
    const d = new Date(hoy); d.setDate(hoy.getDate() + i);
    if (!NEGOCIO.horario.dias.includes(d.getDay())) continue;
    if (i === 0 && !horasDe(fechaISO(d)).length) continue;
    dias.push({ d, i });
  }
  $("opDias").innerHTML = dias.map(({ d, i }) => {
    const titulo = i === 0 ? "Hoy" : i === 1 ? "Mañana" : DIAS_C[d.getDay()];
    return `<label class="opcion"><input type="radio" name="dia" value="${fechaISO(d)}">
      <span class="o-cuerpo"><b>${titulo}</b><span>${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}</span></span></label>`;
  }).join("");
}

function pintarHoras() {
  const fecha = valor("dia");
  if (!fecha) return;
  const antes = valor("hora");
  const horas = horasDe(fecha);
  $("opHoras").innerHTML = horas.length
    ? horas.map((h) => `<label class="opcion"><input type="radio" name="hora" value="${h}"${h === antes ? " checked" : ""}><span class="o-cuerpo">${hora12(h)}</span></label>`).join("")
    : `<p class="muted">Ya no hay horarios para este día. Elige otro.</p>`;
}

// ---------- ¿Ya tiene tarjeta en este celular? ----------
function mostrarNuevos() {
  $("yaTengo").classList.add("hidden");
  $("datosNuevos").classList.remove("hidden");
}

async function cargarCliente() {
  const id = leerId();
  if (!id || !configurado) return mostrarNuevos();
  try {
    let s = await getDoc(doc(db, "clientes", id));
    let cid = id;
    if (s.exists() && s.data().unidoA) { cid = s.data().unidoA; guardarId(cid); s = await getDoc(doc(db, "clientes", cid)); }
    if (!s.exists()) return mostrarNuevos();
    const c = s.data();
    cliente = { id: cid, nombre: c.nombre, telefono: c.telefono, sellos: c.sellos || 0 };
    $("yaTengo").innerHTML =
      `<div>Agendas como <b>${escapar(c.nombre)}</b> · ${escapar(c.telefono)}<br>` +
      `<span class="muted">Tu tarjeta: ${cliente.sellos} de ${NEGOCIO.sellosPorTarjeta} sellos</span></div>` +
      `<button type="button" id="noSoyYo">No soy yo</button>`;
    $("yaTengo").classList.remove("hidden");
    $("datosNuevos").classList.add("hidden");
    $("noSoyYo").addEventListener("click", () => { cliente = null; otraPersona = true; mostrarNuevos(); $("nombre").focus(); });
  } catch (ex) { console.error(ex); mostrarNuevos(); }
}

// ---------- Promo que viene del link ----------
async function cargarPromo() {
  const t = params.get("promo");
  if (!t) return;
  let validas = NEGOCIO.promociones.map((p) => ({ ...p }));
  if (configurado) {
    try {
      const snap = await getDocs(collection(db, "promos"));
      if (!snap.empty) validas = snap.docs.map((d) => d.data()).filter((p) => p.activa !== false);
      const id = leerId();
      if (id) (await getDocs(collection(db, "clientes", id, "promos"))).forEach((d) => {
        if (d.data().activa !== false) validas.push(d.data());
      });
    } catch (ex) { console.error(ex); }
  }
  const encontrada = validas.find((p) => p.titulo === t);
  if (!encontrada) return;
  promo = t;
  promoInfo = encontrada;
  // Si la promo es de un servicio, dejarlo elegido
  if (encontrada.servicioId && !valor("servicio")) {
    const r = document.querySelector(`input[name="servicio"][value="${CSS.escape(encontrada.servicioId)}"]`);
    if (r) r.checked = true;
  }
  $("promoSel").innerHTML = `<span>Con la promo: <b>${escapar(t)}</b></span><button type="button" id="quitarPromo">Quitar</button>`;
  $("promoSel").classList.remove("hidden");
  $("quitarPromo").addEventListener("click", () => { promo = ""; $("promoSel").classList.add("hidden"); resumen(); });
  resumen();
}

// ---------- Resumen de abajo ----------
function resumen() {
  const s = NEGOCIO.servicios.find((x) => x.id === valor("servicio"));
  const fecha = valor("dia"), hora = valor("hora");
  $("resumen").innerHTML = `<b>${s ? escapar(s.nombre) : "Elige tu servicio"}${promo ? " · promo" : ""}</b>` +
    `<span>${fecha ? fechaLarga(fecha) : "Día"}${hora ? " · " + hora12(hora) : fecha ? " · hora" : " y hora"}</span>`;
  if (!s) { $("total").textContent = ""; $("promoNota").classList.add("hidden"); return; }
  const r = precioCon(s, fecha);
  $("total").innerHTML = r.aplica ? `<s>${pesos(r.normal)}</s> ${pesos(r.precio)}` : pesos(r.precio);
  const nota = $("promoNota");
  if (promo && (r.motivo || (!r.aplica && !(promoInfo && promoInfo.tipo)))) {
    nota.textContent = r.motivo || "El descuento de la promo se aplica en la barbería.";
    nota.classList.remove("hidden");
  } else if (r.aplica) {
    nota.textContent = `Con la promo pagas ${pesos(r.precio)} en lugar de ${pesos(r.normal)}.`;
    nota.classList.remove("hidden");
  } else nota.classList.add("hidden");
}

// ---------- Datos del cumpleaños ----------
function prepararCumple() {
  $("dia").innerHTML = '<option value="">Día</option>' + Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
  $("mes").innerHTML = '<option value="">Mes</option>' + MESES.map((m, i) => `<option value="${i + 1}">${m[0].toUpperCase() + m.slice(1)}</option>`).join("");
  $("telefono").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); });
}

// ---------- Apartar ----------
function error(t) {
  $("errorCita").textContent = t;
  $("errorCita").classList.remove("hidden");
  $("errorCita").scrollIntoView({ behavior: "smooth", block: "center" });
}

$("formCita").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("errorCita").classList.add("hidden");
  if (!configurado) return error("No se pudo conectar. Revisa tu internet y recarga la página.");
  const servicio = NEGOCIO.servicios.find((x) => x.id === valor("servicio"));
  const fecha = valor("dia"), hora = valor("hora"), barbero = valor("barbero");
  const comentario = $("comentario").value.trim().slice(0, 120);
  if (!servicio) return error("Elige qué te vamos a hacer.");
  if (!fecha) return error("Elige el día de tu cita.");
  if (!hora) return error("Elige la hora de tu cita.");

  let nombre, telefono, cumple;
  if (cliente) { nombre = cliente.nombre; telefono = cliente.telefono; }
  else {
    nombre = $("nombre").value.trim();
    telefono = $("telefono").value.trim();
    const d = Number($("dia").value), m = Number($("mes").value);
    if (!nombre) return error("Escribe tu nombre.");
    if (!/^\d{10}$/.test(telefono)) return error("Tu WhatsApp debe tener 10 dígitos.");
    if (!d || !m) return error("Elige el día y mes de tu cumpleaños.");
    if (!$("acepto").checked) return error("Necesitas aceptar el aviso de privacidad.");
    cumple = String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }

  const cobro = precioCon(servicio, fecha);
  const btn = $("btnApartar");
  btn.disabled = true; btn.textContent = "Apartando…";
  try {
    let nuevaTarjeta = false;
    if (!cliente) {
      const ref = await addDoc(collection(db, "clientes"), {
        nombre, telefono, cumple, sellos: 0, facialCanjeado: false, tarjetas: 0, creado: serverTimestamp()
      });
      cliente = { id: ref.id, nombre, telefono, sellos: 0 };   // si la cita falla, no se crea otra tarjeta
      nuevaTarjeta = true;
      if (!otraPersona) guardarId(ref.id);
    }
    const ref = await addDoc(collection(db, "citas"), {
      nombre, telefono,
      servicioId: servicio.id, servicio: servicio.nombre, precio: cobro.precio, precioNormal: cobro.normal,
      fecha, hora, promo, barbero, comentario,
      clienteId: cliente.id, nuevaTarjeta,
      estado: "pendiente", creado: serverTimestamp()
    });
    mostrarListo({ folio: "TB-" + ref.id.slice(0, 5).toUpperCase(), servicio, fecha, hora, barbero, comentario, nombre, nuevaTarjeta, cobro });
  } catch (ex) {
    console.error(ex);
    error("No pudimos apartar tu cita. Revisa tu conexión e intenta de nuevo.");
    btn.disabled = false; btn.textContent = "Apartar cita";
  }
});

function mostrarListo({ folio, servicio, fecha, hora, barbero, comentario, nombre, nuevaTarjeta, cobro }) {
  const lineas = [
    "Hola, quiero agendar una cita en Traffic Barber 💈",
    "",
    cobro.aplica
      ? `• Servicio: ${servicio.nombre} (con cita) – ${pesos(cobro.precio)} con promo (normal ${pesos(cobro.normal)})`
      : `• Servicio: ${servicio.nombre} (con cita) – ${pesos(cobro.precio)}`,
    `• Día: ${fechaLarga(fecha)}`,
    `• Hora: ${hora12(hora)}`,
    barbero ? `• Con: ${barbero}` : null,
    promo ? `• Promo: ${promo}` : null,
    `• A nombre de: ${nombre}`,
    comentario ? `• Nota: ${comentario}` : null,
    "",
    `Folio: ${folio}`
  ].filter((l) => l !== null);
  $("btnWhats").href = `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(lineas.join("\n"))}`;

  const filas = [
    ["Folio", `<b class="folio">${folio}</b>`],
    ["Servicio", `<b>${escapar(servicio.nombre)}</b>`],
    ["Día", `<b>${fechaLarga(fecha)}</b>`],
    ["Hora", `<b>${hora12(hora)}</b>`],
    barbero ? ["Con", `<b>${escapar(barbero)}</b>`] : null,
    promo ? ["Promo", `<b>${escapar(promo)}</b>`] : null,
    ["Total", cobro.aplica ? `<b><s class="tachado">${pesos(cobro.normal)}</s> ${pesos(cobro.precio)}</b>` : `<b>${pesos(cobro.precio)}</b>`],
    ["Incluye", `<b>${escapar(NEGOCIO.beneficios.conCita.join(", "))}</b>`]
  ].filter(Boolean);
  $("ticket").innerHTML = filas.map(([a, b]) => `<div><span>${a}</span>${b}</div>`).join("");
  $("btnTarjeta").href = "tarjeta.html?id=" + encodeURIComponent(cliente.id);
  $("notaTarjeta").textContent = nuevaTarjeta
    ? "Te creamos tu tarjeta de sellos. Al llegar a tu cita te ponemos tu sello."
    : "Al llegar a tu cita te ponemos tu sello en tu tarjeta.";

  $("formCita").classList.add("hidden");
  document.querySelector(".page-head").classList.add("hidden");
  $("vistaListo").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  $("vistaListo").focus({ preventScroll: true });
}

// ---------- Inicio ----------
pintarServicios();
pintarBarberos();
pintarDias();
prepararCumple();
document.addEventListener("change", (e) => {
  if (e.target.name === "dia") pintarHoras();
  if (["servicio", "dia", "hora"].includes(e.target.name)) resumen();
});
resumen();
if (!configurado) { $("sinConfig").classList.remove("hidden"); mostrarNuevos(); }
else { cargarCliente(); cargarPromo(); }
