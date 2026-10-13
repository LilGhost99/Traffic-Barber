// =====================================================================
//  CONFIGURACIÓN — lo único que tienes que editar
//  Lo que va entre [CORCHETES] son datos que faltan por llenar.
// =====================================================================

// 1) Configuración del proyecto de Firebase (no la cambies)
export const firebaseConfig = {
  apiKey: "AIzaSyAmalSEE2JJI7MmrnCYJno9xTgUg1INkIM",
  authDomain: "traffic-barber.firebaseapp.com",
  projectId: "traffic-barber",
  storageBucket: "traffic-barber.firebasestorage.app",
  messagingSenderId: "301958979089",
  appId: "1:301958979089:web:50d4d789374cc15c5e5bb0",
  measurementId: "G-88TPZ8JH36"
};

// 2) Datos del negocio
export const NEGOCIO = {
  // ---- Identidad: se pinta solo en todas las páginas ----
  nombre: "Traffic Barber",          // nombre de marca (títulos, mensajes de WhatsApp, tarjeta)
  nombreGoogle: "TB Barber shop",    // tal cual aparece en Google Maps (pie de página y búsqueda en Maps)
  lema: "No solo cortamos el cabello: diseñamos identidad. Old school y new school con lujo urbano, en Real de Toledo, Pachuca.",
  descripcion: "studio de barbería",  // frase corta para Google: "Traffic Barber, studio de barbería en Real de Toledo…"

  direccion: {
    calle: "Av. San Marcos",
    zona: "Real de Toledo",          // colonia o fraccionamiento
    cp: "42119",
    ciudad: "Pachuca",               // como lo dice la gente
    ciudadOficial: "Pachuca de Soto",
    estado: "Hgo."
  },

  // Google: Place ID (sácalo con el buscador de Place ID) y la calificación que muestra Google.
  // Actualiza estrellas y reseñas cada mes o dos.
  google: { placeId: "ChIJnW-ZsGyh0YURKsS65CJwEzI", estrellas: 4.9, resenas: 156 },

  whatsapp: "525573794461",          // con 52 al inicio, sin espacios
  redes: {                           // link completo; las que dejes vacías no aparecen
    facebook: "https://www.facebook.com/profile.php?id=61577432973040",
    instagram: "",
    tiktok: ""
  },

  // Colores de la marca (los demás tonos de la página son negros/grises y se quedan)
  colores: { principal: "#A5F20A", claro: "#C6FF5C", suave: "#86B83A" },

  // Aviso de privacidad: quién es el responsable de los datos
  legal: { responsable: "[NOMBRE DEL TITULAR O RAZÓN SOCIAL]", correo: "[CORREO DE CONTACTO]" },

  // ---- Tarjeta de sellos (el panel puede cambiar estos textos en Promos → Premios) ----
  sellosPorTarjeta: 10,
  premioMitad: { en: 5,  texto: "Facial gratis" },
  premioFinal: { en: 10, texto: "50% de descuento en corte" },
  promoCumple: "[PROMO DE CUMPLEAÑOS, ej. corte a mitad de precio]",

  // Promos de ejemplo: solo se ven mientras no haya promos en el panel
  promociones: [
    { titulo: "Miércoles: cortes a $100", detalle: "Todos los miércoles." }
  ],

  // ---- Precios: sinCita = llegando sin apartar · conCita = agendando ----
  servicios: [
    { id: "corte",        nombre: "Corte de cabello", sinCita: 150, conCita: 200 },
    { id: "corte-greca",  nombre: "Corte y greca",    sinCita: 200, conCita: 200 },
    { id: "corte-ceja",   nombre: "Corte y ceja",     sinCita: 180, conCita: 200 },
    { id: "cejas",        nombre: "Cejas",            sinCita: 50,  conCita: 50  },
    { id: "pigmento",     nombre: "Pigmento",         sinCita: 50,  conCita: 50  },
    { id: "corte-barba",  nombre: "Corte y barba",    sinCita: 250, conCita: 250 },
    { id: "corte-facial", nombre: "Corte y facial",   sinCita: 250, conCita: 250 },
    { id: "corte-vip",    nombre: "Corte VIP",        sinCita: 400, conCita: 500 }
  ],

  // ---- Lo que incluye cada tipo de visita ----
  beneficios: {
    sinCita: ["Tarjeta de sellos", "Agua", "WiFi gratis"],
    conCita: ["Lavado de cabello", "Mascarilla facial", "Masaje", "Café, té o cerveza de cortesía"]
  },

  // ---- Horario (0 = domingo, 1 = lunes … 6 = sábado) ----
  horario: { dias: [1, 2, 3, 4, 5, 6], abre: "11:30", cierra: "22:00" },
  citas: { cadaMinutos: 60, primera: "11:30", ultima: "21:30", diasAdelante: 30 },   // las horas salen del horario: cada hora desde que abre

  // ---- Datos para transferencias (aparecen en la página con botón de copiar) ----
  pago: {
    banco: "[BANCO]",
    titular: "[NOMBRE DEL TITULAR]",
    tarjeta: "[NÚMERO DE TARJETA]",   // ej. "4152 3138 0000 0000"
    clabe: ""                          // opcional: 18 dígitos. Si lo dejas vacío no aparece
  },

  // ---- Quién te corta el pelo ----
  // foto: sube la imagen al repo (ej. "barbero1.jpg") y pon aquí su nombre. Vacío = sin foto.
  // Redes: pega el link completo. Las que dejes vacías no aparecen.
  barberos: [
    {
      nombre: "[NOMBRE DEL BARBERO]",
      rol: "Barbero",
      descripcion: "[Descripción: años de experiencia, especialidad (fades, diseños, barba) y algo personal.]",
      foto: "",
      instagram: "",
      tiktok: "",
      facebook: "https://www.facebook.com/profile.php?id=61577432973040"
    }
  ]
};
