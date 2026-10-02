"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toInputDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

interface Claves {
  nueva: string;
  actual: string;
  vieja: string;
}

function calcularClaves(usuario: string, fecha: Date | null): Claves | null {
  const user = usuario.trim();
  if (!user || !fecha) return null;

  const diaNum = fecha.getDate();
  const mesNum = fecha.getMonth() + 1;
  const anioNum = fecha.getFullYear();

  const diaStr = pad2(diaNum);
  const mesStr = pad2(mesNum);
  const anioStr = String(anioNum);

  const sumaDiaMes = diaNum + mesNum;
  const userUpper = user.toUpperCase();

  const claveNueva = `${anioStr}*${sumaDiaMes}*${userUpper}`;

  const sumaTotal = diaNum + mesNum + anioNum;
  const claveActual = `${sumaTotal}!${userUpper}`;

  const primeraLetra = userUpper.charAt(0);
  const ultimaLetra = userUpper.charAt(userUpper.length - 1);
  const claveVieja = `${ultimaLetra}${primeraLetra}${mesStr}${diaStr}X${sumaDiaMes}`;

  return { nueva: claveNueva, actual: claveActual, vieja: claveVieja };
}

export default function ClavesPage() {
  const [usuario, setUsuario] = useState("ADMIN");
  const [fechaInput, setFechaInput] = useState(() => toInputDate(new Date()));
  const [copied, setCopied] = useState<string | null>(null);

  const fecha = useMemo(() => {
    if (!fechaInput) return null;
    const [y, m, d] = fechaInput.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }, [fechaInput]);

  const claves = useMemo(() => calcularClaves(usuario, fecha), [usuario, fecha]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  async function copiar(id: string, texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopied(id);
  }

  const resultados: { id: string; title: string; value: string | undefined }[] = [
    { id: "nueva", title: "Versión Nueva", value: claves?.nueva },
    { id: "actual", title: "Versión Actual", value: claves?.actual },
    { id: "vieja", title: "Versión Vieja", value: claves?.vieja },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Claves de Acceso</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Calculá las claves del día para un usuario según la fecha seleccionada
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: ADMIN"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={fechaInput}
              onChange={(e) => setFechaInput(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {resultados.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {r.title}
                </span>
                <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-100 truncate">
                  {r.value ?? "-"}
                </span>
              </div>
              <button
                onClick={() => r.value && copiar(r.id, r.value)}
                disabled={!r.value}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  copied === r.id
                    ? "bg-green-500 text-white"
                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                }`}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
