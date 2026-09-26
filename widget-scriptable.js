// ===== WIDGETS DE MIS FINANZAS · SCRIPTABLE =====
//
// Un solo script para todos los widgets. En cada widget, en "Parameter",
// escribe cuál quieres ver (da igual mayúsculas o acentos):
//
//   gasto              chico    · botón de nuevo gasto
//   botones            mediano  · gasto / ingreso / transferir
//   credito            mediano  · cuadritos de color por tarjeta
//   credito chico      chico    · lista con barritas
//   me deben           chico    · solo lo que falta
//   me deben cortes    chico    · con desglose por corte
//   todo               grande   · todo junto
//   todo mediano       mediano  · compacto
//
// ÚNICO DATO QUE TIENES QUE LLENAR: tu código de sincronización (el mismo de la app).
const CODE = "PON_AQUI_TU_CODIGO";

const AJUSTE = 0;   // si algo se corta, bájalo (-10). si sobra hueco, súbelo (10).

// ---------- no tocar de aquí para abajo ----------
const APP_URL = "https://vmmterminus-star.github.io/finanzas/";
const SUPA_URL = "https://ipfioanmaxqgyoxdoyhe.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZmlvYW5tYXhxZ3lveGRveWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NzY4MDIsImV4cCI6MjA5ODM1MjgwMn0.m6gV62i87_vR6nwZroxbB8Q4IAYCIqX9uVvfOT95AfI";

// ---------- contexto ----------
const FAM = config.runsInWidget ? config.widgetFamily : "large";
const CHICO = FAM === "small";
const GRANDE = FAM === "large";
const PARAM = (args.widgetParameter || "todo").toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

const PAD_T = 13, PAD_B = 11, PAD_X = 14;
const ANCHO = Math.min(Device.screenSize().width, 430) * 0.84;
const ALTO = (GRANDE ? 345 : 155) + AJUSTE;

// ---------- colores (paleta de la app) ----------
const FONDO = Color.dynamic(new Color("#FDF7F0"), new Color("#2A231C"));
const TXT = Color.dynamic(new Color("#3D3326"), new Color("#F5EDE2"));
const TXT2 = Color.dynamic(new Color("#8A7E6E"), new Color("#C9BCA9"));
const USADO = new Color("#E7917F");
const LIBRE = new Color("#9DB77E");
const PISTA = Color.dynamic(new Color("#F0E8DB"), new Color("#4A3F33"));
const MD_BG = new Color("#FCE0D2"), MD_TX = new Color("#7a4a32"), MD_TX2 = new Color("#5a3720");
const BOTONES = [
  { n: "Gasto", s: "−", t: "gasto", bg: "#F3D3C5", tx: "#7a4a32" },
  { n: "Ingreso", s: "+", t: "ingreso", bg: "#DCE8C8", tx: "#3f5a2a" },
  { n: "Transferir", s: "⇄", t: "transfer", bg: "#FBEFC9", tx: "#6a5220" }
];

// ---------- tipografía: Outfit ----------
// Si Outfit no está instalada, el iPhone usa su fuente normal sin avisar.
const F = (peso, s) => new Font("Outfit-" + peso, s);
const f_tit = F("SemiBold", 12);
const f_txt = F("Regular", 11.5);
const f_txtB = F("Bold", 11.5);
const f_mini = F("Regular", 9);
const f_num = F("Bold", 15);
const f_big = F("Bold", 26);
const f_btn = F("SemiBold", 11);
const f_sim = F("SemiBold", 22);

// ---------- datos ----------
const fm = FileManager.local();
const CACHE = fm.joinPath(fm.documentsDirectory(), "finanzas_widget.json");

async function traer() {
  const url = SUPA_URL + "/rest/v1/finanzas_sync?code=eq." +
    encodeURIComponent(CODE + "__widget") + "&select=data,updated_at";
  const r = new Request(url);
  r.headers = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY };
  r.timeoutInterval = 12;
  const j = await r.loadJSON();
  if (!j || !j.length) throw new Error("sin datos");
  const d = j[0].data;
  const blob = typeof d === "string" ? JSON.parse(d) : d;
  blob._ts = j[0].updated_at || blob.ts;
  fm.writeString(CACHE, JSON.stringify(blob));
  return blob;
}

async function datos() {
  try { return await traer(); }
  catch (e) {
    if (fm.fileExists(CACHE)) {
      const b = JSON.parse(fm.readString(CACHE));
      b._viejo = true;
      return b;
    }
    return null;
  }
}

// ---------- utilidades ----------
function dinero(n) {
  const v = Math.round(+n || 0);
  return (v < 0 ? "-$" : "$") + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function hace(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "ahorita";
  if (m < 60) return "hace " + m + " min";
  const h = Math.floor(m / 60);
  if (h < 24) return "hace " + h + " h";
  return "hace " + Math.floor(h / 24) + " d";
}
function texto(cont, t, font, color) {
  const x = cont.addText(t);
  x.font = font; x.textColor = color || TXT; x.lineLimit = 1;
  return x;
}
function nombreCorto(n) { return CHICO && n === "Plata Card" ? "Plata" : n; }

// barrita: salmón = usado, verde = lo que queda
function barra(cont, ancho, disp, lim, pista) {
  const b = cont.addStack();
  b.size = new Size(ancho, 5);
  b.cornerRadius = 2.5;
  b.backgroundColor = pista || PISTA;
  if (!lim) return;
  const usado = Math.max(0, Math.min(1, (lim - disp) / lim));
  const wu = Math.round(ancho * usado);
  if (wu > 0) { const u = b.addStack(); u.size = new Size(wu, 5); u.backgroundColor = USADO; }
  if (ancho - wu > 0) { const l = b.addStack(); l.size = new Size(ancho - wu, 5); l.backgroundColor = LIBRE; }
}

function pie(w, blob) {
  const f = w.addStack();
  f.addSpacer();
  texto(f, hace(blob._ts), f_mini, blob._viejo ? new Color("#CC6F52") : TXT2);
}

function vacio(w, msg) {
  w.addSpacer();
  const t = texto(w, msg, f_txt, TXT2);
  t.centerAlignText();
  w.addSpacer();
}

// ---------- piezas ----------
function cuadritos(cont, blob, anchoTotal, conLimite) {
  const cards = blob.cards || [];
  const gap = 6, n = Math.max(1, cards.length);
  const wTile = Math.floor((anchoTotal - gap * (n - 1)) / n);
  const fila = cont.addStack();
  cards.forEach((c, i) => {
    if (i) fila.addSpacer(gap);
    const tx = new Color(c.tx);
    const t = fila.addStack();
    t.layoutVertically();
    t.size = new Size(wTile, 0);
    t.backgroundColor = new Color(c.bg);
    t.cornerRadius = 12;
    t.setPadding(8, 8, 8, 8);
    texto(t, c.n, f_mini, tx);
    t.addSpacer(1);
    if (!c.lim) { texto(t, "Pon tu límite", f_btn, tx); return; }
    texto(t, dinero(c.disp), f_num, new Color("#3D3326"));
    t.addSpacer(4);
    barra(t, wTile - 16, c.disp, c.lim, new Color("#FFFFFF", 0.55));
    if (conLimite) { t.addSpacer(3); texto(t, "de " + dinero(c.lim), f_mini, tx); }
  });
}

function listaCredito(cont, blob, ancho) {
  (blob.cards || []).forEach((c, i) => {
    if (i) cont.addSpacer(6);
    const f = cont.addStack();
    f.size = new Size(ancho, 0);
    texto(f, nombreCorto(c.n), f_txt);
    f.addSpacer();
    texto(f, c.lim ? dinero(c.disp) : "sin límite", c.lim ? f_txtB : f_mini, c.lim ? TXT : TXT2);
    if (c.lim) { cont.addSpacer(3); barra(cont, ancho, c.disp, c.lim); }
  });
}

function boton(cont, b, ancho, alto) {
  const s = cont.addStack();
  s.layoutVertically();
  s.size = new Size(ancho, alto);
  s.backgroundColor = new Color(b.bg);
  s.cornerRadius = 14;
  s.url = APP_URL + "?nuevo=" + b.t;
  s.centerAlignContent();
  const tx = new Color(b.tx);
  const r1 = s.addStack(); r1.addSpacer(); texto(r1, b.s, f_sim, tx); r1.addSpacer();
  const r2 = s.addStack(); r2.addSpacer(); texto(r2, b.n, f_btn, tx); r2.addSpacer();
}

function filaBotones(cont, ancho, alto) {
  const gap = 8, wb = Math.floor((ancho - gap * 2) / 3);
  const f = cont.addStack();
  BOTONES.forEach((b, i) => { if (i) f.addSpacer(gap); boton(f, b, wb, alto); });
}

function franjaMeDeben(cont, blob, ancho) {
  const md = blob.md || {};
  const s = cont.addStack();
  s.size = new Size(ancho, 0);
  s.backgroundColor = MD_BG;
  s.cornerRadius = 12;
  s.setPadding(9, 10, 9, 10);
  s.centerAlignContent();
  const iz = s.addStack(); iz.layoutVertically();
  texto(iz, "↩ Me deben", f_btn, MD_TX);
  const det = [md.cerrado > 0 ? "cerrado " + dinero(md.cerrado) : "", md.corriendo > 0 ? "corriendo " + dinero(md.corriendo) : ""].filter(Boolean).join(" · ");
  if (det) texto(iz, det, f_mini, MD_TX);
  s.addSpacer();
  texto(s, dinero(md.falta), F("Bold", 17), MD_TX2);
}

// ---------- vistas ----------
function vGasto(w) {
  w.url = APP_URL + "?nuevo=gasto";
  w.addSpacer();
  const c = w.addStack(); c.addSpacer();
  const b = c.addStack();
  b.size = new Size(58, 58); b.cornerRadius = 29;
  b.backgroundColor = new Color("#3D3326"); b.centerAlignContent();
  texto(b, "+", F("Regular", 32), new Color("#FFFFFF"));
  c.addSpacer();
  w.addSpacer(6);
  const r = w.addStack(); r.addSpacer(); texto(r, "Nuevo gasto", f_tit); r.addSpacer();
  const r2 = w.addStack(); r2.addSpacer(); texto(r2, "Klar por default", f_mini, TXT2); r2.addSpacer();
  w.addSpacer();
}

function vBotones(w) {
  if (CHICO) return vGasto(w);
  filaBotones(w, ANCHO - PAD_X * 2, ALTO - PAD_T - PAD_B);
}

function vCredito(w, blob) {
  texto(w, "Crédito disponible", f_tit, TXT2);
  w.addSpacer(6);
  cuadritos(w, blob, ANCHO - PAD_X * 2, true);
  w.addSpacer();
  pie(w, blob);
}

function vCreditoChico(w, blob) {
  texto(w, "Crédito disp.", f_tit, TXT2);
  w.addSpacer(7);
  listaCredito(w, blob, (CHICO ? 155 : ANCHO) - PAD_X * 2);
  w.addSpacer();
  pie(w, blob);
}

function vMeDeben(w, blob, cortes) {
  const md = blob.md || {};
  w.backgroundColor = MD_BG;
  texto(w, "↩ Me deben", f_tit, MD_TX);
  w.addSpacer();
  texto(w, dinero(md.falta), f_big, MD_TX2);
  if (cortes) {
    w.addSpacer(4);
    const a = w.addStack(); texto(a, "corte cerrado ", f_mini, MD_TX); texto(a, dinero(md.cerrado), F("Bold", 9), MD_TX);
    const b = w.addStack(); texto(b, "va corriendo ", f_mini, MD_TX); texto(b, dinero(md.corriendo), F("Bold", 9), MD_TX);
  } else {
    texto(w, md.falta > 0 ? "te falta que te repongan" : "no te deben nada", f_mini, MD_TX);
  }
  w.addSpacer();
  const f = w.addStack(); texto(f, hace(blob._ts), f_mini, blob._viejo ? new Color("#CC6F52") : MD_TX);
}

function vTodo(w, blob) {
  if (!GRANDE) return vTodoMediano(w, blob);
  const ancho = ANCHO - PAD_X * 2;
  const h = w.addStack(); h.centerAlignContent();
  texto(h, "Mis finanzas", f_tit); h.addSpacer();
  texto(h, hace(blob._ts), f_mini, blob._viejo ? new Color("#CC6F52") : TXT2);
  w.addSpacer(8);
  texto(w, "Crédito disponible", f_mini, TXT2);
  w.addSpacer(4);
  cuadritos(w, blob, ancho, false);
  w.addSpacer(8);
  franjaMeDeben(w, blob, ancho);
  w.addSpacer(8);
  filaBotones(w, ancho, 112 + AJUSTE);
  w.addSpacer();
}

function vTodoMediano(w, blob) {
  const ancho = ANCHO - PAD_X * 2, wBtn = 62, gap = 10;
  const fila = w.addStack();
  const iz = fila.addStack(); iz.layoutVertically();
  const wIz = ancho - wBtn - gap;
  iz.size = new Size(wIz, ALTO - PAD_T - PAD_B);
  texto(iz, "Crédito disp.", f_mini, TXT2);
  iz.addSpacer(4);
  (blob.cards || []).forEach(c => {
    const r = iz.addStack(); r.size = new Size(wIz, 0);
    texto(r, c.n, f_txt); r.addSpacer();
    texto(r, c.lim ? dinero(c.disp) : "sin límite", c.lim ? f_txtB : f_mini, c.lim ? TXT : TXT2);
    iz.addSpacer(3);
  });
  iz.addSpacer();
  const md = iz.addStack(); md.size = new Size(wIz, 0);
  md.backgroundColor = MD_BG; md.cornerRadius = 10; md.setPadding(5, 8, 5, 8);
  texto(md, "↩ Me deben", f_txt, MD_TX); md.addSpacer();
  texto(md, dinero((blob.md || {}).falta), f_txtB, MD_TX);
  fila.addSpacer(gap);
  const b = fila.addStack(); b.layoutVertically();
  b.size = new Size(wBtn, ALTO - PAD_T - PAD_B);
  b.backgroundColor = new Color("#3D3326"); b.cornerRadius = 14;
  b.url = APP_URL + "?nuevo=gasto";
  b.addSpacer();
  const r1 = b.addStack(); r1.addSpacer(); texto(r1, "+", F("Regular", 28), new Color("#FFFFFF")); r1.addSpacer();
  const r2 = b.addStack(); r2.addSpacer(); texto(r2, "Agregar", F("SemiBold", 10), new Color("#FFFFFF")); r2.addSpacer();
  b.addSpacer();
}

// ---------- armado ----------
async function build() {
  const w = new ListWidget();
  w.backgroundColor = FONDO;
  w.setPadding(PAD_T, PAD_X, PAD_B, PAD_X);
  w.url = APP_URL;
  w.refreshAfterDate = new Date(Date.now() + 20 * 60 * 1000);

  if (PARAM === "gasto") { vGasto(w); return w; }
  if (PARAM === "botones") { vBotones(w); return w; }

  if (CODE === "PON_AQUI_TU_CODIGO") { vacio(w, "Pon tu código arriba del script"); return w; }
  const blob = await datos();
  if (!blob) { vacio(w, "Sin conexión"); return w; }

  if (PARAM === "credito chico") vCreditoChico(w, blob);
  else if (PARAM === "credito") CHICO ? vCreditoChico(w, blob) : vCredito(w, blob);
  else if (PARAM === "me deben cortes") vMeDeben(w, blob, true);
  else if (PARAM === "me deben") vMeDeben(w, blob, false);
  else if (PARAM === "todo mediano") vTodoMediano(w, blob);
  else if (PARAM === "todo") vTodo(w, blob);
  else vacio(w, "No conozco “" + PARAM + "”");
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentLarge();
Script.complete();
