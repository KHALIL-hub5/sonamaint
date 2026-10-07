import { Monitor } from "lucide-react";
import type {
  Bureau,
  ChangeCategory,
  ChangeClass,
  EngineerProfile,
  Intervention,
  PcSpecs,
  PcSummary,
  SpecChangeRecord,
  StatMetric,
} from "../types";

export const DEFAULT_PROFILE: EngineerProfile = {
  name: "Khalil Djaidja",
  role: "Ingénieur système",
  site: "Direction Informatique — Hydra",
  initials: "KD",
};

export const DEFAULT_METRICS: StatMetric[] = [
  {
    id: "pcs",
    label: "Postes enregistrés",
    value: 1284,
    caption: "Parc informatique inventorié",
    icon: Monitor,
    trend: "up",
    delta: "+32 ce mois",
    tone: "neutral",
  },
];

export const DEFAULT_INTERVENTIONS: Intervention[] = [
  {
    id: "INT-4821",
    bureau: "B-104",
    equipmentId: "PC-DZ-01142",
    type: "hardware",
    categoryId: "cat-ram",
    classId: "cls-replacement",
    description: "Barrette RAM 8 Go remplacée, poste redémarré et testé",
    technician: "M. Belkacem",
    timestamp: "Il y a 18 min",
  },
  {
    id: "INT-4820",
    bureau: "B-212",
    equipmentId: "PC-DZ-00873",
    type: "software",
    categoryId: "cat-os",
    classId: "cls-upgrade",
    description: "Migration Windows 11 + réinstallation client SAP",
    technician: "S. Hamdi",
    timestamp: "Il y a 1 h 05",
  },
  {
    id: "INT-4819",
    bureau: "B-007",
    equipmentId: "PC-DZ-01501",
    type: "hardware",
    categoryId: "cat-storage",
    classId: "cls-install",
    description: "Disque SSD 512 Go installé, image système restaurée",
    technician: "K. Djaidja",
    timestamp: "Il y a 3 h",
  },
  {
    id: "INT-4818",
    bureau: "B-315",
    equipmentId: "PC-DZ-00204",
    type: "software",
    categoryId: "cat-antivirus",
    classId: "cls-error",
    description: "Antivirus corporate redéployé après échec de mise à jour",
    technician: "N. Ferhat",
    timestamp: "Hier, 16:42",
  },
  {
    id: "INT-4817",
    bureau: "B-104",
    equipmentId: "PC-DZ-01143",
    type: "hardware",
    categoryId: "cat-psu",
    classId: "cls-replacement",
    description: "Alimentation 500 W changée suite à coupure répétée",
    technician: "M. Belkacem",
    timestamp: "Hier, 11:20",
  },
];

export const CHANGE_CATEGORIES: ChangeCategory[] = [
  { id: "cat-ram", label: "Mémoire / RAM", kind: "hardware" },
  { id: "cat-storage", label: "Extension de stockage", kind: "hardware" },
  { id: "cat-blackscreen", label: "Écran noir", kind: "hardware" },
  { id: "cat-psu", label: "Alimentation", kind: "hardware" },
  { id: "cat-os", label: "Système d’exploitation", kind: "software" },
  { id: "cat-antivirus", label: "Antivirus", kind: "software" },
];

export const CHANGE_CLASSES: ChangeClass[] = [
  { id: "cls-error", label: "Erreur" },
  { id: "cls-install", label: "Installation" },
  { id: "cls-upgrade", label: "Mise à niveau" },
  { id: "cls-replacement", label: "Remplacement" },
];

export const DEFAULT_PCS: PcSummary[] = [
  {
    id: "1",
    equipmentId: "PC-DZ-01142",
    bureau: "B-104",
    building: "Bâtiment A — 1er étage",
    status: "operational",
  },
  {
    id: "2",
    equipmentId: "PC-DZ-00873",
    bureau: "B-212",
    building: "Bâtiment B — 2e étage",
    status: "operational",
  },
  {
    id: "3",
    equipmentId: "PC-DZ-01501",
    bureau: "B-007",
    building: "Bâtiment A — Rez-de-chaussée",
    status: "maintenance",
  },
  {
    id: "4",
    equipmentId: "PC-DZ-00204",
    bureau: "B-315",
    building: "Bâtiment C — 3e étage",
    status: "operational",
  },
  {
    id: "5",
    equipmentId: "PC-DZ-01143",
    bureau: "B-104",
    building: "Bâtiment A — 1er étage",
    status: "incident",
  },
];

export const BUREAUS: Bureau[] = [
  {
    id: "B-104",
    label: "B-104",
    building: "Bâtiment A — 1er étage",
    pcs: [
      {
        id: "1",
        equipmentId: "PC-DZ-01142",
        user: "M. Belkacem",
        status: "operational",
      },
      {
        id: "2",
        equipmentId: "PC-DZ-01143",
        user: "A. Cherif",
        status: "incident",
      },
    ],
  },
  {
    id: "B-212",
    label: "B-212",
    building: "Bâtiment B — 2e étage",
    pcs: [
      {
        id: "3",
        equipmentId: "PC-DZ-00873",
        user: "S. Hamdi",
        status: "operational",
      },
    ],
  },
  {
    id: "B-007",
    label: "B-007",
    building: "Bâtiment A — Rez-de-chaussée",
    pcs: [
      {
        id: "4",
        equipmentId: "PC-DZ-01501",
        user: "K. Djaidja",
        status: "operational",
      },
    ],
  },
  {
    id: "B-315",
    label: "B-315",
    building: "Bâtiment C — 3e étage",
    pcs: [
      {
        id: "5",
        equipmentId: "PC-DZ-00204",
        user: "N. Ferhat",
        status: "maintenance",
      },
    ],
  },
];

export const DEFAULT_PC: PcSpecs = {
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

export const DEFAULT_PC_HISTORY: SpecChangeRecord[] = [
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
