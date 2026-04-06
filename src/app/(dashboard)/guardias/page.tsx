"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSaturdaysOfYear, getMonthName } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
}

interface Guardia {
  id?: string;
  weekStart: string;
  teamId: string;
  guardia1Id?: string | null;
  guardia2Id?: string | null;
  guardia1?: Agent | null;
  guardia2?: Agent | null;
}

interface Team {
  id: string;
  name: string;
  users: Agent[];
}

export default function GuardiasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data: Team[]) => {
        setTeams(data);
        if (data.length > 0) {
          const myTeam = session?.user?.teamId
            ? data.find((t) => t.id === session.user.teamId) ?? data[0]
            : data[0];
          setSelectedTeam(myTeam);
        }
      });
  }, [session]);

  const loadGuardias = useCallback(() => {
    if (!selectedTeam) return;
    setLoading(true);
    fetch(`/api/guardias?teamId=${selectedTeam.id}&year=${year}`)
      .then((r) => r.json())
      .then((data: Guardia[]) => setGuardias(data))
      .finally(() => setLoading(false));
  }, [selectedTeam, year]);

  useEffect(() => {
    loadGuardias();
  }, [loadGuardias]);

  async function saveGuardia(weekStart: Date, field: "guardia1Id" | "guardia2Id", agentId: string) {
    if (!selectedTeam) return;
    const dateStr = weekStart.toISOString();
    setSaving(`${dateStr}-${field}`);

    const existing = guardias.find(
      (g) => new Date(g.weekStart).toDateString() === weekStart.toDateString()
    );

    const body = {
      teamId: selectedTeam.id,
      weekStart: dateStr,
      guardia1Id: field === "guardia1Id" ? (agentId || null) : (existing?.guardia1Id ?? null),
      guardia2Id: field === "guardia2Id" ? (agentId || null) : (existing?.guardia2Id ?? null),
    };

    const res = await fetch("/api/guardias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated: Guardia = await res.json();
      setGuardias((prev) => {
        const idx = prev.findIndex(
          (g) => new Date(g.weekStart).toDateString() === weekStart.toDateString()
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      showToast("Guardia guardada");
    }
    setSaving(null);
  }

  // Generate saturdays for the year
  const saturdays = getSaturdaysOfYear(year);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group by month
  const byMonth: Record<number, Date[]> = {};
  for (const sat of saturdays) {
    const m = sat.getMonth();
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(sat);
  }

  function getGuardia(sat: Date) {
    return guardias.find(
      (g) => new Date(g.weekStart).toDateString() === sat.toDateString()
    );
  }

  const agents = selectedTeam?.users ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Guardias del Equipo</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Horario de guardia: <strong>08:00 a 13:00</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {teams.length > 1 && (
            <select
              value={selectedTeam?.id ?? ""}
              onChange={(e) => {
                const t = teams.find((x) => x.id === e.target.value);
                if (t) setSelectedTeam(t);
              }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              ‹
            </button>
            <span className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {!selectedTeam ? (
        <div className="text-center py-12 text-slate-400">No hay equipos disponibles</div>
      ) : loading ? (
        <div className="text-center py-12 text-slate-400">Cargando guardias...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-300 dark:border-yellow-700">
                <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 w-32">MES / AÑO</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 w-32">SÁBADO</th>
                <th className="px-4 py-3 text-left font-bold text-blue-700">GUARDIA 1</th>
                <th className="px-4 py-3 text-left font-bold text-purple-700">GUARDIA 2</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byMonth).map(([monthIdx, sats]) => (
                sats.map((sat, i) => {
                  const isToday = sat.toDateString() === today.toDateString();
                  const isPast = sat < today;
                  const guardia = getGuardia(sat);
                  const dateStr = sat.toISOString();
                  const g1Key = `${dateStr}-guardia1Id`;
                  const g2Key = `${dateStr}-guardia2Id`;

                  return (
                    <tr
                      key={sat.toISOString()}
                      className={`border-b border-slate-100 dark:border-slate-700 transition-colors ${
                        isToday
                          ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500"
                          : isPast
                          ? "bg-slate-50/50 dark:bg-slate-800/50 opacity-70"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      {i === 0 && (
                        <td
                          rowSpan={sats.length}
                          className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-yellow-50 dark:bg-yellow-900/20 border-r border-yellow-200 dark:border-yellow-800 align-middle text-center"
                        >
                          {getMonthName(parseInt(monthIdx))}
                          <br />
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{year}</span>
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 font-medium">
                        {sat.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                        {isToday && (
                          <span className="ml-2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-sans">
                            HOY
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isAdmin ? (
                          <select
                            value={guardia?.guardia1Id ?? ""}
                            onChange={(e) => saveGuardia(sat, "guardia1Id", e.target.value)}
                            disabled={saving === g1Key}
                            className="w-full px-2 py-1.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-800 dark:text-blue-300 disabled:opacity-50"
                          >
                            <option value="">-</option>
                            {agents.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`font-medium ${guardia?.guardia1 ? "text-blue-700" : "text-slate-400"}`}>
                            {guardia?.guardia1?.name ?? "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isAdmin ? (
                          <select
                            value={guardia?.guardia2Id ?? ""}
                            onChange={(e) => saveGuardia(sat, "guardia2Id", e.target.value)}
                            disabled={saving === g2Key}
                            className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-800 dark:text-purple-300 disabled:opacity-50"
                          >
                            <option value="">-</option>
                            {agents.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`font-medium ${guardia?.guardia2 ? "text-purple-700" : "text-slate-400"}`}>
                            {guardia?.guardia2?.name ?? "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
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
