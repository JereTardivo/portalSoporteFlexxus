"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { getMonthName } from "@/lib/utils";

interface Vacacion { id: string; fecha: string; aprobado: boolean; }
interface AgentData {
  userId: string;
  userName: string;
  diasTotales: number;
  vacaciones: Vacacion[];
  color?: string;
}
interface TeamType { id: string; name: string; }

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const PALETTE = [
  "#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#6366F1","#84CC16",
  "#06B6D4","#A855F7",
];

export default function VacacionesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const sessionTeamId = (session?.user as { teamId?: string } | undefined)?.teamId;
  const isGerente = isAdmin && !sessionTeamId;

  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);
  const [approvedWarning, setApprovedWarning] = useState(false);

  // ── Agent / own state ──
  const [ownVacaciones, setOwnVacaciones] = useState<Vacacion[]>([]);
  const [ownDiasTotales, setOwnDiasTotales] = useState(15);

  // ── Admin state ──
  const [allTeams, setAllTeams] = useState<TeamType[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const [teamMembers, setTeamMembers] = useState<AgentData[]>([]);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Load own vacations (agent) or own data (gerente via "self" option)
  useEffect(() => {
    if (!session || isAdmin) return;
    setLoading(true);
    fetch(`/api/vacaciones?year=${year}`)
      .then(r => r.json())
      .then(data => { setOwnVacaciones(data.vacaciones ?? []); setOwnDiasTotales(data.diasTotales ?? 15); })
      .finally(() => setLoading(false));
  }, [session, isAdmin, year]);

  // Load teams list for gerente
  useEffect(() => {
    if (!session || !isGerente) return;
    fetch("/api/teams").then(r => r.json()).then((teams: TeamType[]) => {
      setAllTeams(teams);
      if (teams.length > 0) setSelectedTeamId(teams[0].id);
    });
  }, [session, isGerente]);

  // Set team for líder (auto)
  useEffect(() => {
    if (!session || !isAdmin || isGerente) return;
    if (sessionTeamId) setSelectedTeamId(sessionTeamId);
  }, [session, isAdmin, isGerente, sessionTeamId]);

  // Load team data (admin)
  const loadTeamData = useCallback(() => {
    if (!selectedTeamId || !isAdmin) return;
    setLoading(true);
    fetch(`/api/vacaciones?teamId=${selectedTeamId}&year=${year}`)
      .then(r => r.json())
      .then(data => setTeamMembers(data.teamData ?? []))
      .finally(() => setLoading(false));
  }, [selectedTeamId, year, isAdmin]);

  useEffect(() => { loadTeamData(); }, [loadTeamData]);

  // Reset agent filter when team changes
  useEffect(() => { setSelectedAgentId("all"); }, [selectedTeamId]);

  // Assign colors to team members
  const teamMembersWithColor: AgentData[] = useMemo(() =>
    teamMembers.map((m, i) => ({ ...m, color: PALETTE[i % PALETTE.length] })),
    [teamMembers]
  );

  // Build dateColorMap for multi-color view
  const dateColorMap = useMemo(() => {
    const map = new Map<string, { color: string; userId: string }[]>();
    teamMembersWithColor.forEach(agent => {
      agent.vacaciones.forEach(vac => {
        const ds = new Date(vac.fecha).toDateString();
        if (!map.has(ds)) map.set(ds, []);
        map.get(ds)!.push({ color: agent.color!, userId: agent.userId });
      });
    });
    return map;
  }, [teamMembersWithColor]);

  const selectedAgent = useMemo(() =>
    selectedAgentId !== "all" ? teamMembersWithColor.find(m => m.userId === selectedAgentId) ?? null : null,
    [selectedAgentId, teamMembersWithColor]
  );

  const isTeamView = isAdmin && selectedAgentId === "all";

  // ── Toggle own vacation (agent) ──
  async function toggleOwnDay(date: Date) {
    const dateStr = date.toDateString();
    const existing = ownVacaciones.find(v => new Date(v.fecha).toDateString() === dateStr);
    if (existing) {
      if (existing.aprobado) {
        setApprovedWarning(true); setTimeout(() => setApprovedWarning(false), 3500); return;
      }
      const res = await fetch(`/api/vacaciones/${existing.id}`, { method: "DELETE" });
      if (res.ok) setOwnVacaciones(prev => prev.filter(v => v.id !== existing.id));
    } else {
      if (ownVacaciones.length >= ownDiasTotales) {
        setLimitWarning(true); setTimeout(() => setLimitWarning(false), 3000); return;
      }
      const res = await fetch("/api/vacaciones", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechas: [date.toISOString()] }),
      });
      if (res.ok) { const created: Vacacion[] = await res.json(); setOwnVacaciones(prev => [...prev, ...created]); }
    }
  }

  // ── Approve / revoke a vacation day (admin only) ──
  async function toggleApproval(vac: Vacacion, agentId: string) {
    const res = await fetch(`/api/vacaciones/${vac.id}`, { method: "PATCH" });
    if (res.ok) {
      const updated: Vacacion = await res.json();
      setTeamMembers(prev => prev.map(m => m.userId === agentId
        ? { ...m, vacaciones: m.vacaciones.map(v => v.id === vac.id ? updated : v) } : m));
    }
  }

  async function approveAll(agentId: string) {
    const agent = teamMembers.find(m => m.userId === agentId);
    if (!agent) return;
    const pending = agent.vacaciones.filter(v => !v.aprobado);
    await Promise.all(pending.map(v => toggleApproval(v, agentId)));
  }

  // ── Toggle agent day (admin single-agent view) ──
  async function toggleAgentDay(date: Date) {
    if (!selectedAgent) return;
    const dateStr = date.toDateString();
    const existing = selectedAgent.vacaciones.find(v => new Date(v.fecha).toDateString() === dateStr);
    if (existing) {
      const res = await fetch(`/api/vacaciones/${existing.id}`, { method: "DELETE" });
      if (res.ok) setTeamMembers(prev => prev.map(m => m.userId === selectedAgent.userId
        ? { ...m, vacaciones: m.vacaciones.filter(v => v.id !== existing.id) } : m));
    } else {
      if (selectedAgent.vacaciones.length >= selectedAgent.diasTotales) {
        setLimitWarning(true); setTimeout(() => setLimitWarning(false), 3000); return;
      }
      const res = await fetch("/api/vacaciones", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedAgent.userId, fechas: [date.toISOString()] }),
      });
      if (res.ok) {
        const created: Vacacion[] = await res.json();
        setTeamMembers(prev => prev.map(m => m.userId === selectedAgent.userId
          ? { ...m, vacaciones: [...m.vacaciones, ...created] } : m));
      }
    }
  }

  // ── Stats ──
  const displayVacaciones = !isAdmin ? ownVacaciones : (selectedAgent?.vacaciones ?? []);
  const displayDiasTotales = !isAdmin ? ownDiasTotales : (selectedAgent?.diasTotales ?? 15);
  const displayTomados = displayVacaciones.length;
  const displayRestantes = Math.max(0, displayDiasTotales - displayTomados);

  // ── Month tab count ──
  function monthCount(m: number) {
    if (isTeamView) {
      let c = 0;
      teamMembersWithColor.forEach(a => { c += a.vacaciones.filter(v => new Date(v.fecha).getMonth() === m && new Date(v.fecha).getFullYear() === year).length; });
      return c;
    }
    return displayVacaciones.filter(v => new Date(v.fecha).getMonth() === m && new Date(v.fecha).getFullYear() === year).length;
  }

  // ── Calendar cell style (multi-color) ──
  function cellStyle(dateStr: string): React.CSSProperties {
    const agents = dateColorMap.get(dateStr) ?? [];
    if (agents.length === 0) return {};
    if (agents.length === 1) return { backgroundColor: agents[0].color };
    if (agents.length === 2) return { background: `linear-gradient(135deg, ${agents[0].color} 50%, ${agents[1].color} 50%)` };
    return { background: `linear-gradient(135deg, ${agents[0].color} 33%, ${agents[1].color} 33%, ${agents[1].color} 66%, ${agents[2].color} 66%)` };
  }

  // ── MonthCalendar ──
  function MonthCalendar({ month }: { month: number }) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null) as null[],
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const vacMap = !isTeamView
      ? new Map(displayVacaciones.map(v => [new Date(v.fecha).toDateString(), v]))
      : new Map<string, Vacacion>();

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{getMonthName(month)} {year}</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const date = new Date(year, month, day);
              date.setHours(0, 0, 0, 0);
              const dateStr = date.toDateString();
              const isToday = dateStr === today.toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              if (isTeamView) {
                const agentsOnDay = dateColorMap.get(dateStr) ?? [];
                const hasVac = agentsOnDay.length > 0;
                return (
                  <div
                    key={i}
                    title={agentsOnDay.length > 0
                      ? teamMembersWithColor.filter(a => agentsOnDay.some(x => x.userId === a.userId)).map(a => a.userName).join(", ")
                      : undefined}
                    className={`h-8 w-full rounded-md text-xs font-medium flex items-center justify-center relative
                      ${hasVac ? "text-white" : isToday ? "ring-2 ring-blue-500 text-blue-600" : isWeekend ? "text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50" : "text-slate-700 dark:text-slate-300"}
                    `}
                    style={hasVac ? cellStyle(dateStr) : undefined}
                  >
                    {day}
                    {agentsOnDay.length > 2 && (
                      <span className="absolute -top-1 -right-1 bg-white text-slate-700 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-300">
                        {agentsOnDay.length}
                      </span>
                    )}
                  </div>
                );
              }

              // Single-agent / own view
              const vacEntry = vacMap.get(dateStr);
              const isVac = !!vacEntry;
              const isApproved = vacEntry?.aprobado ?? false;
              const isPast = date < today;
              const limitReached = displayVacaciones.length >= displayDiasTotales;
              const isDisabled = !isVac && limitReached;
              const toggle = isAdmin ? toggleAgentDay : toggleOwnDay;
              const vacColor = selectedAgent?.color ?? "#0EA5E9";
              // Approved: solid color | Pending: lighter (40% opacity bg + colored border)
              const approvedStyle: React.CSSProperties = { backgroundColor: vacColor, color: "white" };
              const pendingStyle: React.CSSProperties = { backgroundColor: vacColor + "33", color: vacColor, outline: `2px dashed ${vacColor}`, outlineOffset: "-2px" };

              return (
                <button
                  key={i}
                  onClick={() => !isDisabled && toggle(date)}
                  disabled={isDisabled}
                  title={isApproved ? "Aprobado por el líder" : isVac ? "Pendiente de aprobación" : undefined}
                  className={`h-8 w-full rounded-md text-xs font-medium transition-all relative
                    ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  style={isVac
                    ? (isApproved ? approvedStyle : pendingStyle)
                    : isToday
                    ? { backgroundColor: "#2563EB", color: "white" }
                    : isWeekend
                    ? { color: isDark ? "#64748b" : "#94a3b8", backgroundColor: isDark ? "rgba(51,65,85,0.5)" : "#f1f5f9" }
                    : isPast
                    ? { color: isDark ? "#475569" : "#cbd5e1" }
                    : { color: isDark ? "#cbd5e1" : "#334155" }
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const quarterStart = Math.floor(viewMonth / 3) * 3;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Vacaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {!isAdmin ? "Registrá tus días de vacaciones. Hacé clic en un día para marcarlo/desmarcarlo."
              : isTeamView ? "Vista del equipo — pasá el cursor sobre un día para ver quién está de vacaciones."
              : `Editando vacaciones de ${selectedAgent?.userName ?? "—"}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gerente: team selector */}
          {isGerente && allTeams.length > 0 && (
            <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {allTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {/* Admin: agent selector */}
          {isAdmin && teamMembersWithColor.length > 0 && (
            <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">👥 Todo el equipo</option>
              {teamMembersWithColor.map(m => (
                <option key={m.userId} value={m.userId}>{m.userName}</option>
              ))}
            </select>
          )}
          {/* Year nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">‹</button>
            <span className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">›</button>
          </div>
        </div>
      </div>

      {/* Stats — only in single/own view */}
      {!isTeamView && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{displayDiasTotales}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Días totales</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800 p-4 text-center">
            <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">{displayTomados}</p>
            <p className="text-sm text-sky-600 dark:text-sky-500 mt-1">Días tomados</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${displayRestantes === 0 ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800" : displayRestantes <= 3 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}`}>
            <p className={`text-3xl font-bold ${displayRestantes === 0 ? "text-red-600 dark:text-red-400" : displayRestantes <= 3 ? "text-amber-600 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`}>{displayRestantes}</p>
            <p className={`text-sm mt-1 ${displayRestantes === 0 ? "text-red-500 dark:text-red-400" : displayRestantes <= 3 ? "text-amber-500 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>Días restantes</p>
            {displayRestantes === 0 && <p className="text-[10px] text-red-400 mt-1 font-semibold">Límite alcanzado</p>}
          </div>
        </div>
      )}

      {/* Team legend — only in team view */}
      {isTeamView && teamMembersWithColor.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Referencia del equipo</p>
          <div className="flex flex-wrap gap-3">
            {teamMembersWithColor.map(m => (
              <button key={m.userId} onClick={() => setSelectedAgentId(m.userId)}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors">
                <span className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: m.color }} />
                <span>{m.userName}</span>
                {m.vacaciones.length > 0 && (
                  <span className="text-xs text-slate-400">({m.vacaciones.length}d)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {Array.from({ length: 12 }, (_, i) => {
          const count = monthCount(i);
          return (
            <button key={i} onClick={() => setViewMonth(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${viewMonth === i ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
              {getMonthName(i).slice(0, 3)}
              {count > 0 && <span className="ml-1 bg-sky-400 text-white rounded-full px-1 text-[10px]">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => {
            const m = (quarterStart + i) % 12;
            return <MonthCalendar key={`${m}-${year}`} month={m} />;
          })}
        </div>
      )}

      {/* Legend — own/agent view */}
      {!isTeamView && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedAgent?.color ?? "#0EA5E9" }} />
            <span>Aprobado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-dashed" style={{ borderColor: selectedAgent?.color ?? "#0EA5E9", backgroundColor: (selectedAgent?.color ?? "#0EA5E9") + "33" }} />
            <span>Pendiente de aprobación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-600" />
            <span>Hoy</span>
          </div>
        </div>
      )}

      {/* Approval panel — admin single-agent view */}
      {isAdmin && !isTeamView && selectedAgent && (() => {
        const pending = selectedAgent.vacaciones.filter(v => !v.aprobado).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        const approved = selectedAgent.vacaciones.filter(v => v.aprobado).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        if (selectedAgent.vacaciones.length === 0) return null;
        return (
          <div className="mt-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Gestión de aprobación</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{selectedAgent.userName} · {approved.length} aprobados · {pending.length} pendientes</p>
              </div>
              {pending.length > 0 && (
                <button
                  onClick={() => approveAll(selectedAgent.userId)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Aprobar todos ({pending.length})
                </button>
              )}
            </div>
            <div className="p-4">
              {pending.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-2">Pendientes</p>
                  <div className="flex flex-wrap gap-2">
                    {pending.map(v => {
                      const d = new Date(v.fecha);
                      return (
                        <div key={v.id} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-2.5 py-1.5">
                          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                            {d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          </span>
                          <button
                            onClick={() => toggleApproval(v, selectedAgent.userId)}
                            className="text-amber-600 hover:text-green-600 transition"
                            title="Aprobar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {approved.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-2">Aprobados</p>
                  <div className="flex flex-wrap gap-2">
                    {approved.map(v => {
                      const d = new Date(v.fecha);
                      return (
                        <div key={v.id} className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-2.5 py-1.5">
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-xs text-green-800 dark:text-green-300 font-medium">
                            {d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          </span>
                          <button
                            onClick={() => toggleApproval(v, selectedAgent.userId)}
                            className="text-green-400 hover:text-red-500 transition"
                            title="Revocar aprobación"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Toasts */}
      {limitWarning && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Sin días disponibles — límite de {displayDiasTotales} días alcanzado
        </div>
      )}
      {approvedWarning && (
        <div className="fixed bottom-6 right-6 bg-amber-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m0 6h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Este día fue aprobado por tu líder y no se puede modificar
        </div>
      )}
    </div>
  );
}
