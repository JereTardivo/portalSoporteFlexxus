"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

/* ─── Types ─────────────────────────────────────────────────── */
interface Llamada {
  id: string;
  clienteId: string;
  motivo: string;
  descripcion: string;
  ticket: string;
  modulo: string | null;
  agente: string;
  agenteId: string;
  mes: string;
  createdAt: string;
}

interface Cliente {
  id: string;
  empresa: string;
  equipo: string;
  llamadas: Llamada[];
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getMesId() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
}

function getMesLabel(mesId: string) {
  const [y, m] = mesId.split("-");
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(" de ", " ");
}

const EQUIPOS = ["Equipo 1", "Equipo 2", "Equipo 3", "Equipo 4", "Equipo 5", "Equipo Corralón"];
const MODULOS = [
  "Archivos",
  "Ventas",
  "Compras",
  "Fondos",
  "Stock",
  "Informes",
  "Configuración",
  "Usuarios",
  "RRHH",
  "RMA",
  "Producción",
  "Factura Electrónica",
  "Terminales POS",
  "Consulta otra área de Flexxus",
];
const MAX_LLAMADAS = 5;
const mesActualId = getMesId();

/* ─── Toast ──────────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: "ok" | "err" | "info" }) {
  const bg = type === "ok" ? "bg-green-600" : type === "err" ? "bg-red-600" : "bg-blue-600";
  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-[100] flex items-center gap-2`}>
      {type === "ok" ? "✓" : type === "err" ? "✗" : "ℹ"} {msg}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function BasicosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState<"nombre" | "llamadas">("nombre");
  const [equipoFilter, setEquipoFilter] = useState("");

  // Modal estado
  const [modalCliente, setModalCliente] = useState<Cliente | null>(null);
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [modalExportOpen, setModalExportOpen] = useState(false);
  const [modalClearOpen, setModalClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Llamada form
  const [newLlamada, setNewLlamada] = useState({ motivo: "", descripcion: "", ticket: "", modulo: "" });
  const [newErrors, setNewErrors] = useState<Record<string, string>>({});
  const [savingLlamada, setSavingLlamada] = useState(false);

  // Edit llamada
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLlamada, setEditLlamada] = useState({ motivo: "", descripcion: "", ticket: "", modulo: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Add client form
  const [newEmpresa, setNewEmpresa] = useState("");
  const [newEquipo, setNewEquipo] = useState("");
  const [savingCliente, setSavingCliente] = useState(false);

  // Import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Export
  const [exportMes, setExportMes] = useState(mesActualId);
  const [exporting, setExporting] = useState(false);

  // Rename client
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);
  function showToast(msg: string, type: "ok" | "err" | "info" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  /* ── Load clientes ── */
  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isAdmin && equipoFilter) params.set("equipo", equipoFilter);
      const res = await fetch(`/api/basicos/clientes?${params}`);
      if (res.ok) setClientes(await res.json());
    } finally {
      setLoading(false);
    }
  }, [isAdmin, equipoFilter]);

  useEffect(() => {
    if (session) loadClientes();
  }, [session, loadClientes]);

  /* ── Derived data ── */
  const llamadasMesActual = (c: Cliente) =>
    c.llamadas.filter((l) => l.mes === mesActualId);

  const filtered = clientes
    .filter((c) => {
      if (!search) return true;
      return c.empresa.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (orden === "llamadas") {
        return llamadasMesActual(b).length - llamadasMesActual(a).length;
      }
      return a.empresa.localeCompare(b.empresa);
    });

  /* ── Available months for export (from all llamadas) ── */
  const allMeses = Array.from(new Set(clientes.flatMap((c) => c.llamadas.map((l) => l.mes)))).sort().reverse();

  /* ── Add llamada ── */
  async function submitLlamada() {
    if (!modalCliente) return;
    const errs: Record<string, string> = {};
    if (!newLlamada.motivo.trim() || newLlamada.motivo.trim().length > 50) errs.motivo = "Requerido, máx. 50 caracteres";
    if (!newLlamada.descripcion.trim() || newLlamada.descripcion.trim().length > 250) errs.descripcion = "Requerido, máx. 250 caracteres";
    if (!/^\d{6}$/.test(newLlamada.ticket)) errs.ticket = "Debe tener 6 dígitos numéricos";
    if (!newLlamada.modulo) errs.modulo = "Seleccioná un módulo";
    if (Object.keys(errs).length) { setNewErrors(errs); return; }
    setNewErrors({});
    setSavingLlamada(true);
    try {
      const res = await fetch("/api/basicos/llamadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: modalCliente.id, ...newLlamada }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "Error al guardar", "err");
        return;
      }
      const created: Llamada = await res.json();
      const updated = { ...modalCliente, llamadas: [...modalCliente.llamadas, created] };
      setModalCliente(updated);
      setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setNewLlamada({ motivo: "", descripcion: "", ticket: "", modulo: "" });
      showToast("Llamada registrada");
    } finally {
      setSavingLlamada(false);
    }
  }

  /* ── Edit llamada ── */
  async function submitEdit(llamadaId: string) {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/basicos/llamadas/${llamadaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editLlamada),
      });
      if (!res.ok) { showToast("Error al guardar edición", "err"); return; }
      const updated: Llamada = await res.json();
      if (!modalCliente) return;
      const nuevoCliente = {
        ...modalCliente,
        llamadas: modalCliente.llamadas.map((l) => (l.id === llamadaId ? updated : l)),
      };
      setModalCliente(nuevoCliente);
      setClientes((prev) => prev.map((c) => (c.id === nuevoCliente.id ? nuevoCliente : c)));
      setEditingId(null);
      showToast("Llamada actualizada");
    } finally {
      setSavingEdit(false);
    }
  }

  /* ── Delete llamada ── */
  async function deleteLlamada(llamadaId: string) {
    if (!confirm("¿Eliminar esta llamada?")) return;
    const res = await fetch(`/api/basicos/llamadas/${llamadaId}`, { method: "DELETE" });
    if (!res.ok) { showToast("Error al eliminar", "err"); return; }
    if (!modalCliente) return;
    const nuevoCliente = { ...modalCliente, llamadas: modalCliente.llamadas.filter((l) => l.id !== llamadaId) };
    setModalCliente(nuevoCliente);
    setClientes((prev) => prev.map((c) => (c.id === nuevoCliente.id ? nuevoCliente : c)));
    showToast("Llamada eliminada");
  }

  /* ── Add cliente ── */
  async function submitAddCliente() {
    if (!newEmpresa.trim() || !newEquipo) return;
    setSavingCliente(true);
    try {
      const res = await fetch("/api/basicos/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa: newEmpresa.trim(), equipo: newEquipo }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error ?? "Error", "err"); return; }
      const created: Cliente = await res.json();
      setClientes((prev) => [...prev, created].sort((a, b) => a.empresa.localeCompare(b.empresa)));
      setModalAddOpen(false);
      setNewEmpresa(""); setNewEquipo("");
      showToast("Cliente agregado");
    } finally {
      setSavingCliente(false);
    }
  }

  /* ── Rename cliente ── */
  async function submitRename(clienteId: string) {
    if (!renameValue.trim()) return;
    const res = await fetch(`/api/basicos/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresa: renameValue.trim() }),
    });
    if (!res.ok) { const d = await res.json(); showToast(d.error ?? "Error", "err"); return; }
    const updated: Cliente = await res.json();
    setClientes((prev) => prev.map((c) => (c.id === clienteId ? updated : c)));
    if (modalCliente?.id === clienteId) setModalCliente(updated);
    setRenamingId(null);
    showToast("Cliente renombrado");
  }

  /* ── Delete cliente ── */
  async function deleteCliente(clienteId: string, empresa: string) {
    if (!confirm(`¿Eliminar el cliente "${empresa}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/basicos/clientes/${clienteId}`, { method: "DELETE" });
    if (!res.ok) { showToast("Error al eliminar", "err"); return; }
    setClientes((prev) => prev.filter((c) => c.id !== clienteId));
    if (modalCliente?.id === clienteId) setModalCliente(null);
    showToast("Cliente eliminado");
  }

  /* ── Clear all clients ── */
  async function handleClearAll() {
    setClearing(true);
    try {
      const res = await fetch("/api/basicos/clientes", { method: "DELETE" });
      if (!res.ok) { showToast("Error al limpiar", "err"); return; }
      const d = await res.json();
      setClientes([]);
      setModalClearOpen(false);
      showToast(`${d.eliminados} cliente${d.eliminados !== 1 ? "s" : ""} eliminado${d.eliminados !== 1 ? "s" : ""}`, "info");
    } finally {
      setClearing(false);
    }
  }

  /* ── Import Excel ── */
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/basicos/import", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error al importar", "err"); return; }
      showToast(`Importado: ${d.agregadas} nuevos, ${d.actualizadas} actualizados`, "ok");
      setModalImportOpen(false);
      loadClientes();
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* ── Export Excel ── */
  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ mes: exportMes });
      const res = await fetch(`/api/basicos/export?${params}`);
      if (!res.ok) { showToast("Error al exportar", "err"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe_basicos_${exportMes}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setModalExportOpen(false);
      showToast("Informe descargado", "info");
    } finally {
      setExporting(false);
    }
  }

  /* ── Group historical llamadas by month ── */
  function getLlamadasPorMes(cliente: Cliente) {
    const map = new Map<string, Llamada[]>();
    for (const l of cliente.llamadas) {
      if (!map.has(l.mes)) map.set(l.mes, []);
      map.get(l.mes)!.push(l);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }

  /* ── Render ── */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Soporte Básico — Gestión de Llamadas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Clientes con soporte básico · Mes actual:{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {getMesLabel(mesActualId)}
            </span>
          </p>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setNewEmpresa(""); setNewEquipo(""); setModalAddOpen(true); }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo cliente
            </button>
            <button
              onClick={() => setModalImportOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar Excel
            </button>
            <button
              onClick={() => setModalClearOpen(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar todo
            </button>
            <button
              onClick={() => { setExportMes(mesActualId); setModalExportOpen(true); }}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar informe
            </button>
          </div>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filtrar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {isAdmin && (
          <select
            value={equipoFilter}
            onChange={(e) => setEquipoFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todos los equipos</option>
            {EQUIPOS.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        )}

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as "nombre" | "llamadas")}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="nombre">Ordenar por nombre</option>
          <option value="llamadas">Ordenar por llamadas</option>
        </select>

        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Cargando clientes...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {search ? "Sin resultados para la búsqueda" : isAdmin ? "No hay clientes. Importá un Excel o agrega uno manualmente." : "No hay clientes asignados a tu equipo."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cliente) => {
            const cnt = llamadasMesActual(cliente).length;
            const lleno = cnt >= MAX_LLAMADAS;
            return (
              <div
                key={cliente.id}
                onClick={() => { setModalCliente(cliente); setNewLlamada({ motivo: "", descripcion: "", ticket: "", modulo: "" }); setNewErrors({}); setEditingId(null); }}
                className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                  lleno
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:border-red-400"
                    : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:border-green-400"
                }`}
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm mb-1" title={cliente.empresa}>
                  {cliente.empresa}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{cliente.equipo}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: MAX_LLAMADAS }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 ${
                          i < cnt
                            ? lleno
                              ? "bg-red-500 border-red-500"
                              : "bg-green-500 border-green-500"
                            : "bg-transparent border-slate-300 dark:border-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    lleno
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                      : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  }`}>
                    {cnt}/{MAX_LLAMADAS}
                  </span>
                </div>
                {lleno && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-semibold">Límite alcanzado</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: detalle llamadas ── */}
      {modalCliente && (() => {
        const llamadasMes = llamadasMesActual(modalCliente);
        const lleno = llamadasMes.length >= MAX_LLAMADAS;
        const gruposMes = getLlamadasPorMes(modalCliente);
        const historial = gruposMes.filter(([m]) => m !== mesActualId);

        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setModalCliente(null); setEditingId(null); } }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-6 py-4 flex items-start justify-between gap-3 z-10">
                <div className="flex-1 min-w-0">
                  {renamingId === modalCliente.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitRename(modalCliente.id); if (e.key === "Escape") setRenamingId(null); }}
                        className="flex-1 px-2 py-1 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => submitRename(modalCliente.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg">✓</button>
                      <button onClick={() => setRenamingId(null)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight truncate">{modalCliente.empresa}</h2>
                      {isAdmin && (
                        <button
                          onClick={() => { setRenamingId(modalCliente.id); setRenameValue(modalCliente.empresa); }}
                          className="text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0"
                          title="Renombrar cliente"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{modalCliente.equipo}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => deleteCliente(modalCliente.id, modalCliente.empresa)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Eliminar cliente"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button onClick={() => { setModalCliente(null); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Mes actual */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {getMesLabel(mesActualId)}
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      lleno ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                    }`}>
                      {llamadasMes.length}/{MAX_LLAMADAS} llamadas
                    </span>
                  </div>

                  {llamadasMes.length === 0 && (
                    <p className="text-sm text-slate-400 italic py-2">Sin llamadas este mes</p>
                  )}

                  {/* Lista llamadas mes actual */}
                  <div className="space-y-3">
                    {llamadasMes.map((l, idx) => {
                      const isOwner = l.agenteId === session?.user?.id;
                      const canEdit = isAdmin || isOwner;
                      return (
                        <div key={l.id} className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                          {editingId === l.id ? (
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Módulo</label>
                                <select
                                  value={editLlamada.modulo}
                                  onChange={(e) => setEditLlamada({ ...editLlamada, modulo: e.target.value })}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Seleccionar módulo</option>
                                  {MODULOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Motivo</label>
                                <input
                                  value={editLlamada.motivo}
                                  onChange={(e) => setEditLlamada({ ...editLlamada, motivo: e.target.value })}
                                  maxLength={50}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Descripción</label>
                                <textarea
                                  value={editLlamada.descripcion}
                                  onChange={(e) => setEditLlamada({ ...editLlamada, descripcion: e.target.value })}
                                  maxLength={250}
                                  rows={2}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <p className={`text-[10px] text-right mt-0.5 ${editLlamada.descripcion.length >= 250 ? "text-red-400" : "text-slate-400"}`}>
                                  {editLlamada.descripcion.length}/250
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Ticket</label>
                                <input
                                  value={editLlamada.ticket}
                                  onChange={(e) => setEditLlamada({ ...editLlamada, ticket: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                                  maxLength={6}
                                  className="w-32 px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                                <button onClick={() => submitEdit(l.id)} disabled={savingEdit} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                                  {savingEdit ? "Guardando..." : "Guardar"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 rounded px-1.5 py-0.5">#{idx + 1}</span>
                                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{l.motivo}</span>
                                </div>
                                {canEdit && (
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => { setEditingId(l.id); setEditLlamada({ motivo: l.motivo, descripcion: l.descripcion, ticket: l.ticket, modulo: l.modulo ?? "" }); }}
                                      className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                      title="Editar"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    {isAdmin && (
                                      <button
                                        onClick={() => deleteLlamada(l.id)}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                        title="Eliminar"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 break-words">{l.descripcion}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {l.modulo && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                    {l.modulo}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <span>
                                  Ticket:{" "}
                                  <a
                                    href={`https://soporte.flexxus.com.ar/tickets/${l.ticket}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {l.ticket}
                                  </a>
                                </span>
                                <span>Agente: {l.agente}</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* New llamada form */}
                  {!lleno && (
                    <div className="mt-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Nueva llamada</p>
                      <div className="space-y-3">
                        <div>
                          <select
                            value={newLlamada.modulo}
                            onChange={(e) => setNewLlamada({ ...newLlamada, modulo: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${newErrors.modulo ? "border-red-400" : "border-slate-200 dark:border-slate-600"}`}
                          >
                            <option value="">Módulo del ERP...</option>
                            {MODULOS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          {newErrors.modulo && <p className="text-xs text-red-500 mt-0.5">{newErrors.modulo}</p>}
                        </div>
                        <div>
                          <input
                            placeholder="Motivo (máx. 50 caracteres)"
                            value={newLlamada.motivo}
                            maxLength={50}
                            onChange={(e) => setNewLlamada({ ...newLlamada, motivo: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${newErrors.motivo ? "border-red-400" : "border-slate-200 dark:border-slate-600"}`}
                          />
                          {newErrors.motivo && <p className="text-xs text-red-500 mt-0.5">{newErrors.motivo}</p>}
                        </div>
                        <div>
                          <textarea
                            placeholder="Descripción (máx. 250 caracteres)"
                            value={newLlamada.descripcion}
                            maxLength={250}
                            rows={2}
                            onChange={(e) => setNewLlamada({ ...newLlamada, descripcion: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${newErrors.descripcion ? "border-red-400" : "border-slate-200 dark:border-slate-600"}`}
                          />
                          <p className={`text-[10px] text-right mt-0.5 ${newLlamada.descripcion.length >= 250 ? "text-red-400" : "text-slate-400"}`}>
                            {newLlamada.descripcion.length}/250
                          </p>
                          {newErrors.descripcion && <p className="text-xs text-red-500">{newErrors.descripcion}</p>}
                        </div>
                        <div>
                          <input
                            placeholder="Ticket (6 dígitos)"
                            value={newLlamada.ticket}
                            maxLength={6}
                            onChange={(e) => setNewLlamada({ ...newLlamada, ticket: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                            className={`w-36 px-3 py-2 text-sm border rounded-lg dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${newErrors.ticket ? "border-red-400" : "border-slate-200 dark:border-slate-600"}`}
                          />
                          {newErrors.ticket && <p className="text-xs text-red-500 mt-0.5">{newErrors.ticket}</p>}
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={submitLlamada}
                            disabled={savingLlamada}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                          >
                            {savingLlamada ? "Guardando..." : "Registrar llamada"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {lleno && (
                    <div className="mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium text-center">
                      🚫 Límite de {MAX_LLAMADAS} llamadas alcanzado para este mes
                    </div>
                  )}
                </div>

                {/* Historial */}
                {historial.length > 0 && (
                  <div>
                    <div className="border-t dark:border-slate-700 pt-5">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Historial de meses anteriores</h3>
                      <div className="space-y-4">
                        {historial.map(([mes, llamadas]) => (
                          <div key={mes}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{getMesLabel(mes)}</p>
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{llamadas.length} llamada{llamadas.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="space-y-2">
                              {llamadas.map((l) => (
                                <div key={l.id} className="text-xs bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">{l.motivo}</p>
                                    {l.modulo && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                        {l.modulo}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 break-words">{l.descripcion}</p>
                                  <p className="text-slate-400 dark:text-slate-500 mt-1">
                                    Ticket{" "}
                                    <a href={`https://soporte.flexxus.com.ar/tickets/${l.ticket}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                      {l.ticket}
                                    </a>{" "}
                                    · {l.agente}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: nuevo cliente ── */}
      {modalAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Nuevo cliente</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Razón social / Empresa</label>
                <input
                  autoFocus
                  placeholder="Nombre de la empresa"
                  value={newEmpresa}
                  onChange={(e) => setNewEmpresa(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Equipo</label>
                <select
                  value={newEquipo}
                  onChange={(e) => setNewEquipo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Seleccionar equipo</option>
                  {EQUIPOS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setModalAddOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button
                onClick={submitAddCliente}
                disabled={savingCliente || !newEmpresa.trim() || !newEquipo}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                {savingCliente ? "Guardando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: importar Excel ── */}
      {modalImportOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Importar clientes desde Excel</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              El archivo debe tener las columnas <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">RAZONSOCIAL</code> y <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">NOMBRE</code> (equipo).
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4 text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p>• <strong>Columna A</strong>: RAZONSOCIAL — Nombre de la empresa</p>
              <p>• <strong>Columna B</strong>: NOMBRE — Nombre del equipo (ej: Equipo 3)</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalImportOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {importing ? "Importando..." : "Seleccionar archivo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: exportar informe ── */}
      {modalExportOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Exportar informe de llamadas</h3>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Mes</label>
              <select
                value={exportMes}
                onChange={(e) => setExportMes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value={mesActualId}>{getMesLabel(mesActualId)} (actual)</option>
                {allMeses.filter((m) => m !== mesActualId).map((m) => (
                  <option key={m} value={m}>{getMesLabel(m)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setModalExportOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting ? "Generando..." : "Descargar Excel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: limpiar todos los clientes ── */}
      {modalClearOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Limpiar todos los clientes</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              Esta acción elimina <strong>todos los clientes y sus llamadas</strong> de la base de datos. No se puede deshacer. Usá esto solo antes de reimportar el Excel.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalClearOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                {clearing ? "Eliminando..." : "Sí, limpiar todo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
