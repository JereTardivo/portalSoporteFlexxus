"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Respuesta {
  id: string;
  segmento: string;
  titulo: string;
  detalle: string;
  orden: number;
}

const EMPTY: Omit<Respuesta, "id"> = { segmento: "", titulo: "", detalle: "", orden: 0 };

export default function RespuestasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Respuesta | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRespuestas();
  }, []);

  function loadRespuestas() {
    setLoading(true);
    fetch("/api/respuestas")
      .then((r) => r.json())
      .then(setRespuestas)
      .finally(() => setLoading(false));
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(r: Respuesta) {
    setEditing(r);
    setForm({ segmento: r.segmento, titulo: r.titulo, detalle: r.detalle, orden: r.orden });
    setShowModal(true);
  }

  async function saveRespuesta() {
    setSaving(true);
    if (editing) {
      const res = await fetch(`/api/respuestas/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setRespuestas((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      }
    } else {
      const res = await fetch("/api/respuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setRespuestas((prev) => [...prev, created]);
      }
    }
    setSaving(false);
    setShowModal(false);
  }

  async function deleteRespuesta(id: string) {
    if (!confirm("¿Eliminar esta respuesta?")) return;
    const res = await fetch(`/api/respuestas/${id}`, { method: "DELETE" });
    if (res.ok) setRespuestas((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = respuestas.filter(
    (r) =>
      !search ||
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      r.segmento.toLowerCase().includes(search.toLowerCase()) ||
      r.detalle.toLowerCase().includes(search.toLowerCase())
  );

  const segments = Array.from(new Set(filtered.map((r) => r.segmento))).sort();

  const segmentColors: Record<string, string> = {
    "Respuestas Generales":           "bg-green-100 text-green-800 border-green-300",
    "Actualizaciones":                 "bg-blue-100 text-blue-800 border-blue-300",
    "Clientes Por Casos y Sin Soporte":"bg-orange-100 text-orange-800 border-orange-300",
    "Tiempos de Respuesta":            "bg-purple-100 text-purple-800 border-purple-300",
    "Derivaciones":                    "bg-amber-100 text-amber-800 border-amber-300",
    "Paso a Soporte":                  "bg-rose-100 text-rose-800 border-rose-300",
  };

  const ALL_SEGMENTS = Object.keys(segmentColors);

  function badgeClass(seg: string) {
    return segmentColors[seg] ?? "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Respuestas Rápidas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Plantillas listas para copiar y pegar en la mesa de ayuda
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva respuesta
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_SEGMENTS.map((seg) => (
          <span key={seg} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass(seg)}`}>
            {seg}
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar respuestas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : segments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {search ? "No se encontraron resultados" : "No hay respuestas cargadas"}
        </div>
      ) : (
        <div className="space-y-6">
          {segments.map((seg) => {
            const items = filtered.filter((r) => r.segmento === seg);
            return (
              <div key={seg}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
                  {seg} <span className="text-slate-400 font-normal">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map((r) => {
                    const isExpanded = expandedIds.has(r.id);
                    return (
                      <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => toggleExpand(r.id)}>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeClass(r.segmento)}`}>
                            {r.segmento}
                          </span>
                          <span className="flex-1 font-medium text-slate-800 dark:text-slate-100 text-sm">{r.titulo}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(r.detalle, r.id);
                              }}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                copied === r.id
                                  ? "bg-green-500 text-white"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              }`}
                              title="Copiar al portapapeles"
                            >
                              {copied === r.id ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copiar
                                </>
                              )}
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteRespuesta(r.id); }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{r.detalle}</p>
                            <button
                              onClick={() => copyToClipboard(r.detalle, r.id + "-exp")}
                              className={`mt-3 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                                copied === r.id + "-exp"
                                  ? "bg-green-500 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {copied === r.id + "-exp" ? "✓ ¡Copiado al portapapeles!" : "Copiar respuesta completa"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{editing ? "Editar respuesta" : "Nueva respuesta"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Segmento</label>
                  <input
                    value={form.segmento}
                    onChange={(e) => setForm((f) => ({ ...f, segmento: e.target.value }))}
                    placeholder="ej: Técnico"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orden</label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) => setForm((f) => ({ ...f, orden: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Nombre descriptivo de la respuesta"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Detalle (respuesta completa)</label>
                <textarea
                  value={form.detalle}
                  onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
                  rows={6}
                  placeholder="Escribí aquí el texto completo de la respuesta..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t dark:border-slate-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={saveRespuesta}
                disabled={saving || !form.titulo || !form.segmento || !form.detalle}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
