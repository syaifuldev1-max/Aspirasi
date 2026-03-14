import { Router } from 'express';
import { supabase } from '../database/init.js';
import { authMiddleware, dprdFilter } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { generateRefNo } from '../utils/ref-generator.js';
import * as res from '../utils/response.js';

const router = Router();

// Helper to upload a file to Supabase Storage
async function uploadToSupabaseStorage(file) {
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '')}`;
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`photos/${uniqueName}`, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(`photos/${uniqueName}`);
  return publicUrlData.publicUrl;
}

// GET /api/aspirasi
router.get('/', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('aspirasi')
      .select('*, dprd_members ( name )', { count: 'exact' });

    // Filters
    if (req.dprdMemberId) {
      query = query.eq('dprd_member_id', req.dprdMemberId);
    } else if (req.query.dprd_member_id) {
      query = query.eq('dprd_member_id', parseInt(req.query.dprd_member_id));
    }

    if (req.query.type) query = query.eq('type', req.query.type);
    if (req.query.fiscal_year) query = query.eq('fiscal_year', parseInt(req.query.fiscal_year));
    if (req.query.status) query = query.eq('status', req.query.status);
    
    if (req.query.search) {
      query = query.or(`proposer_name.ilike.%${req.query.search}%,reference_no.ilike.%${req.query.search}%`);
    }

    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? true : false;
    const allowedSorts = ['created_at', 'budget_amount', 'proposer_name', 'reference_no'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';

    query = query.order(safeSort, { ascending: order })
                 .range(offset, offset + limit - 1);

    const { data: rawData, count, error } = await query;
    if (error) throw error;

    const data = rawData.map(r => ({
      ...r,
      dprd_name: r.dprd_members?.name || null,
      dprd_members: undefined
    }));

    return res.paginated(reply, data, count || 0, page, limit);
  } catch (err) {
    console.error('Error fetching aspirasi:', err);
    return res.error(reply, 500, 'Gagal mengambil data aspirasi');
  }
});

// GET /api/aspirasi/:id
router.get('/:id', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const targetId = parseInt(req.params.id);

    const { data: aspirasi, error } = await supabase
      .from('aspirasi')
      .select('*, dprd_members(name), users(full_name), photos(*)')
      .eq('id', targetId)
      .maybeSingle();

    if (error) throw error;
    if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');

    if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    const result = {
      ...aspirasi,
      dprd_name: aspirasi.dprd_members?.name || null,
      created_by_name: aspirasi.users?.full_name || null,
      dprd_members: undefined,
      users: undefined
    };

    return res.success(reply, result);
  } catch (err) {
    console.error('Error fetching aspirasi by id:', err);
    return res.error(reply, 500, 'Gagal mengambil aspirasi');
  }
});

// POST /api/aspirasi
router.post('/', authMiddleware, dprdFilter, upload.array('photos', 5), async (req, reply) => {
  try {
    const { type, proposer_name, proposer_phone, proposer_address, description, budget_amount } = req.body;
    let dprdMemberId = req.dprdMemberId;

    if (req.user.role === 'superadmin') {
      dprdMemberId = parseInt(req.body.dprd_member_id);
      if (!dprdMemberId) return res.error(reply, 400, 'VALIDATION_ERROR', 'Pilih anggota DPRD tujuan');
    }

    if (!type || !proposer_name || !budget_amount) {
      return res.error(reply, 400, 'VALIDATION_ERROR', 'Tipe, nama pengusul, dan anggaran wajib diisi');
    }
    if (!['penetapan', 'perubahan'].includes(type)) {
      return res.error(reply, 400, 'VALIDATION_ERROR', 'Tipe harus penetapan atau perubahan');
    }

    const fiscalYear = new Date().getFullYear();
    const referenceNo = await generateRefNo(fiscalYear);

    const checkDuplicate = await supabase.from('aspirasi').select('id').eq('reference_no', referenceNo).maybeSingle();
    // Re-generate if extremely rare collision occurs
    const safeRefNo = checkDuplicate.data ? await generateRefNo(fiscalYear) : referenceNo;

    const { data: newAspirasi, error: insertError } = await supabase.from('aspirasi').insert({
      reference_no: safeRefNo,
      dprd_member_id: dprdMemberId,
      type,
      proposer_name,
      proposer_phone: proposer_phone || null,
      proposer_address: proposer_address || null,
      description: description || null,
      budget_amount: parseFloat(budget_amount),
      fiscal_year: fiscalYear,
      created_by: req.user.id
    }).select().single();

    if (insertError) throw insertError;
    const aspirasiId = newAspirasi.id;

    // Handle Uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const publicUrl = await uploadToSupabaseStorage(file);
          await supabase.from('photos').insert({
            aspirasi_id: aspirasiId,
            file_path: publicUrl,
            original_name: file.originalname,
            file_size: file.size
          });
        } catch (uploadError) {
          console.error('Failed to upload a photo:', uploadError);
        }
      }
    }

    const { data: completeAspirasi } = await supabase.from('aspirasi').select('*, photos(*)').eq('id', aspirasiId).single();

    return res.success(reply, completeAspirasi, 'Aspirasi berhasil disimpan', 201);
  } catch (err) {
    console.error('Create aspirasi error:', err);
    return res.error(reply, 500, 'Gagal menyimpan aspirasi');
  }
});

// PUT /api/aspirasi/:id
router.put('/:id', authMiddleware, dprdFilter, upload.array('photos', 5), async (req, reply) => {
  try {
    const targetId = parseInt(req.params.id);
    const { data: aspirasi, error: fetchErr } = await supabase.from('aspirasi').select('*').eq('id', targetId).maybeSingle();
    
    if (fetchErr) throw fetchErr;
    if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
    if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    const { type, proposer_name, proposer_phone, proposer_address, description, budget_amount, status } = req.body;
    
    const { error: updateError } = await supabase.from('aspirasi').update({
      type: type || aspirasi.type,
      proposer_name: proposer_name || aspirasi.proposer_name,
      proposer_phone: proposer_phone || aspirasi.proposer_phone,
      proposer_address: proposer_address || aspirasi.proposer_address,
      description: description ?? aspirasi.description,
      budget_amount: budget_amount ? parseFloat(budget_amount) : aspirasi.budget_amount,
      status: status || aspirasi.status,
      updated_at: new Date().toISOString()
    }).eq('id', targetId);

    if (updateError) throw updateError;

    // Handle Uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const publicUrl = await uploadToSupabaseStorage(file);
          await supabase.from('photos').insert({
            aspirasi_id: targetId,
            file_path: publicUrl,
            original_name: file.originalname,
            file_size: file.size
          });
        } catch (uploadError) {
          console.error('Failed to upload a photo:', uploadError);
        }
      }
    }

    const { data: updated } = await supabase.from('aspirasi').select('*, photos(*)').eq('id', targetId).single();
    return res.success(reply, updated, 'Aspirasi berhasil diperbarui');
  } catch (err) {
    console.error('Update aspirasi error:', err);
    return res.error(reply, 500, 'Gagal memperbarui aspirasi');
  }
});

// DELETE /api/aspirasi/:id
router.delete('/:id', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const targetId = parseInt(req.params.id);
    const { data: aspirasi } = await supabase.from('aspirasi').select('*').eq('id', targetId).maybeSingle();
    
    if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
    if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    // Optional: Delete physical files from storage if we want to save space
    // For now we just delete DB records
    // Photos table has ON DELETE CASCADE, but for safety we can delete explicitly if needed.
    await supabase.from('aspirasi').delete().eq('id', targetId);
    
    return res.success(reply, null, 'Aspirasi berhasil dihapus');
  } catch (err) {
    console.error('Delete aspirasi error:', err);
    return res.error(reply, 500, 'Gagal menghapus aspirasi');
  }
});

// PATCH /api/aspirasi/:id/status
router.patch('/:id/status', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const targetId = parseInt(req.params.id);
    const { status } = req.body;
    if (!status || !['draft', 'verified', 'rejected'].includes(status)) {
      return res.error(reply, 400, 'VALIDATION_ERROR', 'Status harus draft, verified, atau rejected');
    }

    const { data: aspirasi } = await supabase.from('aspirasi').select('*').eq('id', targetId).maybeSingle();
    if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
    if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    await supabase.from('aspirasi').update({
      status,
      updated_at: new Date().toISOString()
    }).eq('id', targetId);

    return res.success(reply, { id: targetId, status }, 'Status berhasil diperbarui');
  } catch (err) {
    console.error('Update status aspirasi error:', err);
    return res.error(reply, 500, 'Gagal memperbarui status aspirasi');
  }
});

export default router;
