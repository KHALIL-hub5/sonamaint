import { LogOut, Wrench } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import type { EngineerProfile } from "../types";
import { DEFAULT_PROFILE } from "../data/mockData";

export default function Layout({
  profile = DEFAULT_PROFILE,
}: {
  profile?: EngineerProfile;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-slate-900">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              Sona<span className="text-orange-500">Maint</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 py-1.5 pl-1.5 pr-3 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-sm font-semibold text-slate-900">
                {profile.initials}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium text-white">
                  {profile.name}
                </span>
                <span className="block text-xs text-slate-400">
                  {profile.role} · {profile.site}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
