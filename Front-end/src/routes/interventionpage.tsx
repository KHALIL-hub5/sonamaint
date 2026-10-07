import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  Monitor,
  User,
  Wrench,
  X,
  Building2,
  Cpu,
  MemoryStick,
  HardDrive,
  MonitorSmartphone,
  Fingerprint,
  History,
} from "lucide-react";
import interventionPhoto from "../assets/Gemini_Generated_Image_myw0memyw0memyw0.jpg";
import type { ChangeKind, EvidencePhoto, InterventionDetail, PcSpecs, SpecChangeRecord } from "../types";


const DEFAULT_PC: PcSpecs = {
  equipmentId: "PC-DZ-01142",
  serialNumber: "SN-3XJ29A1",
  brand: "Dell",
  model: "OptiPlex 7010",
  bureau: "B-104",
  building: "Bâtiment A — 1er étage",
  assignedUser: "M. Belkacem",
  status: "operational",
  cpu: "Intel Core i5-12500",
  ram: "16 Go",
  storage: "SSD 512 Go",
  gpu: "Intel UHD 770 (intégré)",
  os: "Windows 11",
  osVersion: "23H2",
};

const DEFAULT_PC_HISTORY: SpecChangeRecord[] = [
  {
    id: "chg-1",
    field: "ram",
    fieldLabel: "Mémoire (RAM)",
    previousValue: "8 Go",
    newValue: "16 Go",
    date: "17 sept. 2026",
    technician: "M. Belkacem",
    interventionId: "INT-4821",
  },
  {
    id: "chg-2",
    field: "assignedUser",
    fieldLabel: "Utilisateur assigné",
    previousValue: "A. Cherif",
    newValue: "M. Belkacem",
    date: "17 sept. 2026",
    technician: "K. Djaidja",
    interventionId: "INT-4821",
  },
];

const DEFAULT_INTERVENTION: InterventionDetail = {
  id: "INT-4821",
  bureau: "B-104",
  building: "Bâtiment A — 1er étage",
  equipmentId: "PC-DZ-01142",
  kind: "hardware",
  categoryLabel: "Mémoire / RAM",
  classLabel: "Remplacement",
  reportedAt: "17 sept. 2026, 08:52",
  resolvedAt: "17 sept. 2026, 09:14",
  technician: "M. Belkacem",
  reportedBy: "A. Cherif",
  problemDescription:
    "Le poste redémarre de façon aléatoire et affiche un écran bleu avant l’ouverture de session. Le problème survient plusieurs fois par heure depuis hier.",
  solutionDescription:
    "Diagnostic mémoire effectué avec MemTest86 : une barrette de 8 Go présentait des erreurs. Barrette remplacée par une neuve de même référence, poste testé pendant 30 minutes sans incident. Session utilisateur restaurée et vérifiée avec l’utilisateur.",
  evidencePhotos: [
    {
      id: "p1",
      url: interventionPhoto,
      caption: "Intervention sur le PC du bureau B-104",
    },
    { id: "p2", url: "", caption: "Résultat du test MemTest86" },
    { id: "p3", url: "", caption: "Barrette défectueuse retirée" },
  ],
};

function KindTag({ kind }: { kind: ChangeKind }) {
  const hardware = kind === "hardware";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${hardware ? "bg-orange-50 text-orange-600 ring-orange-200" : "bg-blue-50 text-blue-600 ring-blue-200"}`}
    >
      <span className="font-mono">{hardware ? "[H]" : "[S]"}</span>
      {hardware ? "Matériel" : "Logiciel"}
    </span>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-xs text-slate-400">{label}</span>
        <span className="block text-sm font-medium text-slate-800">
          {value}
        </span>
      </span>
    </div>
  );
}

function Evidence({
  photo,
  onOpen,
}: {
  photo: EvidencePhoto;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 text-left hover:border-orange-300"
    >
      <span className="flex aspect-video items-center justify-center bg-slate-100 text-slate-300 group-hover:bg-slate-200">
        {photo.url ? (
          <img
            src={photo.url}
            alt={photo.caption}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-8 w-8" />
        )}
      </span>
      <span className="px-3 py-2 text-xs font-medium text-slate-600">
        {photo.caption}
      </span>
    </button>
  );
}

export default function InterventionDetailPage({
  intervention = DEFAULT_INTERVENTION,
  pc = DEFAULT_PC,
  history = DEFAULT_PC_HISTORY,
  onBack,
}: {
  intervention?: InterventionDetail;
  pc?: PcSpecs;
  history?: SpecChangeRecord[];
  onBack?: () => void;
}) {
  const [openPhoto, setOpenPhoto] = useState<EvidencePhoto | null>(null);
  const changedFields = useMemo(
    () => new Set(history.map((record) => record.field)),
    [history],
  );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux interventions
        </button>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KindTag kind={intervention.kind} />
                <span className="font-mono text-xs text-slate-400">
                  {intervention.id}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-semibold">
                {intervention.categoryLabel}
                <span className="text-slate-400">
                  {" "}
                  · {intervention.classLabel}
                </span>
              </h1>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Résolu
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <InfoField
              icon={Building2}
              label="Bureau"
              value={`${intervention.bureau} — ${intervention.building}`}
            />
            <InfoField
              icon={Monitor}
              label="Équipement"
              value={intervention.equipmentId}
            />

            <InfoField
              icon={Wrench}
              label="Technicien"
              value={intervention.technician}
            />
            <InfoField
              icon={Calendar}
              label="Signalé le"
              value={intervention.reportedAt}
            />
            <InfoField
              icon={CheckCircle2}
              label="Résolu le"
              value={intervention.resolvedAt}
            />
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Configuration actuelle du poste
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Les champs marqués « modifié » ont un historique ci-dessous.
          </p>
          <div className="mt-4 grid gap-1 sm:grid-cols-2">
            {(
              [
                [
                  Fingerprint,
                  "Marque / modèle",
                  `${pc.brand} ${pc.model}`,
                  "model",
                ],
                [Cpu, "Processeur", pc.cpu, "cpu"],
                [MemoryStick, "Mémoire (RAM)", pc.ram, "ram"],
                [HardDrive, "Stockage", pc.storage, "storage"],
                [MonitorSmartphone, "Carte graphique", pc.gpu, "gpu"],
                [
                  MonitorSmartphone,
                  "Système d’exploitation",
                  `${pc.os} · ${pc.osVersion}`,
                  "os",
                ],
              ] as const
            ).map(([Icon, label, value, field]) => (
              <div
                key={field}
                className="flex items-start gap-3 rounded-lg p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    {label}
                    {changedFields.has(field) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
                        <History className="h-2.5 w-2.5" />
                        modifié
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-slate-800">
                    {value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold">Historique du poste</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tout changement est conservé.
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {history.map((record) => {
              
              return (
                <div className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="w-36 shrink-0 text-sm font-medium">
                      {record.fieldLabel}
                    </div>
                    <div className="truncate text-sm text-slate-400 line-through">
                      {record.previousValue}
                    </div>

                    <div className="truncate text-sm font-medium">
                      {record.newValue}
                    </div>
                  </div>
                </div>
              );
            })}
          </ul>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">Problème signalé</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {intervention.problemDescription}
          </p>
          {intervention.evidencePhotos.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-medium text-slate-500">
                Preuves — captures d’écran et photos
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Cliquez sur une preuve pour l’agrandir.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {intervention.evidencePhotos.map((photo) => (
                  <Evidence
                    key={photo.id}
                    photo={photo}
                    onOpen={() => setOpenPhoto(photo)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            <h2 className="text-base font-semibold">Solution appliquée</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {intervention.solutionDescription}
          </p>
        </div>
      </div>
      {openPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
          onClick={() => setOpenPhoto(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpenPhoto(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-300">
              {openPhoto.url ? (
                <img
                  src={openPhoto.url}
                  alt={openPhoto.caption}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-16 w-16" />
              )}
            </div>
            <p className="px-5 py-4 text-sm font-medium">{openPhoto.caption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
