import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CHANGE_CATEGORIES, CHANGE_CLASSES } from "../data/mockData";
import type { Intervention, ChangeKind } from "../types";

function KindTag({ kind }: { kind: ChangeKind }) {
  const hardware = kind === "hardware";
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${hardware ? "bg-orange-50 text-orange-600 ring-orange-200" : "bg-blue-50 text-blue-600 ring-blue-200"}`}
    >
      <span className="font-mono">{hardware ? "[H]" : "[S]"}</span>
      {hardware ? "Matériel" : "Logiciel"}
    </span>
  );
}

export default function InterventionsList({
  interventions,
  onOpenIntervention,
  onOpenHistory,
}: {
  interventions: Intervention[];
  onOpenIntervention?: (id: string) => void;
  onOpenHistory?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const categoryById = useMemo(
    () =>
      new Map(CHANGE_CATEGORIES.map((category) => [category.id, category])),
    [],
  );
  const classById = useMemo(
    () =>
      new Map(
        CHANGE_CLASSES.map((changeClass) => [changeClass.id, changeClass]),
      ),
    [],
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Dernières interventions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cliquez sur une intervention pour voir le détail.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            Tout l’historique
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {
        <ul className="divide-y divide-slate-100">
          {interventions.map((item) => {
            const category = categoryById.get(item.categoryId);
            const changeClass = classById.get(item.classId);
            const expanded = expandedId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="w-16 shrink-0 font-mono text-sm font-medium text-slate-900">
                      {item.bureau}
                    </span>
                    <span className="w-28 shrink-0 truncate font-mono text-sm text-slate-600">
                      {item.equipmentId}
                    </span>
                    {category && <KindTag kind={category.kind} />}
                    <span className="truncate text-sm text-slate-700">
                      {category?.label ?? "—"}
                      {changeClass && (
                        <span className="text-slate-400">
                          {" "}
                          · {changeClass.label}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="whitespace-nowrap text-sm text-slate-500">
                      {item.timestamp}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <p className="text-sm text-slate-700">{item.description}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      Technicien :{" "}
                      <span className="font-medium text-slate-700">
                        {item.technician}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenIntervention?.(item.id)}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-600"
                    >
                      Voir la fiche complète
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      }
    </section>
  );
}
