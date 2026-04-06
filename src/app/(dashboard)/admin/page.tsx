"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  diasVacaciones: number;
  team?: { id: string; name: string } | null;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "agent",
  teamId: "",
  diasVacaciones: 15,
};

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (session && session.user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
    ]).then(([usersData, teamsData]) => {
      setUsers(usersData);
      setTeams(teamsData);
    }).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      teamId: u.teamId ?? "",
      diasVacaciones: u.diasVacaciones,
    });
    setError("");
    setShowModal(true);
  }

  async function saveUser() {
    setSaving(true);
    setError("");
    const body = { ...form, teamId: form.teamId || null };

    if (editingUser) {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated: User = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated, team: teams.find(t => t.id === updated.teamId) ?? null } : u)));
        showToast("Usuario actualizado");
        setShowModal(false);
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al guardar");
      }
    } else {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created: User = await res.json();
        setUsers((prev) => [...prev, { ...created, team: teams.find(t => t.id === created.teamId) ?? null }]);
        showToast("Usuario creado");
        setShowModal(false);
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al crear");
      }
    }
    setSaving(false);
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("Usuario eliminado");
    }
  }

  if (session?.user?.role !== "admin") return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestión de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Administrá los agentes y sus configuraciones</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando usuarios...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Email</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Rol</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Equipo</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">Días Vac.</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                      {u.role === "admin" ? "Admin" : "Agente"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.team?.name ?? <span className="text-slate-400 italic">Sin equipo</span>}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{u.diasVacaciones}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition mr-1"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {u.id !== session?.user?.id && (
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{editingUser ? "Editar usuario" : "Nuevo usuario"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre completo</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña {editingUser && <span className="text-slate-400 dark:text-slate-500 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editingUser ? "••••••••" : "Contraseña inicial"}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="agent">Agente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Días de vacaciones</label>
                  <input type="number" min={0} max={60} value={form.diasVacaciones}
                    onChange={(e) => setForm((f) => ({ ...f, diasVacaciones: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Equipo</label>
                <select value={form.teamId} onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin equipo</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t dark:border-slate-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={saveUser}
                disabled={saving || !form.name || !form.email || (!editingUser && !form.password)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
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
