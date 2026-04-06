"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const sections = [
  {
    href: "/precios",
    title: "Precios de Soporte",
    desc: "Valores actualizados por tipo de contrato",
    color: "bg-green-50 border-green-200",
    iconBg: "bg-green-100",
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/central-telefonica",
    title: "Central Telefónica",
    desc: "Árbol de opciones del sistema telefónico",
    color: "bg-orange-50 border-orange-200",
    iconBg: "bg-orange-100",
    icon: (
      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    href: "/guardias",
    title: "Guardias del Equipo",
    desc: "Calendario semanal de guardias Guardia 1 / Guardia 2",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/respuestas",
    title: "Respuestas Rápidas",
    desc: "Plantillas listas para copiar y pegar",
    color: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: "/vacaciones",
    title: "Vacaciones",
    desc: "Registro y seguimiento de días de vacaciones",
    color: "bg-sky-50 border-sky-200",
    iconBg: "bg-sky-100",
    icon: (
      <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
  {
    href: "/basicos",
    title: "Soporte Básico",
    desc: "Gestión de llamadas de clientes con soporte básico",
    color: "bg-red-50 border-red-200",
    iconBg: "bg-red-100",
    icon: (
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
      </svg>
    ),
  },
  {
    href: "/presupuestador",
    title: "Presupuestador",
    desc: "Generación de presupuestos de soporte para clientes",
    color: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
    icon: (
      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [vacInfo, setVacInfo] = useState<{ diasTotales: number; tomados: number } | null>(null);
  const [nextGuardia, setNextGuardia] = useState<{ fecha: string; rol: string; esHoy: boolean } | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const year = new Date().getFullYear();

    fetch(`/api/vacaciones?year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.vacaciones) {
          setVacInfo({ diasTotales: data.diasTotales, tomados: data.vacaciones.length });
        }
      })
      .catch(() => {});

    const teamId = session.user.teamId;
    if (teamId && !isAdmin) {
      fetch(`/api/guardias?teamId=${teamId}&year=${year}`)
        .then((r) => r.json())
        .then((data: Array<{ weekStart: string; guardia1?: { id: string }; guardia2?: { id: string } }>) => {
          const now = new Date();
          // Argentina browser: getHours() is local Argentina time
          const isBeforeCutoff = now.getHours() < 13;
          // Today at local midnight for date-only comparison
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

          const upcoming = data
            .filter((g) => {
              const ws = new Date(g.weekStart);
              const wsMidnight = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate()).getTime();
              if (wsMidnight === todayMidnight) return isBeforeCutoff;
              return wsMidnight > todayMidnight;
            })
            .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

          for (const g of upcoming) {
            const ws = new Date(g.weekStart);
            const isToday = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate()).getTime() === todayMidnight;
            if (g.guardia1?.id === session.user.id) {
              setNextGuardia({ fecha: g.weekStart, rol: "Guardia 1", esHoy: isToday });
              break;
            }
            if (g.guardia2?.id === session.user.id) {
              setNextGuardia({ fecha: g.weekStart, rol: "Guardia 2", esHoy: isToday });
              break;
            }
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Bienvenido al Portal de Soporte Flexxus — uso interno del Área de Soporte
        </p>
      </div>

      {/* Quick Stats */}
      <div className={`grid grid-cols-1 ${!isAdmin ? "sm:grid-cols-2" : ""} gap-4 mb-8`}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Vacaciones disponibles</p>
            {vacInfo ? (
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {vacInfo.diasTotales - vacInfo.tomados}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">días</span>
              </p>
            ) : (
              <p className="text-slate-400 text-sm">Cargando...</p>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {nextGuardia?.esHoy ? "Guardia de hoy" : "Próxima guardia"}
              </p>
              {nextGuardia ? (
                <div>
                  <p className={`text-lg font-bold ${nextGuardia.esHoy ? "text-blue-500" : "text-slate-800 dark:text-slate-100"}`}>
                    {nextGuardia.rol}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {nextGuardia.esHoy
                      ? "Hoy · hasta las 13:00 hs"
                      : new Date(nextGuardia.fecha).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  {session?.user?.teamId ? "Sin guardia asignada" : "Sin equipo asignado"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section Cards */}
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`block bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow group ${s.color}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.iconBg}`}>
              {s.icon}
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
              {s.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
