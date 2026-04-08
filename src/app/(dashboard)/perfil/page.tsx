"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PROVINCIAS, LOCALIDADES_POR_PROVINCIA } from "@/lib/argentina";
import { useTheme } from "@/components/providers/ThemeProvider";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  calle: string | null;
  localidad: string | null;
  provincia: string | null;
  celular: string | null;
}

const EMPTY_PWD = { current: "", new: "", confirm: "" };

export default function PerfilPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Address / contact form
  const [calle, setCalle] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [celular, setCelular] = useState("");

  // Password form
  const [pwd, setPwd] = useState(EMPTY_PWD);
  const [showPwd, setShowPwd] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        if (!r.ok) return;
        const data: ProfileData = await r.json();
        setProfile(data);
        setCalle(data.calle ?? "");
        setProvincia(data.provincia ?? "");
        setLocalidad(data.localidad ?? "");
        setCelular(data.celular ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  const localidades = provincia ? (LOCALIDADES_POR_PROVINCIA[provincia] ?? []) : [];

  function handleProvinciaChange(val: string) {
    setProvincia(val);
    setLocalidad("");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calle, provincia, localidad, celular }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setSuccessMsg("Datos guardados correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg("Error al guardar. Intentá de nuevo.");
    }
    setSaving(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");
    if (pwd.new !== pwd.confirm) {
      setPwdError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (pwd.new.length < 6) {
      setPwdError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSavingPwd(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.new }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwdSuccess("Contraseña actualizada correctamente.");
      setPwd(EMPTY_PWD);
      setTimeout(() => setPwdSuccess(""), 3000);
    } else {
      setPwdError(data.error ?? "Error al cambiar la contraseña.");
    }
    setSavingPwd(false);
  }

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Cargando...</div>;
  }

  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Editá tu información personal y contraseña</p>
      </div>

      {/* Avatar + info badge */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{profile.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${profile.role === "admin" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
          {profile.role === "admin" ? "Admin" : "Agente"}
        </span>
      </div>

      {/* Theme selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-5">
        <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Tema de la interfaz
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              theme === "light"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
            }`}
          >
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
            Tema claro
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              theme === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
            }`}
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
            Tema oscuro
          </button>
        </div>
      </div>

      {/* Address & Contact form */}
      <form onSubmit={saveProfile} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-5">
        <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Dirección y contacto
        </h2>

        <div className="space-y-4">
          {/* Calle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Calle y número
            </label>
            <input
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Corrientes 1234"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Provincia
            </label>
            <select
              value={provincia}
              onChange={(e) => handleProvinciaChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Seleccioná una provincia —</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Localidad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Localidad
            </label>
            {localidades.length > 0 ? (
              <select
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Seleccioná una localidad —</option>
                {localidades.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder={provincia ? "Ingresá la localidad" : "Primero seleccióna una provincia"}
                disabled={!provincia}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400"
              />
            )}
          </div>

          {/* Celular */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Celular
            </label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Ej: 1123456789"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Código de área sin 0 + número sin 15 (solo números)</p>
              </div>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={savePassword} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Cambiar contraseña
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña actual</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={pwd.current}
                onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                placeholder="Contraseña actual"
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva contraseña</label>
            <input
              type={showPwd ? "text" : "password"}
              value={pwd.new}
              onChange={(e) => setPwd((p) => ({ ...p, new: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar nueva contraseña</label>
            <input
              type={showPwd ? "text" : "password"}
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Repetí la nueva contraseña"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {pwdError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwdError}</div>
        )}
        {pwdSuccess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {pwdSuccess}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={savingPwd || !pwd.current || !pwd.new || !pwd.confirm}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
          >
            {savingPwd ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
}
