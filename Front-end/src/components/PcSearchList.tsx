import { useMemo, useState } from "react";
import { ChevronRight, Monitor, X } from "lucide-react";
import { DEFAULT_PCS } from "../data/mockData";
import type { Intervention, PcStatus, PcSummary } from "../types";

const STATUS_LABEL: Record<PcStatus, { text: string; className: string }> = {
  operational: {
    text: "Opérationnel",
    className: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  in_stock: {
    text: "En stock",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  maintenance: {
    text: "En maintenance",
    className: "bg-blue-50 text-blue-600 ring-blue-200",
  },
  incident: {
    text: "Incident",
    className: "bg-orange-50 text-orange-600 ring-orange-200",
  },
};

export default function PcSearchList({
  pcs,
  interventions,
  onOpenPc,
  onOpenIntervention,
}: {
  pcs?: PcSummary[];
  interventions?: Intervention[];
  onOpenPc?: (pcId: string) => void;
  onOpenIntervention?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const availablePcs =
    pcs ??
    interventions?.map((item) => ({
      id: item.id,
      equipmentId: item.equipmentId,
      bureau: item.bureau,
      building: "Bâtiment A — 1er étage",
      status:
        item.id === "INT-4819" ? "maintenance" : ("operational" as PcStatus),
    })) ??
    DEFAULT_PCS;
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return availablePcs;
    return availablePcs.filter(
      (pc) =>
        pc.equipmentId.toLowerCase().includes(value) ||
        pc.bureau.toLowerCase().includes(value),
    );
  }, [availablePcs, query]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Parc informatique
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Recherchez un poste par identifiant ou par bureau.
        </p>
        <div className="relative mt-4">
          <SearchInput value={query} onChange={setQuery} />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">
          Aucun poste ne correspond à « {query.trim()} ».
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filtered.map((pc) => {
            const status = STATUS_LABEL[pc.status];
            return (
              <li key={pc.id}>
                <button
                  type="button"
                  onClick={() => (onOpenPc ?? onOpenIntervention)?.(pc.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Monitor className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-sm font-medium text-slate-900">
                        {pc.equipmentId}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {pc.bureau} — {pc.building}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}
                    >
                      {status.text}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Monitor className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="PC-DZ-01142, B-104…"
        aria-label="Rechercher un PC par identifiant ou bureau"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
      />
    </>
  );
}
