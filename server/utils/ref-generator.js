import { queryOne } from '../database/init.js';

export function generateRefNo(fiscalYear) {
  const last = queryOne(
    "SELECT MAX(CAST(SUBSTR(reference_no, -3) AS INTEGER)) as num FROM aspirasi WHERE fiscal_year = ?",
    [fiscalYear]
  );
  const next = (last?.num || 0) + 1;
  return `ASP-${fiscalYear}-${String(next).padStart(3, '0')}`;
}
