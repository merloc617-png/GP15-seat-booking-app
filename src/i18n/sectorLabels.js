import { t } from './i18n.js';

/**
 * @param {{ getId?: () => string, getName?: () => string, sectorId?: string, sectorName?: string }} sector
 */
export function getSectorLabel(sector) {
  const id = sector?.getId?.() ?? sector?.sectorId ?? '';
  const fallback = sector?.getName?.() ?? sector?.sectorName ?? id;
  const key = `sector.${id}`;
  const translated = t(key);
  return translated === key ? fallback : translated;
}
