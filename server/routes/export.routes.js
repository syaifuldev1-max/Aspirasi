import { Router } from 'express';
import { supabase } from '../database/init.js';
import { authMiddleware, dprdFilter } from '../middleware/auth.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();

// Helper to fetch export data
async function fetchExportData(req) {
  const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
  
  let query = supabase
    .from('aspirasi')
    .select(`
      reference_no, type, proposer_name, proposer_phone, proposer_address, budget_amount, status, created_at,
      dprd_members ( name )
    `)
    .eq('fiscal_year', fiscalYear)
    .order('created_at', { ascending: false });

  if (req.dprdMemberId) {
    query = query.eq('dprd_member_id', req.dprdMemberId);
  }
  if (req.query.type) {
    query = query.eq('type', req.query.type);
  }

  const { data: rawData, error } = await query;
  if (error) throw error;

  return rawData.map(r => ({
    ...r,
    dprd_name: r.dprd_members?.name || '-'
  }));
}

// GET /api/export/excel
router.get('/excel', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
    const data = await fetchExportData(req);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aspirasi DPRD System';
    const sheet = workbook.addWorksheet('Laporan Aspirasi');

    sheet.columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'No. Referensi', key: 'reference_no', width: 18 },
      { header: 'Anggota DPRD', key: 'dprd_name', width: 18 },
      { header: 'Tipe', key: 'type', width: 15 },
      { header: 'Nama Pengusul', key: 'proposer_name', width: 22 },
      { header: 'No. HP', key: 'proposer_phone', width: 16 },
      { header: 'Alamat', key: 'proposer_address', width: 30 },
      { header: 'Anggaran (Rp)', key: 'budget_amount', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal', key: 'created_at', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28166F' } };

    data.forEach((row, i) => {
      sheet.addRow({
        no: i + 1, reference_no: row.reference_no, dprd_name: row.dprd_name,
        type: row.type === 'penetapan' ? 'Penetapan (Murni)' : 'Perubahan (P-APBD)',
        proposer_name: row.proposer_name, proposer_phone: row.proposer_phone || '-',
        proposer_address: row.proposer_address || '-', budget_amount: Number(row.budget_amount),
        status: row.status.charAt(0).toUpperCase() + row.status.slice(1), created_at: row.created_at,
      });
    });

    sheet.getColumn('budget_amount').numFmt = '#,##0';

    const totalRow = sheet.addRow({
      no: '', reference_no: '', dprd_name: '', type: '', proposer_name: '',
      proposer_phone: '', proposer_address: 'TOTAL ANGGARAN:',
      budget_amount: data.reduce((sum, r) => sum + Number(r.budget_amount), 0), status: '', created_at: ''
    });
    totalRow.font = { bold: true };

    reply.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.setHeader('Content-Disposition', `attachment; filename=Laporan_Aspirasi_${fiscalYear}.xlsx`);
    await workbook.xlsx.write(reply);
    reply.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    reply.status(500).json({ status: 'error', message: 'Gagal export Excel' });
  }
});

// GET /api/export/pdf
router.get('/pdf', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
    const data = await fetchExportData(req);

    const summary = {
      total: data.length,
      budget: data.reduce((sum, r) => sum + Number(r.budget_amount), 0)
    };

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    reply.setHeader('Content-Type', 'application/pdf');
    reply.setHeader('Content-Disposition', `attachment; filename=Laporan_Aspirasi_${fiscalYear}.pdf`);
    doc.pipe(reply);

    doc.fontSize(18).font('Helvetica-Bold').text(`Laporan Aspirasi DPRD - Tahun ${fiscalYear}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Total: ${summary.total} aspirasi  |  Total Anggaran: Rp ${summary.budget.toLocaleString('id-ID')}`, { align: 'center' });
    doc.moveDown(1);

    const tableTop = doc.y;
    const headers = ['No', 'Referensi', 'DPRD', 'Tipe', 'Pengusul', 'Anggaran', 'Status'];
    const colWidths = [30, 90, 90, 80, 120, 120, 70];
    let x = 40;

    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.rect(x, tableTop, colWidths[i], 18).fill('#28166F');
      doc.fillColor('#FFFFFF').text(h, x + 4, tableTop + 5, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 18;
    data.forEach((row, i) => {
      if (y > 530) { doc.addPage(); y = 40; }
      x = 40;
      const rowData = [
        String(i + 1), row.reference_no, row.dprd_name,
        row.type === 'penetapan' ? 'Penetapan' : 'Perubahan',
        row.proposer_name, `Rp ${Number(row.budget_amount).toLocaleString('id-ID')}`, row.status
      ];
      const bg = i % 2 === 0 ? '#F3F1FA' : '#FFFFFF';
      rowData.forEach((val, j) => {
        doc.rect(x, y, colWidths[j], 16).fill(bg);
        doc.fillColor('#1A1440').fontSize(7).text(val, x + 4, y + 4, { width: colWidths[j] - 8 });
        x += colWidths[j];
      });
      y += 16;
    });

    doc.end();
  } catch (err) {
    console.error('Export PDF error:', err);
    reply.status(500).json({ status: 'error', message: 'Gagal export PDF' });
  }
});

export default router;
