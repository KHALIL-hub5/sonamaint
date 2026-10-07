import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Cpu,
  Fingerprint,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
} from "lucide-react";
import type { NewPcFormValues } from "../types";
const bureaus = [
  { id: "B-104", building: "Bâtiment A — 1er étage" },
  { id: "B-212", building: "Bâtiment B — 2e étage" },
  { id: "B-007", building: "Bâtiment A — Rez-de-chaussée" },
  { id: "B-315", building: "Bâtiment C — 3e étage" },
];
const ram = ["4 Go", "8 Go", "16 Go", "32 Go", "64 Go"];
const storage = ["128 Go", "256 Go", "512 Go", "1 To", "2 To"];
const systems = [
  "Windows 10",
  "Windows 11",
  "Ubuntu 22.04 LTS",
  "Ubuntu 24.04 LTS",
  "Autre",
];
const empty: NewPcFormValues = {
  equipmentId: "",
  serialNumber: "",
  bureauId: "",
  assignedUser: "",
  brand: "",
  model: "",
  cpu: "",
  ramGb: "",
  storageType: "ssd",
  storageGb: "",
  gpu: "",
  os: "",
  osVersion: "",
  status: "operational",
  notes: "",
};
const input =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-orange-500 focus:bg-white focus:outline-none";

export default function AddPcPage({
  onCancel,
  onSubmit,
}: {
  onCancel?: () => void;
  onSubmit?: (values: NewPcFormValues) => void;
}) {
  const [values, setValues] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const update = <K extends keyof NewPcFormValues>(
    key: K,
    value: NewPcFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));
  const bureau = useMemo(
    () => bureaus.find((item) => item.id === values.bureauId),
    [values.bureauId],
  );
  const valid =
    values.equipmentId.trim() &&
    values.serialNumber.trim() &&
    values.bureauId &&
    values.cpu.trim() &&
    values.ramGb &&
    values.storageGb &&
    values.os;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit?.(values);
    setSubmitted(true);
  };
  if (submitted)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-lg font-semibold">Poste ajouté au parc</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {values.equipmentId} · {bureau?.id}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-slate-50 pb-8 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </button>
        <h1 className="mt-4 text-2xl font-semibold">Ajouter un nouveau PC</h1>
        <p className="mt-1 text-sm text-slate-500">
          Renseignez l’identification, l’affectation et la configuration du
          poste.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Fingerprint className="h-4 w-4 text-slate-500" />
              Identification
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["equipmentId", "Identifiant équipement", "PC-DZ-01142"],
                  ["serialNumber", "Numéro de série", "SN-3XJ29A1"],
                  ["brand", "Marque", "Dell, HP, Lenovo…"],
                  ["model", "Modèle", "OptiPlex 7010"],
                ] as const
              ).map(([key, label, placeholder]) => (
                <label key={key} className="text-sm font-medium">
                  {label}
                  {key === "equipmentId" || key === "serialNumber" ? " *" : ""}
                  <input
                    value={values[key]}
                    onChange={(event) => update(key, event.target.value)}
                    placeholder={placeholder}
                    className={`${input} ${key === "equipmentId" || key === "serialNumber" ? "font-mono" : ""}`}
                  />
                </label>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4 text-slate-500" />
              Affectation
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Bureau *
                <select
                  value={values.bureauId}
                  onChange={(event) => update("bureauId", event.target.value)}
                  className={input}
                >
                  <option value="">Sélectionner un bureau</option>
                  {bureaus.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} — {item.building}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                État
                <select
                  value={values.status}
                  onChange={(event) =>
                    update(
                      "status",
                      event.target.value as NewPcFormValues["status"],
                    )
                  }
                  className={input}
                >
                  <option value="operational">Opérationnel</option>
                  <option value="in_stock">En stock</option>
                  <option value="maintenance">En maintenance</option>
                </select>
              </label>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Cpu className="h-4 w-4 text-slate-500" />
              Configuration matérielle
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Processeur (CPU) *
                <input
                  value={values.cpu}
                  onChange={(event) => update("cpu", event.target.value)}
                  placeholder="Intel Core i5-12500"
                  className={input}
                />
              </label>
              <label className="text-sm font-medium">
                Carte graphique (GPU)
                <input
                  value={values.gpu}
                  onChange={(event) => update("gpu", event.target.value)}
                  placeholder="Intel UHD 770"
                  className={input}
                />
              </label>
              <label className="text-sm font-medium">
                <span className="flex items-center gap-1">
                  <MemoryStick className="h-3.5 w-3.5" />
                  Mémoire (RAM) *
                </span>
                <select
                  value={values.ramGb}
                  onChange={(event) => update("ramGb", event.target.value)}
                  className={input}
                >
                  <option value="">Sélectionner</option>
                  {ram.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  Stockage *
                </span>
                <span className="flex gap-2">
                  <select
                    value={values.storageType}
                    onChange={(event) =>
                      update("storageType", event.target.value as "hdd" | "ssd")
                    }
                    className={`${input} mt-1.5 w-24`}
                  >
                    <option value="ssd">SSD</option>
                    <option value="hdd">HDD</option>
                  </select>
                  <select
                    value={values.storageGb}
                    onChange={(event) =>
                      update("storageGb", event.target.value)
                    }
                    className={input}
                  >
                    <option value="">Capacité</option>
                    {storage.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <MonitorSmartphone className="h-4 w-4 text-slate-500" />
              Système d’exploitation
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                OS *
                <select
                  value={values.os}
                  onChange={(event) => update("os", event.target.value)}
                  className={input}
                >
                  <option value="">Sélectionner</option>
                  {systems.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Version / build
                <input
                  value={values.osVersion}
                  onChange={(event) => update("osVersion", event.target.value)}
                  placeholder="23H2"
                  className={input}
                />
              </label>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Notes</h2>
            <textarea
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={3}
              className={input}
              placeholder="Toute information complémentaire…"
            />
          </section>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              Ajouter le poste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
