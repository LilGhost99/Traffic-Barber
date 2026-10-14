// Google Sheets ← Caja del panel de la barbería.
// La pestaña "Caja" son los datos (no la edites). La pestaña "Resumen" se arma sola con las cuentas.
// Instalar: Extensiones → Apps Script → pega esto → Guardar → Implementar → Nueva implementación →
// "Aplicación web", Ejecutar como: Yo, Acceso: Cualquier usuario. La URL /exec va al panel.

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const hoja = hojaDatos();
  const n = hoja.getLastRow();
  const ids = n > 1 ? hoja.getRange(2, 1, n - 1, 1).getValues().map(r => r[0]) : [];
  (d.movs || []).forEach(m => {
    const fila = ids.indexOf(m.id);
    if (m.borrar) { if (fila >= 0) { hoja.deleteRow(fila + 2); ids.splice(fila, 1); } return; }
    if (fila >= 0) return;   // ya estaba
    const signo = m.tipo === "gasto" ? -1 : 1;
    const [y, mes, dia] = m.fecha.split("-").map(Number);
    hoja.appendRow([m.id, new Date(y, mes - 1, dia), m.hora, m.tipo === "gasto" ? "Gasto" : "Cobro", m.concepto, m.metodo,
      signo * m.monto, m.propina || 0, signo * (m.monto + (m.propina || 0)), m.barbero || "", m.por || ""]);
    ids.push(m.id);
  });
  if (!SpreadsheetApp.getActive().getSheetByName("Resumen")) armarResumen();
  return ContentService.createTextOutput("ok");
}

function hojaDatos() {
  const libro = SpreadsheetApp.getActive();
  let hoja = libro.getSheetByName("Caja");
  if (!hoja) hoja = libro.insertSheet("Caja");
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(["ID", "Fecha", "Hora", "Tipo", "Concepto", "Forma de pago", "Monto", "Propina", "Total", "Barbero", "Quién"]);
  }
  return hoja;
}

// Arma (o vuelve a armar) la pestaña Resumen. También se puede correr a mano: elige "armarResumen" y dale ▶ Ejecutar.
function armarResumen() {
  const libro = SpreadsheetApp.getActive();
  const datos = hojaDatos();
  const NEGRO = "#0B0B0B", VERDE = "#A5F20A", ROJO = "#E5675A", GRIS = "#F3F3F3";
  const $ = "$#,##0";

  // Datos: fechas de texto → fechas reales, y que se vea ordenado
  const n = datos.getLastRow();
  if (n > 1) {
    const r = datos.getRange(2, 2, n - 1, 1);
    r.setValues(r.getValues().map(([v]) => {
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split("-").map(Number); return [new Date(y, m - 1, d)]; }
      return [v];
    }));
  }
  datos.setFrozenRows(1);
  datos.getRange("A1:K1").setBackground(NEGRO).setFontColor(VERDE).setFontWeight("bold");
  datos.getRange("B:B").setNumberFormat("ddd d mmm yyyy");
  datos.getRange("G:I").setNumberFormat($);
  datos.hideColumns(1);   // el ID solo lo usa el panel
  datos.setTabColor("#888888");
  datos.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$D2="Gasto"').setFontColor(ROJO).setRanges([datos.getRange("A2:K")]).build()]);

  let r = libro.getSheetByName("Resumen");
  if (r) r.clear(); else r = libro.insertSheet("Resumen", 0);
  r.setConditionalFormatRules([]);
  r.setTabColor(VERDE);
  libro.setActiveSheet(r); libro.moveActiveSheet(1);
  r.setHiddenGridlines(true);

  // Título
  r.getRange("A1:I1").merge().setValue("💈 CAJA · TRAFFIC BARBER").setBackground(NEGRO).setFontColor(VERDE).setFontSize(18).setFontWeight("bold");
  r.getRange("A2:I2").merge().setValue("Se llena sola con cada cobro y gasto del panel. Los datos están en la pestaña \"Caja\": no la edites.")
    .setFontColor("#777777").setFontStyle("italic");

  // Cuadro: hoy / semana / mes
  const S = ["TODAY()", "TODAY()-WEEKDAY(TODAY(),3)", "EOMONTH(TODAY(),-1)+1"];   // desde cuándo
  const rango = (s) => `Caja!$B:$B,">="&${s},Caja!$B:$B,"<="&TODAY()`;
  const filas = [
    ["💵 Entró (cobros)", s => `=SUMIFS(Caja!$I:$I,Caja!$D:$D,"Cobro",${rango(s)})`],
    ["   Efectivo", s => `=SUMIFS(Caja!$I:$I,Caja!$D:$D,"Cobro",Caja!$F:$F,"Efectivo",${rango(s)})`],
    ["   Transferencia", s => `=SUMIFS(Caja!$I:$I,Caja!$D:$D,"Cobro",Caja!$F:$F,"Transferencia",${rango(s)})`],
    ["   Terminal", s => `=SUMIFS(Caja!$I:$I,Caja!$D:$D,"Cobro",Caja!$F:$F,"Terminal",${rango(s)})`],
    ["   Propinas (ya incluidas)", s => `=SUMIFS(Caja!$H:$H,Caja!$D:$D,"Cobro",${rango(s)})`],
    ["🔻 Gastos", s => `=-SUMIFS(Caja!$I:$I,Caja!$D:$D,"Gasto",${rango(s)})`],
    ["✅ Quedó (entró − gastos)", null],
    ["💰 Efectivo que debe haber", s => `=SUMIFS(Caja!$I:$I,Caja!$F:$F,"Efectivo",${rango(s)})`],
    ["🧾 Número de cobros", s => `=COUNTIFS(Caja!$D:$D,"Cobro",${rango(s)})`]
  ];
  r.getRange("A4:D4").setValues([["", "HOY", "ESTA SEMANA", "ESTE MES"]]).setBackground(NEGRO).setFontColor(VERDE).setFontWeight("bold");
  filas.forEach(([titulo, f], i) => {
    const fila = 5 + i;
    r.getRange(fila, 1).setValue(titulo);
    S.forEach((s, j) => {
      const c = r.getRange(fila, 2 + j);
      if (f) c.setFormula(f(s)); else c.setFormula(`=${c.offset(-6, 0).getA1Notation()}-${c.offset(-1, 0).getA1Notation()}`);
    });
  });
  r.getRange("B5:D13").setNumberFormat($).setHorizontalAlignment("right");
  r.getRange("B13:D13").setNumberFormat("0");
  r.getRange("A5:D5").setFontWeight("bold");
  r.getRange("A6:D9").setFontColor("#555555");
  r.getRange("A10:D10").setFontColor(ROJO).setFontWeight("bold");
  r.getRange("A11:D11").setFontWeight("bold").setFontSize(12).setBackground("#EAFBC7");
  r.getRange("A4:D13").setBorder(true, true, true, true, false, true, "#DDDDDD", null);

  // Por día
  r.getRange("A15:D15").merge().setValue("📅 POR DÍA").setFontWeight("bold").setFontSize(13);
  r.getRange("A16:D16").setValues([["Día", "Entró", "Gastos", "Quedó"]]).setBackground(NEGRO).setFontColor(VERDE).setFontWeight("bold");
  r.getRange("A17").setFormula('=IFERROR(SORT(UNIQUE(FILTER(Caja!B2:B,Caja!B2:B<>"")),1,FALSE),"")');
  r.getRange("B17").setFormula('=ARRAYFORMULA(IF(A17:A="",,SUMIFS(Caja!I:I,Caja!B:B,A17:A,Caja!D:D,"Cobro")))');
  r.getRange("C17").setFormula('=ARRAYFORMULA(IF(A17:A="",,-SUMIFS(Caja!I:I,Caja!B:B,A17:A,Caja!D:D,"Gasto")))');
  r.getRange("D17").setFormula('=ARRAYFORMULA(IF(A17:A="",,B17:B-C17:C))');
  r.getRange("A17:A").setNumberFormat("ddd d mmm yyyy");

  // Por mes
  r.getRange("F15:I15").merge().setValue("🗓️ POR MES").setFontWeight("bold").setFontSize(13);
  r.getRange("F16:I16").setValues([["Mes", "Entró", "Gastos", "Quedó"]]).setBackground(NEGRO).setFontColor(VERDE).setFontWeight("bold");
  r.getRange("F17").setFormula('=IFERROR(SORT(UNIQUE(FILTER(EOMONTH(Caja!B2:B,-1)+1,Caja!B2:B<>"")),1,FALSE),"")');
  r.getRange("G17").setFormula('=ARRAYFORMULA(IF(F17:F="",,SUMIFS(Caja!I:I,Caja!D:D,"Cobro",Caja!B:B,">="&F17:F,Caja!B:B,"<="&EOMONTH(F17:F,0))))');
  r.getRange("H17").setFormula('=ARRAYFORMULA(IF(F17:F="",,-SUMIFS(Caja!I:I,Caja!D:D,"Gasto",Caja!B:B,">="&F17:F,Caja!B:B,"<="&EOMONTH(F17:F,0))))');
  r.getRange("I17").setFormula('=ARRAYFORMULA(IF(F17:F="",,G17:G-H17:H))');
  r.getRange("F17:F").setNumberFormat("mmmm yyyy");

  r.getRange("B17:D").setNumberFormat($);
  r.getRange("G17:I").setNumberFormat($);
  r.getRange("C17:C").setFontColor(ROJO);
  r.getRange("H17:H").setFontColor(ROJO);
  r.getRange("D17:D").setFontWeight("bold");
  r.getRange("I17:I").setFontWeight("bold");
  r.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A17<>"",ISEVEN(ROW()))')
    .setBackground(GRIS).setRanges([r.getRange("A17:D400")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($F17<>"",ISEVEN(ROW()))')
    .setBackground(GRIS).setRanges([r.getRange("F17:I400")]).build()]);
  r.setColumnWidth(1, 230); [2, 3, 4].forEach(c => r.setColumnWidth(c, 120));
  r.setColumnWidth(5, 30); r.setColumnWidth(6, 150); [7, 8, 9].forEach(c => r.setColumnWidth(c, 110));
  r.setFrozenRows(2);
}
