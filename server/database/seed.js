import bcrypt from 'bcryptjs';
import { getDb, initDatabase, queryAll, queryOne, runSql, saveDb } from './init.js';

async function seed() {
  await initDatabase();

  // Check if already seeded
  const existing = queryOne('SELECT COUNT(*) as count FROM dprd_members');
  if (existing && existing.count > 0) {
    console.log('⚠️  Data sudah ada, skip seeding...');
    return;
  }

  const salt = await bcrypt.genSalt(10);

  // Seed DPRD Members
  const members = [
    ['Pak Alex', 'PAN', '0812-1111-1111'],
    ['Pak Widodo', 'PAN', '0812-2222-2222'],
    ['Pak Purwanto', 'PAN', '0812-3333-3333'],
    ['Pak Basuki', 'PAN', '0812-4444-4444'],
  ];
  for (const m of members) {
    runSql('INSERT INTO dprd_members (name, party, phone) VALUES (?, ?, ?)', m);
  }
  console.log('✅ 4 Anggota DPRD seeded');

  // Seed Users
  const superAdminHash = await bcrypt.hash('superadmin123', salt);
  const adminHash = await bcrypt.hash('admin123', salt);

  const users = [
    ['superadmin', superAdminHash, 'Super Administrator', 'superadmin', null],
    ['admin_alex', adminHash, 'Admin Pak Alex', 'admin', 1],
    ['admin_widodo', adminHash, 'Admin Pak Widodo', 'admin', 2],
    ['admin_purwanto', adminHash, 'Admin Pak Purwanto', 'admin', 3],
    ['admin_basuki', adminHash, 'Admin Pak Basuki', 'admin', 4],
  ];
  for (const u of users) {
    runSql('INSERT INTO users (username, password_hash, full_name, role, dprd_member_id) VALUES (?, ?, ?, ?, ?)', u);
  }
  console.log('✅ 5 Users seeded (1 superadmin + 4 admin)');

  // Seed sample aspirasi
  const sampleAspirasi = [
    ['ASP-2026-001', 1, 'penetapan', 'Ahmad Sulaiman', '081234567890', 'Jl. Merdeka No. 45, Kel. Sukajadi', 1500000000, 2026, 'verified', 2],
    ['ASP-2026-002', 1, 'perubahan', 'Budi Santoso', '081298765432', 'Jl. Pahlawan No. 12, Kel. Ciamis', 750000000, 2026, 'draft', 2],
    ['ASP-2026-003', 1, 'penetapan', 'Citra Dewi', '081356789012', 'Jl. Sudirman No. 88, Kel. Merdeka', 2000000000, 2026, 'verified', 2],
    ['ASP-2026-004', 2, 'penetapan', 'Deni Rahmat', '081412345678', 'Jl. Gatot Subroto No. 5, Kel. Kebon Baru', 500000000, 2026, 'verified', 3],
    ['ASP-2026-005', 2, 'perubahan', 'Eka Putri', '081567890123', 'Jl. Diponegoro No. 23, Kel. Cikutra', 1200000000, 2026, 'draft', 3],
    ['ASP-2026-006', 3, 'penetapan', 'Fajar Hidayat', '081623456789', 'Jl. Asia Afrika No. 77, Kel. Braga', 800000000, 2026, 'verified', 4],
    ['ASP-2026-007', 3, 'perubahan', 'Gita Lestari', '081734567890', 'Jl. Lengkong No. 30, Kel. Buah Batu', 950000000, 2026, 'verified', 4],
    ['ASP-2026-008', 4, 'penetapan', 'Hadi Pranoto', '081845678901', 'Jl. Soekarno-Hatta No. 100, Kel. Batununggal', 1800000000, 2026, 'draft', 5],
    ['ASP-2026-009', 4, 'penetapan', 'Indah Permata', '081956789012', 'Jl. Cihampelas No. 55, Kel. Cipaganti', 650000000, 2026, 'verified', 5],
    ['ASP-2026-010', 4, 'perubahan', 'Joko Widiyanto', '082012345678', 'Jl. Dago No. 15, Kel. Lebak Gede', 300000000, 2026, 'verified', 5],
  ];
  for (const a of sampleAspirasi) {
    runSql(
      'INSERT INTO aspirasi (reference_no, dprd_member_id, type, proposer_name, proposer_phone, proposer_address, budget_amount, fiscal_year, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      a
    );
  }
  console.log('✅ 10 Sample aspirasi seeded');

  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Super Admin   : superadmin / superadmin123');
  console.log('Admin Alex    : admin_alex / admin123');
  console.log('Admin Widodo  : admin_widodo / admin123');
  console.log('Admin Purwanto: admin_purwanto / admin123');
  console.log('Admin Basuki  : admin_basuki / admin123');
  console.log('─────────────────────────────────────');
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
