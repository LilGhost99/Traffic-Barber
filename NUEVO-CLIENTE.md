# Cliente nuevo — LilGhost Studio

Cómo sacar una copia de esta página (citas + tarjeta de sellos + panel) para otro negocio.
Todo se hace desde el navegador, sin línea de comandos. Calcula una tarde.

---

## 0. Una sola vez: marcar este repo como plantilla

GitHub → este repo → **Settings** → palomea **Template repository**.

## 1. Copiar el repo

1. En este repo, botón verde **Use this template → Create a new repository**.
2. Nombre: el del negocio sin espacios, ej. `Unas-Luna`. Público.
3. En el repo nuevo: **Settings → Pages → Branch: main / (root) → Save**.
   En 1–2 minutos queda en `https://lilghost99.github.io/Unas-Luna/`.

## 2. Datos del negocio → `firebase-config.js`

Ábrelo en GitHub (lápiz ✏️ para editar) y cambia el bloque `NEGOCIO`:

| Campo | Qué poner |
|---|---|
| `nombre`, `nombreGoogle` | Nombre de marca y como aparece en Google Maps |
| `lema`, `descripcion` | Frase del inicio y frase corta para Google |
| `direccion` | Calle, colonia, CP, ciudad, estado |
| `google.placeId` | Place ID del negocio (buscador de Place ID) |
| `google.estrellas`, `google.resenas` | Lo que muestra Google hoy. Actualízalo cada mes o dos |
| `whatsapp` | Con `52` al inicio, sin espacios |
| `redes` | Links completos. Las vacías no aparecen en la página |
| `legal` | Nombre del dueño o razón social y correo (aviso de privacidad) |
| `sellosPorTarjeta`, `premioMitad`, `premioFinal`, `promoCumple` | Premios de la tarjeta |
| `servicios` | Precios sin cita y con cita |
| `beneficios`, `horario`, `citas` | Lo que incluye cada visita y el horario |
| `pago` | Datos de transferencia (los que falten no aparecen) |
| `barberos` | El equipo, con foto y redes |

Todo eso se pinta solo en todas las páginas y en los mensajes de WhatsApp.

## 3. Colores → `colores.css`

Cambia las 4 líneas de arriba (`--gold`, `--gold-hi`, `--gold-soft`, `--gold-rgb`)
y el color dentro de la estrellita (después de `%23`). Lo demás se calcula solo.

## 4. Imágenes (arrastrar y soltar en GitHub: **Add file → Upload files**)

Sube con **el mismo nombre** para reemplazar:

- `logo.png` — logo del negocio (fondo transparente, horizontal)
- `icono-192.png`, `icono-512.png`, `apple-touch-icon.png` — ícono cuadrado
- `corte1.jpg` … `corte9.jpg` — fotos de la galería (verticales 4:5)

## 5. Tres datos fijos (para Google y para cuando compartan el link)

Estos los leen WhatsApp y Google antes de que corra la página, por eso van escritos a mano:

- En cada `.html`, la línea `<title …>` y `<meta name="description" …>`: cambia el nombre del negocio
  (o pídeselo a Claude: "cambia los títulos al negocio nuevo").
- `manifest.json`: `name`, `short_name`, `description`.

## 6. Firebase (base de datos del panel)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto** (sin Analytics).
2. **Firestore Database → Crear base de datos** → ubicación `nam5` → modo producción.
3. **Firestore → Reglas**: pega todo `firestore.rules` → **Publicar**.
4. **Authentication → Comenzar** → activa **Correo/contraseña** y **Google**.
   En **Configuración → Dominios autorizados** agrega `lilghost99.github.io`.
5. **Configuración del proyecto (⚙️) → Tus apps → Web `</>`** → copia el `firebaseConfig`
   y pégalo arriba en `firebase-config.js`.
6. Dar acceso al dueño: que entre a `admin.html` con su correo. El panel le muestra su **UID**.
   En Firestore crea la colección **admins** con un documento cuyo ID sea ese UID (sin campos).
   Que vuelva a entrar. Listo.

## 7. Antes de entregar

- [ ] Abrir la página en el celular: nombre, dirección, WhatsApp, Maps y reseñas.
- [ ] Agendar una cita de prueba y verla en el panel. Borrarla.
- [ ] Sacar una tarjeta de prueba, sellarla, borrarla.
- [ ] Revisar el aviso de privacidad (`legal` lleno).

---

**Ojo:** las palabras del giro ("corte", "barbero", "Quién te corta") todavía están pensadas
para barbería. Para un negocio de otro giro (uñas, estética, spa), pídele a Claude que las adapte.
