import type { LucideIcon } from "lucide-react";

export type ChangeType = "H" | "S";
export type ChangeKind = "hardware" | "software";
export type Trend = "up" | "down" | "flat";
export type PcStatus = "operational" | "in_stock" | "maintenance" | "incident";

export interface Category {
  id: string;
  name: string;
}

export interface TypeItem {
  id: string;
  categoryId: string;
  typeChange: string;
}

export interface InterventionChange {
  id: string;
  pcSerialNumber: string;
  bureau: string;
  changeType: ChangeType;
  categoryId: string;
  typeItemId: string;
  customTypeChange?: string;
  oldValue: string;
  description: string;
  solution: string;
  screenshotUrl?: string;
  createdAt: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  caption: string;
  icon: LucideIcon;
  trend: Trend;
  delta: string;
  tone: "neutral" | "alert" | "success";
}

export interface Intervention {
  id: string;
  bureau: string;
  equipmentId: string;
  type: ChangeKind;
  categoryId: string;
  classId: string;
  description: string;
  technician: string;
  timestamp: string;
}

export interface EngineerProfile {
  name: string;
  role: string;
  site: string;
  initials: string;
}

export interface BureauPc {
  id: string;
  equipmentId: string;
  user: string;
  status: Exclude<PcStatus, "in_stock">;
}

export interface Bureau {
  id: string;
  label: string;
  building: string;
  pcs: BureauPc[];
}

export interface ChangeCategory {
  id: string;
  label: string;
  kind: ChangeKind;
}

export interface ChangeClass {
  id: string;
  label: string;
}

export interface PcSummary {
  id: string;
  equipmentId: string;
  bureau: string;
  building: string;
  status: PcStatus;
}

export interface PcSpecs {
  equipmentId: string;
  serialNumber: string;
  brand: string;
  model: string;
  bureau: string;
  building: string;
  assignedUser: string;
  status: PcStatus;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  os: string;
  osVersion: string;
}

export interface PcIntervention {
  id: string;
  categoryId: string;
  classId: string;
  description: string;
  technician: string;
  timestamp: string;
  date: string;
  previousValue?: string;
  newValue?: string;
}

export interface EvidencePhoto {
  id: string;
  url: string;
  caption: string;
}

export interface InterventionDetail {
  id: string;
  bureau: string;
  building: string;
  equipmentId: string;
  kind: ChangeKind;
  categoryLabel: string;
  classLabel: string;
  reportedAt: string;
  resolvedAt: string;
  technician: string;
  reportedBy: string;
  problemDescription: string;
  solutionDescription: string;
  evidencePhotos: EvidencePhoto[];
}

export interface SpecChangeRecord {
  id: string;
  field: keyof PcSpecs;
  fieldLabel: string;
  previousValue: string;
  newValue: string;
  date: string;
  technician: string;
  interventionId: string;
}

export interface NewPcFormValues {
  equipmentId: string;
  serialNumber: string;
  bureauId: string;
  assignedUser: string;
  brand: string;
  model: string;
  cpu: string;
  ramGb: string;
  storageType: "hdd" | "ssd";
  storageGb: string;
  gpu: string;
  os: string;
  osVersion: string;
  status: Exclude<PcStatus, "incident">;
  notes: string;
}

export interface RegisterInterventionValues {
  bureauId: string;
  pcId: string;
  categoryId: string;
  classId: string;
  problemDescription: string;
  solutionDescription: string;
  evidence: File[];
}
