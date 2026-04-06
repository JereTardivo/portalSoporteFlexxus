"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";

interface Tarea {
  id: string;
  nombre: string;
  premium: string;
  basico: string;
  porCasos: string;
  sinSoporte: string;
  orderAdvanced: string;
  categoriaEspecial: string | null;
}

interface Precio {
  id: string;
  categoria: string;
  subtipo: string | null;
  concepto: string;
  label: string;
  valor: number;
}

type PresupuestoResult =
  | { tipo: "no_aplica" }
  | { tipo: "cotizacion" }
  | { tipo: "valor_fijo" }
  | { tipo: "calculado"; lineas: { desc: string; valor: number }[]; unitario: number };

interface CartItem {
  id: string;
  tarea: Tarea;
  soporte: SoporteKey;
  soporteLabel: string;
  modalidad: string;
  modalidadLabel: string;
  cantidad: number;
  resultado: PresupuestoResult;
}

const SOPORTE_OPTIONS = [
  { key: "premium",       label: "Premium",        priceCategoria: "premium_basico" },
  { key: "basico",        label: "Básico",          priceCategoria: "premium_basico" },
  { key: "porCasos",      label: "Por Casos",       priceCategoria: "premium_basico" },
  { key: "orderAdvanced", label: "Order Advanced",  priceCategoria: "premium_basico" },
  { key: "sinSoporte",    label: "Sin Soporte",     priceCategoria: "sin_soporte" },
] as const;

type SoporteKey = (typeof SOPORTE_OPTIONS)[number]["key"];

const MODALIDAD_OPTIONS = [
  { key: "solucion_remota",  label: "Solución Remota",   icon: "🖥️" },
  { key: "visita_empresa",   label: "Visita a Empresa",  icon: "🏢" },
];

function pesos(n: number) {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseHours(val: string): number | null {
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
}

function calcularResultado(
  tarea: Tarea,
  soporte: SoporteKey,
  modalidad: string,
  valorHora: number,
  primerHora: number,
  horasRestantes: number,
  allPrecios: Precio[]
): PresupuestoResult {
  const raw = tarea[soporte as keyof Tarea] as string;
  if (!raw || raw === "-") {
    if (tarea.categoriaEspecial) {
      const p = allPrecios.find(p => p.categoria === tarea.categoriaEspecial && p.subtipo === null);
      if (p) return { tipo: "calculado", lineas: [{ desc: p.label, valor: p.valor }], unitario: p.valor };
    }
    return { tipo: "no_aplica" };
  }
  if (raw === "COTIZACION") return { tipo: "cotizacion" };
  if (raw === "VALOR FIJO") {
    if (tarea.categoriaEspecial) {
      const p = allPrecios.find(p => p.categoria === tarea.categoriaEspecial && p.subtipo === null);
      if (p) return { tipo: "calculado", lineas: [{ desc: p.label, valor: p.valor }], unitario: p.valor };
    }
    return { tipo: "valor_fijo" };
  }
  const horas = parseHours(raw);
  if (horas === null) return { tipo: "no_aplica" };

  if (modalidad === "solucion_remota") {
    return {
      tipo: "calculado",
      lineas: [{ desc: `${horas}h × ${pesos(valorHora)}/h`, valor: horas * valorHora }],
      unitario: horas * valorHora,
    };
  }
  if (horas <= 1) {
    return { tipo: "calculado", lineas: [{ desc: "Primer hora", valor: primerHora }], unitario: primerHora };
  }
  const restantes = horas - 1;
  const costoR = restantes * horasRestantes;
  return {
    tipo: "calculado",
    lineas: [
      { desc: "Primer hora", valor: primerHora },
      { desc: `${restantes}h restante${restantes !== 1 ? "s" : ""} × ${pesos(horasRestantes)}/h`, valor: costoR },
    ],
    unitario: primerHora + costoR,
  };
}

export default function PresupuestadorPage() {
  const { data: session } = useSession();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTareaId, setSelectedTareaId] = useState<string>("");
  const [soporte, setSoporte] = useState<SoporteKey>("premium");
  const [modalidad, setModalidad] = useState<string>("solucion_remota");
  const [search, setSearch] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [infraTipo, setInfraTipo] = useState<"datacenter" | "servidor_propio" | null>(null);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [cotizacionMode, setCotizacionMode] = useState<"horas" | "monto">("horas");
  const [cotizacionHoras, setCotizacionHoras] = useState<string>("");
  const [cotizacionMonto, setCotizacionMonto] = useState<string>("");

  // Client data
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [obsInput, setObsInput] = useState("");

  // Cart
  const [items, setItems] = useState<CartItem[]>([]);

  function handleCuitChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "-" + digits.slice(2);
    if (digits.length > 10) formatted = formatted.slice(0, 11) + "-" + digits.slice(10);
    setCuit(formatted);
  }

  function addToCart() {
    if (!tarea) return;
    setItems(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      tarea,
      soporte,
      soporteLabel: soporteOption.label,
      modalidad,
      modalidadLabel: MODALIDAD_OPTIONS.find(m => m.key === modalidad)?.label ?? "",
      cantidad: Math.max(1, cantidad),
      resultado: presupuesto,
    }]);
  }

  function removeFromCart(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItemCantidad(id: string, newCantidad: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(1, newCantidad) } : i));
  }

  const grandTotal = items.reduce((sum, item) => {
    if (item.resultado.tipo === "calculado") return sum + item.resultado.unitario * item.cantidad;
    return sum;
  }, 0);

  useEffect(() => {
    setInfraTipo(null);
    setSelectedStack(null);
    setCotizacionHoras("");
    setCotizacionMonto("");
  }, [selectedTareaId, soporte]);

  useEffect(() => {
    Promise.all([
      fetch("/api/tareas").then(r => r.json()),
      fetch("/api/precios").then(r => r.json()),
    ]).then(([t, p]) => {
      setTareas(t);
      setPrecios(p);
      if (t.length > 0) setSelectedTareaId(t[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const soporteOption = SOPORTE_OPTIONS.find(s => s.key === soporte)!;
  const tarea = tareas.find(t => t.id === selectedTareaId);

  const horasRaw = tarea ? tarea[soporte as keyof Tarea] as string : "-";
  const horas = parseHours(horasRaw);

  const preciosCategoria = useMemo(() =>
    precios.filter(p => p.categoria === soporteOption.priceCategoria && p.subtipo === modalidad),
    [precios, soporteOption, modalidad]
  );

  const primerHora = preciosCategoria.find(p => p.concepto === "primer_hora")?.valor ?? 0;
  const horasRestantes = preciosCategoria.find(p => p.concepto === "horas_restantes")?.valor ?? 0;
  const valorHora = preciosCategoria.find(p => p.concepto === "valor_hora")?.valor ?? 0;

  const isLecturaBD = tarea?.nombre.toLowerCase().includes("usuario de lectura") ?? false;
  const firebirdStacks = precios.filter(p => p.categoria === "firebird_stack");
  const isCotizacion = tarea ? (tarea[soporte as keyof Tarea] as string) === "COTIZACION" : false;

  function calcularDesdeHorasCotizacion(h: number): PresupuestoResult {
    if (modalidad === "solucion_remota") {
      return {
        tipo: "calculado",
        lineas: [{ desc: `${h}h × ${pesos(valorHora)}/h`, valor: h * valorHora }],
        unitario: h * valorHora,
      };
    }
    if (h <= 1) {
      return { tipo: "calculado", lineas: [{ desc: "Primer hora", valor: primerHora }], unitario: primerHora };
    }
    const restantes = h - 1;
    const costoR = restantes * horasRestantes;
    return {
      tipo: "calculado",
      lineas: [
        { desc: "Primer hora", valor: primerHora },
        { desc: `${restantes}h restante${restantes !== 1 ? "s" : ""} × ${pesos(horasRestantes)}/h`, valor: costoR },
      ],
      unitario: primerHora + costoR,
    };
  }

  const presupuesto = useMemo<PresupuestoResult>(() => {
    if (!tarea) return { tipo: "no_aplica" };
    if (isLecturaBD && infraTipo === "datacenter") {
      if (!selectedStack) return { tipo: "no_aplica" };
      const stackP = firebirdStacks.find(s => s.concepto === selectedStack);
      if (!stackP) return { tipo: "no_aplica" };
      const base = calcularResultado(tarea, soporte, modalidad, valorHora, primerHora, horasRestantes, precios);
      if (base.tipo === "calculado") {
        return {
          tipo: "calculado",
          lineas: [
            ...base.lineas,
            { desc: `Stack ${stackP.concepto.toUpperCase()} — Datacenter (mensual)`, valor: stackP.valor },
          ],
          unitario: base.unitario + stackP.valor,
        };
      }
      return {
        tipo: "calculado",
        lineas: [{ desc: `Stack ${stackP.concepto.toUpperCase()} — Datacenter (mensual)`, valor: stackP.valor }],
        unitario: stackP.valor,
      };
    }
    const base = calcularResultado(tarea, soporte, modalidad, valorHora, primerHora, horasRestantes, precios);
    if (base.tipo === "cotizacion") {
      if (cotizacionMode === "monto") {
        const v = parseFloat(cotizacionMonto.replace(",", "."));
        if (!isNaN(v) && v > 0) {
          return { tipo: "calculado", lineas: [{ desc: tarea.nombre, valor: v }], unitario: v };
        }
      } else {
        const h = parseFloat(cotizacionHoras.replace(",", "."));
        if (!isNaN(h) && h > 0) {
          return calcularDesdeHorasCotizacion(h);
        }
      }
    }
    return base;
  }, [tarea, soporte, modalidad, valorHora, primerHora, horasRestantes, precios, isLecturaBD, infraTipo, selectedStack, firebirdStacks, cotizacionMode, cotizacionHoras, cotizacionMonto]);

  const filteredTareas = tareas.filter(t =>
    !search || t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  function exportPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const ML = 15;
    const MR = 15;
    const CW = W - ML - MR;
    let y = 0;

    const now = new Date();
    const longDate = now.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    const shortDate = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

    // ── Header ───────────────────────────────────────────────────────────────
    const logoW = 46;
    const headerH = 25;
    doc.setFillColor(65, 65, 65);
    doc.rect(0, 0, logoW, headerH, "F");
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    const wFle = doc.getTextWidth("fle");
    const wXx  = doc.getTextWidth("xx");
    const wUs  = doc.getTextWidth("us");
    const totalW = wFle + wXx + wUs;
    const startX = (logoW - totalW) / 2;
    doc.setTextColor(255, 255, 255);
    doc.text("fle", startX, 12);
    doc.setTextColor(210, 30, 30);
    doc.text("xx", startX + wFle, 12);
    doc.setTextColor(255, 255, 255);
    doc.text("us", startX + wFle + wXx, 12);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.text("Crecer sin L\u00edmites", logoW / 2, 18, { align: "center" });

    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.4);
    doc.line(logoW + 5, 4, logoW + 5, headerH - 4);

    doc.setTextColor(55, 55, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Humberto Primo 843 - 1\u00ba Piso", W - MR, 9, { align: "right" });
    doc.text("C\u00f3rdoba - Argentina", W - MR, 14.5, { align: "right" });
    doc.text("Tel (0351) 5685000", W - MR, 20, { align: "right" });
    y = headerH + 8;

    // ── Date ─────────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text(longDate, W - MR, y, { align: "right" });
    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(ML, y, W - MR, y);
    y += 7;

    // ── Title ─────────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 15);
    const titleLines = doc.splitTextToSize(`Presupuesto - ${tarea?.nombre ?? "Servicio"}`, CW);
    doc.text(titleLines, ML, y);
    y += titleLines.length * 6.5 + 5;

    // ── Client info ───────────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setTextColor(15, 15, 15);

    doc.setFont("helvetica", "bold");
    doc.text("Cliente: ", ML, y);
    const clW = doc.getTextWidth("Cliente: ");
    doc.setFont("helvetica", "normal");
    const clientVal = razonSocial || "\u2014";
    doc.text(clientVal, ML + clW, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(ML + clW, y + 0.8, ML + clW + doc.getTextWidth(clientVal), y + 0.8);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("CUIT: ", ML, y);
    const cuW = doc.getTextWidth("CUIT: ");
    doc.setFont("helvetica", "normal");
    doc.text(cuit || "\u2014", ML + cuW, y);
    y += 12;

    // ── Dark section bar helper ───────────────────────────────────────────────
    const drawBar = (num: number | null, title: string, amount?: string) => {
      doc.setFillColor(64, 64, 64);
      doc.rect(ML, y, CW, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(num !== null ? `${num}. ${title}` : title, ML + 4, y + 6.2);
      if (amount) doc.text(amount, ML + CW - 4, y + 6.2, { align: "right" });
      y += 9;
    };

    const bulletX = ML + 5;
    const textX = ML + 9;
    const textW = CW - 16;

    // ── Items ─────────────────────────────────────────────────────────────────
    const itemsToRender = items.length > 0 ? items : [{
      id: "single",
      tarea: tarea ?? { id: "", nombre: "Servicio", premium: "-", basico: "-", porCasos: "-", sinSoporte: "-", orderAdvanced: "-" },
      soporteLabel: soporteOption.label,
      modalidadLabel: MODALIDAD_OPTIONS.find(m => m.key === modalidad)?.label ?? "",
      cantidad: 1,
      resultado: presupuesto,
    } as CartItem];

    itemsToRender.forEach((item, idx) => {
      const itemTotal = item.resultado.tipo === "calculado" ? item.resultado.unitario * item.cantidad : null;
      const barAmount = itemTotal !== null ? pesos(itemTotal) : "";
      drawBar(idx + 1, `${item.tarea.nombre} (${item.soporteLabel} - ${item.modalidadLabel})`, barAmount);

      const boxStartY = y;
      let cy = y + 5;
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      if (item.resultado.tipo === "calculado") {
        for (const linea of item.resultado.lineas) {
          doc.setFont("helvetica", "normal");
          doc.text("\u2022", bulletX, cy);
          doc.text(linea.desc, textX, cy);
          doc.setFont("helvetica", "bold");
          doc.text(pesos(linea.valor), ML + CW - 5, cy, { align: "right" });
          cy += 6;
        }
        if (item.cantidad > 1) {
          cy += 1;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(`Cantidad: ${item.cantidad} × ${pesos(item.resultado.unitario)} c/u`, textX, cy);
          cy += 5.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(20, 20, 20);
          doc.text("Subtotal:", textX, cy);
          doc.text(pesos(item.resultado.unitario * item.cantidad), ML + CW - 5, cy, { align: "right" });
          cy += 6;
        } else {
          cy += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(20, 20, 20);
          doc.text("Total:", textX, cy);
          doc.text(pesos(item.resultado.unitario), ML + CW - 5, cy, { align: "right" });
          cy += 6;
        }
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text("\u2022", bulletX, cy);
        const msg =
          item.resultado.tipo === "cotizacion" ? "Esta tarea requiere cotizaci\u00f3n caso por caso seg\u00fan el alcance del trabajo." :
          item.resultado.tipo === "valor_fijo" ? "Esta tarea tiene precio fijo establecido. Consultar tabla de precios vigente." :
          "No aplica para el tipo de soporte seleccionado.";
        const msgLines = doc.splitTextToSize(msg, textW);
        doc.text(msgLines, textX, cy);
        cy += msgLines.length * 5.5;
      }

      cy += 5;
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.3);
      doc.rect(ML, boxStartY, CW, cy - boxStartY, "S");
      y = cy + 5;
    });

    // ── Grand total (only when multiple items or grandTotal > 0) ─────────────
    const pdfGrandTotal = itemsToRender.reduce((s, i) =>
      i.resultado.tipo === "calculado" ? s + i.resultado.unitario * i.cantidad : s, 0);
    if (itemsToRender.length > 1 && pdfGrandTotal > 0) {
      y += 2;
      doc.setFillColor(230, 230, 230);
      doc.rect(ML, y, CW, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text("TOTAL GENERAL", ML + 4, y + 7);
      doc.text(pesos(pdfGrandTotal), ML + CW - 4, y + 7, { align: "right" });
      y += 16;
    }

    if (obsInput.trim()) {
      const obsLines = doc.splitTextToSize(obsInput.trim(), textW);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(obsLines, ML + 2, y);
      y += obsLines.length * 5 + 4;
    }

    // ── Section: Condiciones Comerciales ──────────────────────────────────────
    y += 2;
    const condSecNum = itemsToRender.length + 1;
    drawBar(condSecNum, "Condiciones Comerciales");

    const box2Y = y;
    let cy = y + 5;
    const conditions = [
      "Los precios cotizados NO incluyen el IVA (21%).",
      "Los precios son orientativos y est\u00e1n sujetos a actualizaci\u00f3n sin previo aviso.",
      "Vigencia de esta propuesta: 10 d\u00edas.",
    ];
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    for (const cond of conditions) {
      doc.setFont("helvetica", "normal");
      doc.text("\u2022", bulletX, cy);
      const cLines = doc.splitTextToSize(cond, textW);
      doc.text(cLines, textX, cy);
      cy += cLines.length * 5.5 + 1.5;
    }
    cy += 4;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.rect(ML, box2Y, CW, cy - box2Y, "S");

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = 285;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(ML, footerY, W - MR, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("www.flexxus.com.ar", W / 2, footerY + 5.5, { align: "center" });

    const fileName = `Presupuesto_${(razonSocial || "cliente").replace(/\s+/g, "_")}_${shortDate.replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Presupuestador</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Calculá el costo de un servicio según la tarea, el tipo de soporte del cliente y la modalidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: selectors */}
        <div className="lg:col-span-3 space-y-4">

          {/* Client data */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Datos del cliente
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Razón Social / Empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Empresa S.A."
                  value={razonSocial}
                  onChange={e => setRazonSocial(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">CUIT</label>
                <input
                  type="text"
                  placeholder="XX-XXXXXXXX-X"
                  value={cuit}
                  onChange={e => handleCuitChange(e.target.value)}
                  maxLength={13}
                  inputMode="numeric"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Observaciones (opcional)</label>
              <textarea
                rows={2}
                placeholder="Notas adicionales para el presupuesto..."
                value={obsInput}
                onChange={e => setObsInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Tarea */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              1. Tarea a realizar
            </label>
            <div className="relative mb-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar tarea..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTareas.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTareaId(t.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedTareaId === t.id
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {t.nombre}
                </button>
              ))}
              {filteredTareas.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400 italic">Sin resultados</p>
              )}
            </div>
          </div>

          {/* Infraestructura — solo para USUARIO DE LECTURA BD */}
          {isLecturaBD && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 p-4 shadow-sm">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                2. Infraestructura del cliente
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(["datacenter", "servidor_propio"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setInfraTipo(opt); setSelectedStack(null); }}
                    className={`py-2.5 px-4 rounded-full border-2 text-sm font-semibold transition-all ${
                      infraTipo === opt
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    }`}
                  >
                    {opt === "datacenter" ? "🖥 Datacenter" : "🏠 Servidor Propio"}
                  </button>
                ))}
              </div>
              {infraTipo === "datacenter" && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Seleccioná el stack de recursos:</p>
                  <div className="space-y-2">
                    {firebirdStacks.map(s => (
                      <button
                        key={s.concepto}
                        onClick={() => setSelectedStack(s.concepto)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          selectedStack === s.concepto
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                            : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.concepto.toUpperCase()}</span>
                          <span className="font-bold text-sm text-indigo-700 dark:text-indigo-400">{pesos(s.valor)}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{s.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {infraTipo === "servidor_propio" && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Con servidor propio se calcula por horas según tipo de soporte y modalidad.
                </p>
              )}
              {infraTipo === "datacenter" && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-800">
                    <strong>Costo mensual:</strong> este valor se añadirá a la facturación mensual correspondiente de la empresa.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tipo de soporte */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              2. Tipo de soporte del cliente
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOPORTE_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSoporte(s.key)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    soporte === s.key
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modalidad */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              3. Modalidad de atención
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODALIDAD_OPTIONS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setModalidad(m.key)}
                  className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                    modalidad === m.key
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add to cart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              4. Agregar al presupuesto
            </label>
            {/* Live preview chip */}
            <div className={`rounded-lg p-3 mb-3 text-sm ${
              presupuesto.tipo === "calculado" ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" :
              presupuesto.tipo === "cotizacion" ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" :
              presupuesto.tipo === "valor_fijo" ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" :
              "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
            }`}>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{tarea?.nombre ?? "—"}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">{soporteOption.label} · {MODALIDAD_OPTIONS.find(m => m.key === modalidad)?.label}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {presupuesto.tipo === "calculado" ? pesos(presupuesto.unitario) :
                   presupuesto.tipo === "cotizacion" ? "Cotización" :
                   presupuesto.tipo === "valor_fijo" ? "Valor fijo" : "No aplica"}
                </span>
              </div>
            </div>

            {/* Cotización custom input */}
            {isCotizacion && (
              <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 p-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                  Cotización personalizada
                </p>
                {/* Mode toggle */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCotizacionMode("horas")}
                    className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-all ${
                      cotizacionMode === "horas"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-300"
                    }`}
                  >
                    Por horas
                  </button>
                  <button
                    onClick={() => setCotizacionMode("monto")}
                    className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-all ${
                      cotizacionMode === "monto"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-300"
                    }`}
                  >
                    Monto fijo
                  </button>
                </div>
                {/* Input */}
                {cotizacionMode === "horas" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="0"
                      value={cotizacionHoras}
                      onChange={e => setCotizacionHoras(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">horas</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">$</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={cotizacionMonto}
                      onChange={e => setCotizacionMonto(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
                {cotizacionMode === "horas" && cotizacionHoras && parseFloat(cotizacionHoras) > 0 && valorHora === 0 && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                    Sin precio/hora configurado para este tipo y modalidad.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm transition-colors"
                >−</button>
                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-sm font-semibold border-x border-slate-200 dark:border-slate-600 py-2 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={() => setCantidad(c => c + 1)}
                  className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm transition-colors"
                >+</button>
              </div>
              <button
                onClick={addToCart}
                disabled={!tarea}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Right: cart */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">

            {/* Cart items */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Presupuesto</p>
                {items.length > 0 && (
                  <button onClick={() => setItems([])} className="text-[11px] text-red-500 hover:text-red-700 font-medium">
                    Limpiar todo
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                  <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Agregá tareas desde el panel izquierdo
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.map(item => (
                    <div key={item.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{item.tarea.nombre}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.soporteLabel} · {item.modalidadLabel}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden">
                          <button onClick={() => updateItemCantidad(item.id, item.cantidad - 1)} className="px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold">−</button>
                          <span className="px-2 py-0.5 text-xs font-semibold border-x border-slate-200 dark:border-slate-600">{item.cantidad}</span>
                          <button onClick={() => updateItemCantidad(item.id, item.cantidad + 1)} className="px-2 py-0.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold">+</button>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {item.resultado.tipo === "calculado"
                            ? pesos(item.resultado.unitario * item.cantidad)
                            : item.resultado.tipo === "cotizacion" ? "Cotización"
                            : item.resultado.tipo === "valor_fijo" ? "Valor fijo"
                            : "No aplica"}
                        </span>
                      </div>
                      {item.cantidad > 1 && item.resultado.tipo === "calculado" && (
                        <p className="text-[10px] text-slate-400 mt-1">{item.cantidad} × {pesos(item.resultado.unitario)} c/u</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Grand total */}
              {items.length > 0 && grandTotal > 0 && (
                <div className="px-4 py-3 bg-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Total general</span>
                  <span className="text-lg font-bold text-white">{pesos(grandTotal)}</span>
                </div>
              )}
            </div>

            {/* Export */}
            <button
              onClick={exportPDF}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar PDF
            </button>

            {/* Price reference */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Referencia de precios</p>
              <div className="space-y-1.5">
                {preciosCategoria.map(p => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{p.label}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pesos(p.valor)}</span>
                  </div>
                ))}
                {preciosCategoria.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Sin precios configurados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
