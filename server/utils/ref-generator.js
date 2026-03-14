import { supabase } from '../database/init.js';

export async function generateRefNo(fiscalYear) {
  try {
    const { data, error } = await supabase
      .from('aspirasi')
      .select('reference_no')
      .eq('fiscal_year', fiscalYear)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    let num = 0;
    if (data && data.reference_no) {
      const parts = data.reference_no.split('-');
      if (parts.length === 3) {
        num = parseInt(parts[2], 10);
      }
    }

    const next = num + 1;
    return `ASP-${fiscalYear}-${String(next).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating ref no:', err);
    // Fallback safe reference
    return `ASP-${fiscalYear}-${String(Date.now()).slice(-3)}`;
  }
}
