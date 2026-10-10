// =====================================================================
//  CONFIGURACIÓN — lo único que tienes que editar
// =====================================================================

// 1) Pega aquí la configuración de tu proyecto de Firebase
//    (Firebase Console → ⚙ Configuración del proyecto → Tus apps → Web → firebaseConfig)
export const firebaseConfig = {
  apiKey: "AIzaSyAmalSEE2JJI7MmrnCYJno9xTgUg1INkIM",
  authDomain: "traffic-barber.firebaseapp.com",
  projectId: "traffic-barber",
  storageBucket: "traffic-barber.firebasestorage.app",
  messagingSenderId: "301958979089",
  appId: "1:301958979089:web:50d4d789374cc15c5e5bb0",
  measurementId: "G-88TPZ8JH36"
};

// 2) Datos y recompensas del negocio
export const NEGOCIO = {
  nombre: "Traffic Barber",
  whatsapp: "525573794461",          // con 52 al inicio, sin espacios
  sellosPorTarjeta: 10,
  premioMitad: { en: 5,  texto: "Facial gratis" },
  premioFinal: { en: 10, texto: "[PREMIO DEL 10° CORTE]" },
  promoCumple: "[PROMO DE CUMPLEAÑOS, ej. corte a mitad de precio]",
  promociones: [
    { titulo: "Miércoles: cortes a $100", detalle: "Todos los miércoles." },
    { titulo: "Café y té gratis", detalle: "Mientras esperas tu turno." }
  ]
};
