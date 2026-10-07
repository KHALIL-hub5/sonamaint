import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Monitor,
  UploadCloud,
  Wrench,
  X,
} from "lucide-react";
import { BUREAUS, DEFAULT_PCS } from "../data/mockData";
const categories = [
  { id: "cat-ram", label: "Mémoire / RAM" },
  { id: "cat-storage", label: "Extension de stockage" },
  { id: "cat-blackscreen", label: "Écran noir" },
  { id: "cat-psu", label: "Alimentation" },
  { id: "cat-os", label: "Système d’exploitation" },
  { id: "cat-antivirus", label: "Antivirus" },
];
const classes = [
  { id: "cls-error", label: "Erreur" },
  { id: "cls-install", label: "Installation" },
  { id: "cls-upgrade", label: "Mise à niveau" },
  { id: "cls-replacement", label: "Remplacement" },
];

export default function RegisterInterventionPage({
  onCancel,
  onSubmit,
}: {
  onCancel?: () => void;
  onSubmit?: (values: {
    bureauId: string;
    pcId: string;
    categoryId: string;
    classId: string;
    problemDescription: string;
    solutionDescription: string;
    evidence: File[];
  }) => void;
}) {
  const [bureauId, setBureauId] = useState("");
  const [pcId, setPcId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [classId, setClassId] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bureau = useMemo(
    () => BUREAUS.find((item) => item.id === bureauId),
    [bureauId],
  );
  const availablePcs = useMemo(
    () =>
      bureau
        ? bureau.pcs.map((pc) => pc.equipmentId)
        : DEFAULT_PCS.map((pc) => pc.equipmentId),
    [bureau],
  );
  const valid = bureauId && pcId && categoryId && classId && problem.trim();
  const addFiles = (list: FileList | null) => {
    if (list)
      setFiles((current) => [
        ...current,
        ...Array.from(list)
          .filter((file) => file.type.startsWith("image/"))
          .slice(0, 6 - current.length),
      ]);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit?.({
      bureauId,
      pcId,
      categoryId,
      classId,
      problemDescription: problem,
      solutionDescription: solution,
      evidence: files,
    });
    setSubmitted(true);
  };
  if (submitted)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-lg font-semibold">
            Intervention enregistrée
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {bureauId} ·{" "}
            {categories.find((item) => item.id === categoryId)?.label}
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
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </button>
        <h1 className="mt-4 text-2xl font-semibold">
          Enregistrer une intervention
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Renseignez l’équipement concerné, le type de changement, puis décrivez
          le problème et la solution apportée.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4 text-slate-500" />
              Localisation de l’équipement
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Bureau -- optionnale
                <select
                  value={bureauId}
                  onChange={(event) => {
                    setBureauId(event.target.value);
                    setPcId("");
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner un bureau</option>
                  {BUREAUS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} — {item.building}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Poste (PC)
                <select
                  value={pcId}
                  onChange={(event) => setPcId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <option value="">
                    {bureau ? "Sélectionner un poste" : "Tous les postes"}
                  </option>
                  {availablePcs.map((pc) => (
                    <option key={pc} value={pc}>
                      {pc}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Monitor className="h-4 w-4 text-slate-500" />
              Type de changement
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Type
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner un type</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Classe
                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4 text-slate-500" />
              Description du problème
            </h2>
            <textarea
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              placeholder="Décrivez le problème signalé…"
            />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              Preuves visuelles
            </h2>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500"
            >
              <UploadCloud className="h-7 w-7" />
              Ajouter des images ({files.length}/6)
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => addFiles(event.target.files)}
              className="hidden"
            />
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <Wrench className="h-4 w-4 text-orange-500" />
              Solution appliquée
            </h2>
            <textarea
              value={solution}
              onChange={(event) => setSolution(event.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              placeholder="Décrivez la solution appliquée…"
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
              Enregistrer l’intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
