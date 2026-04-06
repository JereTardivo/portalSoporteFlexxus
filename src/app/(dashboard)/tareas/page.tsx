"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Tarea {
  id: string;
  nombre: string;
  premium: string;
  basico: string;
  porCasos: string;
  sinSoporte: string;
  orderAdvanced: string;
  categoriaEspecial: string | null;
  orden: number;
}

interface Precio {
  id: string;
  categoria: string;
  label: string;
  valor: number;
}

function formatPeso(v: number) {
  return `$ ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 }).format(v)}`;
}

const COLS = [
  { key: "premium",       label: "PREMIUM" },
  { key: "basico",        label: "BÁSICO" },
  { key: "orderAdvanced", label: "ORDER ADV." },
  { key: "porCasos",      label: "POR CASOS" },
  { key: "sinSoporte",    label: "SIN SOPORTE" },
] as const;

type ColKey = (typeof COLS)[number]["key"];

const EMPTY_FORM = { nombre: "", premium: "-", basico: "-", porCasos: "-", sinSoporte: "-", orderAdvanced: "-" };

function CellValue({ value, precio }: { value: string; precio?: Precio | null }) {
  if (value === "-") {
    return <span className="text-slate-300 font-medium">—</span>;
  }
  if (value === "COTIZACION") {
    return (
      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
        Cotización
      </span>
    );
  }
  if (value === "VALOR FIJO") {
    if (precio) {
      return (
        <span className="font-bold text-blue-700 dark:text-blue-400 text-sm whitespace-nowrap">
          {formatPeso(precio.valor)}
        </span>
      );
    }
    return (
      <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
        Valor fijo
      </span>
    );
  }
  return (
    <span className="font-bold text-slate-800 dark:text-slate-100">
      {value}
      <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-0.5">h</span>
    </span>
  );
}

export default function TareasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tarea>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/tareas").then(r => r.json()),
      fetch("/api/precios").then(r => r.json()),
    ]).then(([tareasData, preciosData]) => {
      setTareas(tareasData);
      setPrecios(preciosData);
    }).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function startEdit(t: Tarea) {
    setEditingId(t.id);
    setEditForm({ nombre: t.nombre, premium: t.premium, basico: t.basico, porCasos: t.porCasos, sinSoporte: t.sinSoporte, orderAdvanced: t.orderAdvanced });
  }

  async function deleteTarea(id: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(`/api/tareas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTareas(prev => prev.filter(t => t.id !== id));
      showToast("Tarea eliminada");
    }
  }

  async function createTarea() {
    if (!newForm.nombre.trim()) return;
    setCreating(true);
    const res = await fetch("/api/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      const created: Tarea = await res.json();
      setTareas(prev => [...prev, created]);
      setNewForm({ ...EMPTY_FORM });
      setShowNewForm(false);
      showToast("Tarea creada");
    }
    setCreating(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated: Tarea = await res.json();
      setTareas((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast("Tarea actualizada");
      setEditingId(null);
    }
    setSaving(false);
  }

  const filtered = tareas.filter(
    (t) => !search || t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Valores de Tareas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Cantidad de horas por tarea según tipo de soporte contratado
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-amber-700">Los valores representan <strong>horas</strong> según tipo de soporte</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowNewForm(v => !v); setNewForm({ ...EMPTY_FORM }); }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nueva tarea
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar tarea..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-5 py-3 bg-slate-800 dark:bg-slate-900 text-white font-semibold text-xs uppercase tracking-wide">
                    Tarea / Tipo de soporte
                  </th>
                  {COLS.map((c) => (
                    <th key={c.key} className="text-center px-4 py-3 bg-slate-800 dark:bg-slate-900 text-white font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  {isAdmin && (
                    <th className="px-4 py-3 bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-wide w-24"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* New task form row */}
                {isAdmin && showNewForm && (
                  <tr className="border-b border-blue-200 bg-blue-50/40">
                    <td className="px-5 py-2">
                      <input
                        autoFocus
                        placeholder="Nombre de la tarea..."
                        value={newForm.nombre}
                        onChange={e => setNewForm(f => ({ ...f, nombre: e.target.value }))}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    {COLS.map(c => (
                      <td key={c.key} className="px-4 py-2 text-center">
                        <input
                          value={newForm[c.key as keyof typeof EMPTY_FORM]}
                          onChange={e => setNewForm(f => ({ ...f, [c.key]: e.target.value }))}
                          className="w-20 px-2 py-1 border border-blue-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={createTarea} disabled={creating || !newForm.nombre.trim()}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                          {creating ? "..." : "Crear"}
                        </button>
                        <button onClick={() => setShowNewForm(false)}
                          className="px-3 py-1 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50">Cancelar</button>
                      </div>
                    </td>
                  </tr>
                )}

                {filtered.map((tarea, idx) => {
                  const isEditing = editingId === tarea.id;
                  return (
                    <tr
                      key={tarea.id}
                      className={`border-b border-slate-100 dark:border-slate-700 last:border-0 ${idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50"} hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors`}
                    >
                      {/* Nombre */}
                      <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {isEditing ? (
                          <input
                            value={editForm.nombre ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          tarea.nombre
                        )}
                      </td>

                      {/* Value columns */}
                      {COLS.map((c) => (
                        <td key={c.key} className="px-4 py-3 text-center">
                          {isEditing ? (
                            <input
                              value={(editForm[c.key as ColKey] as string) ?? ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, [c.key]: e.target.value }))}
                              className="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <CellValue
                              value={tarea[c.key as ColKey] as string}
                              precio={tarea.categoriaEspecial
                                ? precios.find(p => p.categoria === tarea.categoriaEspecial) ?? null
                                : null}
                            />
                          )}
                        </td>
                      ))}

                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => saveEdit(tarea.id)} disabled={saving}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                                {saving ? "..." : "Guardar"}
                              </button>
                              <button onClick={cancelEdit}
                                className="px-3 py-1 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50">Cancelar</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => startEdit(tarea)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => deleteTarea(tarea.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-5 py-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">4h</span>
              <span>= cantidad de horas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">Cotización</span>
              <span>= se cotiza caso por caso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">Valor fijo</span>
              <span>= ver precio establecido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-medium">—</span>
              <span className="ml-1">= no aplica para este tipo de soporte</span>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
