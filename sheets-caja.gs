// Google Sheets ← Caja del panel.
// Pega esto en tu hoja: Extensiones → Apps Script. Luego Implementar → Nueva implementación →
// Tipo "Aplicación web", Ejecutar como: Yo, Quién tiene acceso: Cualquier usuario. Copia la URL al panel.
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const hoja = SpreadsheetApp.getActive().getSheetByName("Caja") || SpreadsheetApp.getActive().insertSheet("Caja");
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(["ID", "Fecha", "Hora", "Tipo", "Concepto", "Forma de pago", "Monto", "Propina", "Total", "Barbero", "Quién"]);
    hoja.setFrozenRows(1);
  }
  const ids = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues().map(r => r[0]) : [];
  (d.movs || []).forEach(m => {
    const fila = ids.indexOf(m.id);
    if (m.borrar) { if (fila >= 0) { hoja.deleteRow(fila + 2); ids.splice(fila, 1); } return; }
    if (fila >= 0) return;   // ya estaba
    const signo = m.tipo === "gasto" ? -1 : 1;
    hoja.appendRow([m.id, m.fecha, m.hora, m.tipo === "gasto" ? "Gasto" : "Cobro", m.concepto, m.metodo, signo * m.monto, m.propina || 0, signo * (m.monto + (m.propina || 0)), m.barbero || "", m.por || ""]);
    ids.push(m.id);
  });
  return ContentService.createTextOutput("ok");
}
