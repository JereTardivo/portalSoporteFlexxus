"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Precio {
  id: string;
  categoria: string;
  subtipo: string | null;
  concepto: string;
  label: string;
  valor: number;
  orden: number;
}

function formatPeso(v: number) {
  return `$ ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 }).format(v)}`;
}

export default function PreciosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/precios")
      .then((r) => r.json())
      .then(setPrecios)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function savePrice(id: string) {
    setSaving(true);
    const res = await fetch("/api/precios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valor: parseFloat(editValue) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPrecios((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast("Precio actualizado");
    }
    setEditing(null);
    setSaving(false);
  }

  function startEdit(p: Precio) {
    setEditing(p.id);
    setEditValue(String(p.valor));
  }

  const premium = precios.filter((p) => p.categoria === "premium_basico");
  const sinSoporte = precios.filter((p) => p.categoria === "sin_soporte");
  const altaRS = precios.filter((p) => p.categoria === "alta_razon_social");
  const firebirdStacks = precios.filter((p) => p.categoria === "firebird_stack");

  function PriceRow({ p, indent }: { p: Precio; indent?: boolean }) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        {indent && <td className="pl-8 pr-2 py-3 text-sm text-slate-600 dark:text-slate-300">{p.label}</td>}
        {!indent && <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.label}</td>}
        <td className="px-4 py-3 whitespace-nowrap">
          {editing === p.id ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-32 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <button
                onClick={() => savePrice(p.id)}
                disabled={saving}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "..." : "Guardar"}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-100">{formatPeso(p.valor)}</span>
          )}
        </td>
        {isAdmin && editing !== p.id && (
          <td className="px-4 py-3 text-right">
            <button
              onClick={() => startEdit(p)}
              className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
              title="Editar precio"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </td>
        )}
      </tr>
    );
  }

  function SectionTable({
    title,
    rows,
    headerClass,
    groupBy,
  }: {
    title: string;
    rows: Precio[];
    headerClass: string;
    groupBy?: boolean;
  }) {
    if (!groupBy) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`${headerClass} text-center py-3 px-4 font-semibold text-sm tracking-wide`} colSpan={isAdmin ? 3 : 2}>
                  {title}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => <PriceRow key={p.id} p={p} />)}
            </tbody>
          </table>
        </div>
      );
    }

    const visita = rows.filter((p) => p.subtipo === "visita_empresa");
    const remota = rows.filter((p) => p.subtipo === "solucion_remota");

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${headerClass} text-center py-3 px-4 font-semibold text-sm tracking-wide`} colSpan={isAdmin ? 3 : 2}>
                {title}
              </th>
            </tr>
          </thead>
          <tbody>
            {visita.length > 0 && (
              <>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide" colSpan={isAdmin ? 3 : 2}>
                    Visita a Empresa
                  </td>
                </tr>
                {visita.map((p) => <PriceRow key={p.id} p={p} indent />)}
              </>
            )}
            {remota.length > 0 && (
              <>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide" colSpan={isAdmin ? 3 : 2}>
                    Solución Remota
                  </td>
                </tr>
                {remota.map((p) => <PriceRow key={p.id} p={p} indent />)}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Precios de Soporte</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Valores vigentes de los servicios de soporte.
          {isAdmin && " Como administrador podés editar los precios."}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando precios...</div>
      ) : (
        <div className="space-y-5">
          <SectionTable
            title="SOPORTE PREMIUM — BÁSICO — POR CASOS — ORDER ADVANCED"
            rows={premium}
            headerClass="bg-green-200 text-green-900"
            groupBy
          />
          <SectionTable
            title="SIN SOPORTE"
            rows={sinSoporte}
            headerClass="bg-red-200 text-red-900"
            groupBy
          />
          <SectionTable
            title="ALTA DE RAZÓN SOCIAL"
            rows={altaRS}
            headerClass="bg-yellow-200 text-yellow-900"
          />
          {firebirdStacks.length > 0 && (
            <SectionTable
              title="DATACENTER — PAQUETE STACK SERVICIOS FIREBIRD"
              rows={firebirdStacks}
              headerClass="bg-indigo-100 text-indigo-900"
            />
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
