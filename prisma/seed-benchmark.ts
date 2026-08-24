import { PrismaClient, Role, CustomerStatus, ProductStatus, TicketPriority, TicketCategory, TicketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BATCH_SIZE = 1000;

async function main() {
  console.log('⚡ Starting OpsPilot 35,000+ Record Benchmark Seeding Challenge...');
  const overallStart = Date.now();

  // Ensure Admin User exists
  let admin = await prisma.user.findUnique({ where: { email: 'admin@opspilot.com' } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Benchmark Admin',
        email: 'admin@opspilot.com',
        passwordHash,
        role: Role.ADMIN,
      },
    });
  }

  // Ensure Categories exist
  let categories = await prisma.category.findMany();
  if (categories.length === 0) {
    categories = await Promise.all([
      prisma.category.create({ data: { name: 'Compute Infrastructure', slug: 'compute', description: 'Cloud servers' } }),
      prisma.category.create({ data: { name: 'Storage Solutions', slug: 'storage', description: 'NVMe arrays' } }),
      prisma.category.create({ data: { name: 'Networking Hardware', slug: 'networking', description: 'Switches and routers' } }),
      prisma.category.create({ data: { name: 'Enterprise Software', slug: 'software', description: 'SaaS licenses' } }),
      prisma.category.create({ data: { name: 'Security Appliances', slug: 'security', description: 'Firewalls and HSMs' } }),
    ]);
  }

  // 1. Seed 10,000 Customers
  console.log('📦 Seeding 10,000 Customers...');
  const customerStart = Date.now();
  const customerStatuses: CustomerStatus[] = [CustomerStatus.ACTIVE, CustomerStatus.INACTIVE, CustomerStatus.LEAD];

  for (let batch = 0; batch < 10; batch++) {
    const customerBatch = [];
    for (let i = 1; i <= BATCH_SIZE; i++) {
      const idx = batch * BATCH_SIZE + i;
      customerBatch.push({
        name: `Enterprise Client ${idx}`,
        email: `client.${idx}@benchmark-corp.com`,
        phone: `+1-555-${String(idx).padStart(4, '0')}`,
        company: `Corporation ${((idx % 250) + 1)} Inc`,
        status: customerStatuses[idx % customerStatuses.length],
        notes: `High performance test customer profile index #${idx}`,
      });
    }
    await prisma.customer.createMany({ data: customerBatch });
    process.stdout.write(`  Inserted ${((batch + 1) * BATCH_SIZE)} / 10,000 customers\r`);
  }
  console.log(`\n✅ 10,000 Customers created in ${((Date.now() - customerStart) / 1000).toFixed(2)}s`);

  // Fetch sample customer IDs for ticket referencing
  const sampleCustomers = await prisma.customer.findMany({
    select: { id: true },
    take: 2000,
  });
  const customerIds = sampleCustomers.map((c) => c.id);

  // 2. Seed 5,000 Products
  console.log('📦 Seeding 5,000 Products...');
  const productStart = Date.now();
  const productStatuses: ProductStatus[] = [
    ProductStatus.IN_STOCK,
    ProductStatus.LOW_STOCK,
    ProductStatus.OUT_OF_STOCK,
    ProductStatus.DISCONTINUED,
  ];

  for (let batch = 0; batch < 5; batch++) {
    const productBatch = [];
    for (let i = 1; i <= BATCH_SIZE; i++) {
      const idx = batch * BATCH_SIZE + i;
      const categoryId = categories[idx % categories.length].id;
      productBatch.push({
        name: `High-Density Server Node Series-${idx}`,
        sku: `SKU-BENCH-${String(idx).padStart(6, '0')}`,
        description: `Enterprise benchmark testing unit #${idx} with multi-core acceleration.`,
        categoryId,
        price: parseFloat((100 + (idx % 4900) + 0.99).toFixed(2)),
        stock: (idx % 150) * 5,
        status: productStatuses[idx % productStatuses.length],
      });
    }
    await prisma.product.createMany({ data: productBatch });
    process.stdout.write(`  Inserted ${((batch + 1) * BATCH_SIZE)} / 5,000 products\r`);
  }
  console.log(`\n✅ 5,000 Products created in ${((Date.now() - productStart) / 1000).toFixed(2)}s`);

  // 3. Seed 20,000 Support Tickets
  console.log('📦 Seeding 20,000 Support Tickets...');
  const ticketStart = Date.now();
  const priorities: TicketPriority[] = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT];
  const ticketCategories: TicketCategory[] = [
    TicketCategory.BILLING,
    TicketCategory.TECHNICAL,
    TicketCategory.DELIVERY,
    TicketCategory.ACCOUNT,
    TicketCategory.GENERAL,
  ];
  const ticketStatuses: TicketStatus[] = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ];

  for (let batch = 0; batch < 20; batch++) {
    const ticketBatch = [];
    for (let i = 1; i <= BATCH_SIZE; i++) {
      const idx = batch * BATCH_SIZE + i;
      const customerId = customerIds[idx % customerIds.length];
      const priority = priorities[idx % priorities.length];
      const category = ticketCategories[idx % ticketCategories.length];
      const status = ticketStatuses[idx % ticketStatuses.length];

      ticketBatch.push({
        ticketNumber: `BENCH-${String(idx).padStart(6, '0')}`,
        customerId,
        createdByUserId: admin.id,
        subject: `Performance Ticket #${idx}: Issue with ${category.toLowerCase()} processing`,
        description: `Detailed description for high-volume benchmark ticket index #${idx}. Evaluating database query planner index lookup time and search scalability.`,
        priority,
        category,
        status,
        createdAt: new Date(Date.now() - (idx * 360000)), // Spread over past few months
      });
    }
    await prisma.ticket.createMany({ data: ticketBatch });
    process.stdout.write(`  Inserted ${((batch + 1) * BATCH_SIZE)} / 20,000 tickets\r`);
  }
  console.log(`\n✅ 20,000 Tickets created in ${((Date.now() - ticketStart) / 1000).toFixed(2)}s`);

  const totalTime = ((Date.now() - overallStart) / 1000).toFixed(2);
  console.log(`\n🏆 Benchmark Seeding Completed! 35,000+ Records inserted in ${totalTime}s`);
}

main()
  .catch((e) => {
    console.error('❌ Benchmark Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
