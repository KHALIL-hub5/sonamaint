import interventionPhoto from "../assets/Gemini_Generated_Image_myw0memyw0memyw0.jpg";
import { CHANGE_CATEGORIES, CHANGE_CLASSES } from "../data/mockData";
import type { Intervention, InterventionDetail } from "../types";

export function toInterventionDetail(item: Intervention): InterventionDetail {
  return {
    id: item.id,
    bureau: item.bureau,
    building: "Bâtiment A — 1er étage",
    equipmentId: item.equipmentId,
    kind: item.type,
    categoryLabel: CHANGE_CATEGORIES.find((category) => category.id === item.categoryId)?.label ?? "Intervention",
    classLabel: CHANGE_CLASSES.find((changeClass) => changeClass.id === item.classId)?.label ?? "Intervention",
    reportedAt: item.timestamp,
    resolvedAt: item.timestamp,
    technician: item.technician,
    reportedBy: "Utilisateur",
    problemDescription: item.description,
    solutionDescription: item.description,
    evidencePhotos: item.id === "INT-4821"
      ? [{ id: "p1", url: interventionPhoto, caption: "Intervention sur le PC du bureau B-104" }]
      : [],
  };
}
