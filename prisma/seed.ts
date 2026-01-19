import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data (in correct order due to FK constraints)
  console.log("🧹 Clearing existing data...");
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.pPPSecret.deleteMany();
  await prisma.pPPProfile.deleteMany();
  await prisma.mikrotik.deleteMany();
  await prisma.paket.deleteMany();
  await prisma.area.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.package.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  console.log("   ✅ Database cleared\n");

  // Create Packages (SaaS)
  console.log("📦 Creating SaaS packages...");
  const packages = await Promise.all([
    prisma.package.create({
      data: {
        name: "Lite",
        price: 50000,
        maxMikrotik: 1,
        maxCustomers: 50,
        features: "Billing otomatis\nLaporan mingguan\nNotifikasi WA manual",
        isPopular: false,
      },
    }),
    prisma.package.create({
      data: {
        name: "Standard",
        price: 150000,
        maxMikrotik: 3,
        maxCustomers: 200,
        features: "Billing otomatis\nLaporan bulanan\nNotifikasi WA auto-reminder\nHelpdesk",
        isPopular: true,
      },
    }),
    prisma.package.create({
      data: {
        name: "Business",
        price: 300000,
        maxMikrotik: -1,
        maxCustomers: -1,
        features: "Billing otomatis\nLaporan real-time + Export Excel\nNotifikasi WA auto + blast\nHelpdesk prioritas\nAPI akses",
        isPopular: false,
      },
    }),
  ]);
  console.log(`   ✅ Created ${packages.length} packages\n`);

  // Create Bank Accounts
  console.log("🏦 Creating bank accounts...");
  const banks = await Promise.all([
    prisma.bank.create({
      data: {
        bankName: "BCA",
        accountNumber: "1234567890",
        accountName: "PT Mawar Net Indonesia",
        branch: "KCP Surabaya",
        isActive: true,
      },
    }),
    prisma.bank.create({
      data: {
        bankName: "BRI",
        accountNumber: "0987654321",
        accountName: "PT Mawar Net Indonesia",
        branch: "KC Surabaya",
        isActive: true,
      },
    }),
    prisma.bank.create({
      data: {
        bankName: "Mandiri",
        accountNumber: "1122334455",
        accountName: "PT Mawar Net Indonesia",
        branch: "KCP Tunjungan",
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${banks.length} bank accounts\n`);

  // Create Notification Templates
  console.log("📱 Creating notification templates...");
  const templates = await Promise.all([
    prisma.notificationTemplate.create({
      data: {
        name: "H-3 Reminder",
        trigger: "H-3",
        message:
          "Yth. {nama}, ini pengingat bahwa tagihan internet Anda sebesar {nominal} akan jatuh tempo pada tanggal {tanggal}. Silakan lakukan pembayaran. Terima kasih!",
        isActive: true,
      },
    }),
    prisma.notificationTemplate.create({
      data: {
        name: "Hari H",
        trigger: "H-0",
        message:
          "Yth. {nama}, tagihan internet Anda sebesar {nominal} jatuh tempo HARI INI. Segera lakukan pembayaran untuk menghindari pemutusan layanan. Link: {link_bayar}",
        isActive: true,
      },
    }),
    prisma.notificationTemplate.create({
      data: {
        name: "H+1 Isolir",
        trigger: "H+1",
        message:
          "Yth. {nama}, layanan internet Anda telah dinonaktifkan karena belum melakukan pembayaran. Silakan bayar {nominal} untuk mengaktifkan kembali. Link: {link_bayar}",
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${templates.length} notification templates\n`);

  // Create Super Admin
  console.log("👤 Creating super admin...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@mawar.id",
      password: hashPassword("admin123"),
      name: "Super Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`   ✅ Created admin: ${admin.email} (password: admin123)\n`);

  // Create Mitra Users
  console.log("👥 Creating mitra users...");
  const mitraData = [
    { email: "mitra1@example.com", name: "Mitra Jaya Net", status: "ACTIVE" },
    { email: "mitra2@example.com", name: "Net Lancar Abadi", status: "ACTIVE" },
    { email: "mitra3@example.com", name: "WiFi Nusantara", status: "PENDING" },
  ];

  const mitras = await Promise.all(
    mitraData.map((m) =>
      prisma.user.create({
        data: {
          email: m.email,
          password: hashPassword("mitra123"),
          name: m.name,
          role: "MITRA",
          status: m.status,
        },
      })
    )
  );
  console.log(`   ✅ Created ${mitras.length} mitra users (password: mitra123)\n`);

  // Create Mikrotik devices for first mitra
  console.log("📡 Creating Mikrotik devices...");
  const mikrotik = await prisma.mikrotik.create({
    data: {
      name: "Mikrotik Tower Utama",
      ip: "192.168.1.1",
      port: 8728,
      username: "admin",
      password: "mikrotik123",
      status: "online",
      userId: mitras[0].id,
    },
  });
  console.log(`   ✅ Created Mikrotik: ${mikrotik.name}\n`);

  // Create Paket WiFi for first mitra
  console.log("📶 Creating WiFi packages...");
  const pakets = await Promise.all([
    prisma.paket.create({
      data: {
        name: "Paket 10 Mbps",
        description: "Cocok untuk streaming video dan browsing",
        speed: "10M/10M",
        price: 100000,
        isActive: true,
        userId: mitras[0].id,
      },
    }),
    prisma.paket.create({
      data: {
        name: "Paket 20 Mbps",
        description: "Cocok untuk gaming dan WFH",
        speed: "20M/20M",
        price: 175000,
        isActive: true,
        userId: mitras[0].id,
      },
    }),
    prisma.paket.create({
      data: {
        name: "Paket Unlimited",
        description: "Untuk kebutuhan bisnis tanpa batas",
        speed: "50M/50M",
        price: 300000,
        isActive: true,
        userId: mitras[0].id,
      },
    }),
  ]);
  console.log(`   ✅ Created ${pakets.length} WiFi packages\n`);

  // Create Areas for first mitra
  console.log("📍 Creating areas...");
  const areas = await Promise.all([
    prisma.area.create({
      data: {
        name: "RT 01 RW 02 Sukamaju",
        description: "Area perumahan padat",
        userId: mitras[0].id,
      },
    }),
    prisma.area.create({
      data: {
        name: "Perumahan Green Garden",
        description: "Perumahan cluster baru",
        userId: mitras[0].id,
      },
    }),
  ]);
  console.log(`   ✅ Created ${areas.length} areas\n`);

  // Create Customers
  console.log("👨‍👩‍👧‍👦 Creating customers...");
  const customerData = [
    { name: "Budi Santoso", phone: "081234567890", username: "budi_pppoe" },
    { name: "Siti Rahayu", phone: "081234567891", username: "siti_pppoe" },
    { name: "Agus Wijaya", phone: "081234567892", username: "agus_pppoe" },
    { name: "Dewi Lestari", phone: "081234567893", username: "dewi_pppoe" },
    { name: "Rudi Hartono", phone: "081234567894", username: "rudi_pppoe" },
  ];

  const customers = await Promise.all(
    customerData.map((c, i) =>
      prisma.customer.create({
        data: {
          name: c.name,
          phone: c.phone,
          address: "Jl. Contoh No. " + Math.floor(Math.random() * 100),
          connectionType: "PPPOE",
          username: c.username,
          password: "pppoe123",
          mikrotikId: mikrotik.id,
          paketId: pakets[i % pakets.length].id,
          areaId: areas[i % areas.length].id,
          servicePrice: pakets[i % pakets.length].price,
          dueDate: Math.floor(Math.random() * 28) + 1,
          status: "ACTIVE",
        },
      })
    )
  );
  console.log(`   ✅ Created ${customers.length} customers\n`);

  // Create Invoices
  console.log("📄 Creating invoices...");
  const now = new Date();
  const invoices = await Promise.all(
    customers.map((customer, i) =>
      prisma.invoice.create({
        data: {
          invoiceNo: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`,
          amount: customer.servicePrice,
          status: i < 3 ? "PAID" : "UNPAID",
          dueDate: new Date(now.getFullYear(), now.getMonth(), customer.dueDate),
          paidAt: i < 3 ? new Date() : null,
          userId: mitras[0].id,
          description: `Tagihan ${customer.name} - ${now.toLocaleString("id-ID", { month: "long", year: "numeric" })}`,
        },
      })
    )
  );
  console.log(`   ✅ Created ${invoices.length} invoices\n`);

  console.log("====================================");
  console.log("🎉 Seeding completed successfully!\n");
  console.log("📝 Login Credentials:");
  console.log("   Admin: admin@mawar.id / admin123");
  console.log("   Mitra: mitra1@example.com / mitra123");
  console.log("====================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
