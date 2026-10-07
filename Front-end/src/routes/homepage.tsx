import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PcSearchList from "../components/PcSearchList";
import {
  DEFAULT_METRICS,
  DEFAULT_PCS,
  DEFAULT_PROFILE,
} from "../data/mockData";
import type { EngineerProfile, StatMetric } from "../types";

function StatCard({ metric }: { metric: StatMetric }) {
  const Icon = metric.icon;
  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : null;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg bg-slate-900/5 p-2.5 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
          {metric.delta}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
        {metric.value.toLocaleString("fr-DZ")}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{metric.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {metric.caption}
      </p>
    </article>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        Actions rapides
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Les trois opérations les plus fréquentes de la journée.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate("/intervention/new")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Enregistrer une intervention
        </button>
        <button
          type="button"
          onClick={() => navigate("/pc/new")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter un nouveau PC
        </button>
      </div>
    </section>
  );
}

export default function HomePage({
  profile = DEFAULT_PROFILE,
  metrics = DEFAULT_METRICS,
}: {
  profile?: EngineerProfile;
  metrics?: StatMetric[];
}) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Bonjour {profile.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">jeudi 17 septembre 2026</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Synchronisé il y a 2 min
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:max-w-xs">
        {metrics.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <PcSearchList
            pcs={DEFAULT_PCS}
            onOpenPc={(id) => {
              const pc = DEFAULT_PCS.find((item) => item.id === id);
              if (pc) navigate(`/pc/${pc.equipmentId}`);
            }}
          />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </main>
  );
}
