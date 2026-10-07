import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

import type { PcIntervention, PcSpecs } from "../types";
const categories = [
  { id: "cat-ram", label: "Mémoire / RAM", kind: "hardware" },
  { id: "cat-storage", label: "Extension de stockage", kind: "hardware" },
  { id: "cat-blackscreen", label: "Écran noir", kind: "hardware" },
  { id: "cat-psu", label: "Alimentation", kind: "hardware" },
  { id: "cat-os", label: "Système d’exploitation", kind: "software" },
  { id: "cat-antivirus", label: "Antivirus", kind: "software" },
];
const classes = [
  { id: "cls-error", label: "Erreur" },
  { id: "cls-install", label: "Installation" },
  { id: "cls-upgrade", label: "Mise à niveau" },
  { id: "cls-replacement", label: "Remplacement" },
];
const statusLabels = {
  operational: "Opérationnel",
  in_stock: "En stock",
  maintenance: "En maintenance",
  incident: "Incident",
};

export default function PcInfoPage({
  pc,
  interventions,
  onBack,
  onOpenIntervention,
}: {
  pc: PcSpecs;
  interventions: PcIntervention[];
  onBack?: () => void;
  onOpenIntervention?: (interventionId: string) => void;
}) {
  const [category, setCategory] = useState("all");
  const [changeClass, setChangeClass] = useState("all");
  const [period, setPeriod] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      interventions.filter(
        (item) =>
          (category === "all" || item.categoryId === category) &&
          (changeClass === "all" || item.classId === changeClass) &&
          (period === "all" ||
            (period === "30d"
              ? item.date >= "2026-08-18"
              : period === "90d"
                ? item.date >= "2026-06-19"
                : item.date >= "2026-09-10")),
      ),
    [interventions, category, changeClass, period],
  );
  const catMap = new Map(categories.map((item) => [item.id, item]));
  const classMap = new Map(classes.map((item) => [item.id, item.label]));
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-slate-400">
                {pc.serialNumber}
              </p>
              <h1 className="mt-1 text-xl font-semibold">{pc.equipmentId}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {pc.brand} {pc.model}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
              {statusLabels[pc.status]}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              {pc.bureau} — {pc.building}
            </span>
            
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Configuration</h2>
          <div className="mt-4 grid gap-1 sm:grid-cols-2">
            {(
              [
                [Cpu, "Processeur", pc.cpu],
                [MemoryStick, "Mémoire (RAM)", pc.ram],
                [HardDrive, "Stockage", pc.storage],
                [Monitor, "Carte graphique", pc.gpu],
                [
                  Monitor,
                  "Système d’exploitation",
                  `${pc.os} · ${pc.osVersion}`,
                ],
              ] as const
            ).map(([Icon, label, value]) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-lg p-3"
              >
                <Icon className="mt-1 h-4 w-4 text-slate-400" />
                <span>
                  <span className="block text-xs text-slate-400">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold">Interventions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Toutes les interventions réalisées sur ce poste.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="all">Tous les types</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={changeClass}
                onChange={(event) => setChangeClass(event.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="all">Toutes les classes</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="all">Toute la période</option>
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
              </select>
              {(category !== "all" ||
                changeClass !== "all" ||
                period !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("all");
                    setChangeClass("all");
                    setPeriod("all");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-slate-500"
                >
                  <X className="h-3.5 w-3.5" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Aucune intervention ne correspond à ces filtres.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const cat = catMap.get(item.categoryId);
                const isExpanded = expandedId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) => (current === item.id ? null : item.id))
                      }
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${cat?.kind === "hardware" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}
                        >
                          {cat?.kind === "hardware" ? "[H]" : "[S]"}
                        </span>
                        <span className="truncate text-sm">
                          {cat?.label}{" "}
                          <span className="text-slate-400">
                            · {classMap.get(item.classId)}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-sm text-slate-500">
                        {item.timestamp}
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                        <p className="text-sm text-slate-700">{item.description}</p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400 line-through">
                              {item.previousValue ?? "—"}
                            </span>
                            <span className="text-slate-300">→</span>
                            <span className="font-medium text-slate-900">
                              {item.newValue ?? "—"}
                            </span>
                          </span>
                          <span className="text-xs text-slate-500">
                            Technicien : <span className="font-medium text-slate-700">{item.technician}</span>
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <span className="font-mono text-xs text-slate-400">{item.id}</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenIntervention?.(item.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          >
                            Voir la fiche intervention
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
