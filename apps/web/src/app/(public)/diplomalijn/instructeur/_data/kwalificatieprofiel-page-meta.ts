import {
  findKwalificatieprofiel,
  type KwalificatieprofielId,
} from "./kwalificatieprofielen";

export function getKwalificatieprofielPageMeta(profielId: KwalificatieprofielId) {
  const profiel = findKwalificatieprofiel(profielId);
  if (!profiel) return null;

  return {
    title: `${profiel.title} (${profiel.level})`,
    description: profiel.subtitle,
    order: profiel.order,
  };
}

export const I1_PAGE = getKwalificatieprofielPageMeta("I1")!;
export const I2_PAGE = getKwalificatieprofielPageMeta("I2")!;
export const I3_PAGE = getKwalificatieprofielPageMeta("I3")!;
export const I4_PAGE = getKwalificatieprofielPageMeta("I4")!;
export const I5_PAGE = getKwalificatieprofielPageMeta("I5")!;
export const L4_PAGE = getKwalificatieprofielPageMeta("L4")!;
export const L5_PAGE = getKwalificatieprofielPageMeta("L5")!;
export const B4_PAGE = getKwalificatieprofielPageMeta("B4")!;
export const B5_PAGE = getKwalificatieprofielPageMeta("B5")!;
