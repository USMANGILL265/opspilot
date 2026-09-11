import { PrismaClient, Role, CustomerStatus, ProductStatus, TicketPriority, TicketCategory, TicketStatus, Sentiment, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding OpsPilot database...');

  // 1. Clean existing records (in reverse relation order)
  await prisma.activityLog.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketAssignment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.task.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users with Hashed Passwords
  const adminPassword = await bcrypt.hash('AdminPass123!', 10);
  const managerPassword = await bcrypt.hash('ManagerPass123!', 10);
  const employeePassword = await bcrypt.hash('EmployeePass123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Muhammad Usman Gill (Admin)',
      email: 'admin@opspilot.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Operations Manager)',
      email: 'manager@opspilot.com',
      passwordHash: managerPassword,
      role: Role.MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Support Specialist)',
      email: 'employee@opspilot.com',
      passwordHash: employeePassword,
      role: Role.EMPLOYEE,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  console.log('✅ Created 3 standard role users (Admin, Manager, Employee)');

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Cloud Infrastructure', slug: 'cloud-infrastructure', description: 'Servers, clusters, storage' } }),
    prisma.category.create({ data: { name: 'Enterprise Software', slug: 'enterprise-software', description: 'SaaS licenses, ERP, CRM tools' } }),
    prisma.category.create({ data: { name: 'Hardware & Workstations', slug: 'hardware-workstations', description: 'Developer laptops, monitors, accessories' } }),
    prisma.category.create({ data: { name: 'Logistics & Shipping', slug: 'logistics-shipping', description: 'Courier, packaging, freight' } }),
    prisma.category.create({ data: { name: 'Security & Compliance', slug: 'security-compliance', description: 'Certificates, firewalls, audit tools' } }),
  ]);

  console.log(`✅ Created ${categories.length} product categories`);

  // 4. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Acme Global Logistics',
      email: 'contact@acmelogistics.com',
      phone: '+1 (555) 234-5678',
      company: 'Acme Corporation',
      status: CustomerStatus.ACTIVE,
      notes: 'Key enterprise account with global supply chain dependencies.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Apex FinTech Solutions',
      email: 'ops@apexfintech.io',
      phone: '+1 (555) 876-5432',
      company: 'Apex Financial Inc',
      status: CustomerStatus.ACTIVE,
      notes: 'High volume payment gateway integration customer.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Quantum BioLabs',
      email: 'procurement@quantumbio.org',
      phone: '+1 (555) 345-9876',
      company: 'Quantum Health Labs',
      status: CustomerStatus.LEAD,
      notes: 'Evaluating Enterprise tier migration.',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Starlight Retailers',
      email: 'support@starlight.store',
      phone: '+1 (555) 901-2345',
      company: 'Starlight Corp',
      status: CustomerStatus.INACTIVE,
      notes: 'Seasonal ecommerce store.',
    },
  });

  console.log('✅ Created 4 sample enterprise customers');

  const generatedCustomers = Array.from({ length: 100 }, (_, index) => {
    const customerNumber = index + 1;
    const statuses: CustomerStatus[] = [CustomerStatus.ACTIVE, CustomerStatus.INACTIVE, CustomerStatus.LEAD];

    return {
      name: `Sample Customer ${customerNumber}`,
      email: `customer${customerNumber}@sample.opspilot.com`,
      phone: `+1 (555) 700-${String(customerNumber).padStart(4, '0')}`,
      company: `Sample Company ${customerNumber}`,
      status: statuses[index % statuses.length],
      notes: `Generated demo customer record ${customerNumber}.`,
    };
  });
  await prisma.customer.createMany({ data: generatedCustomers });
  const customers = await prisma.customer.findMany({ select: { id: true } });
  console.log(`✅ Created ${customers.length} total customers`);

  // 5. Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'OpsPilot Enterprise Core Server',
        sku: 'OPS-SRV-001',
        description: 'Dedicated high-throughput computing node with 64 vCPU and 256GB ECC RAM.',
        categoryId: categories[0].id,
        price: 2499.0,
        stock: 42,
        status: ProductStatus.IN_STOCK,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cloud Armor Firewall Appliance',
        sku: 'SEC-ARM-102',
        description: 'Next-generation DDoS mitigation and layer 7 WAF inspection appliance.',
        categoryId: categories[4].id,
        price: 899.5,
        stock: 15,
        status: ProductStatus.IN_STOCK,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Precision Developer Workstation 16X',
        sku: 'HW-DEV-550',
        description: 'AI development laptop with RTX 4090 GPU and 64GB DDR5 memory.',
        categoryId: categories[2].id,
        price: 3200.0,
        stock: 4,
        status: ProductStatus.LOW_STOCK,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Annual AI Automation Seat',
        sku: 'SW-LIC-AI-YEAR',
        description: 'Unlimited access to automated background triaging and LLM response assistants.',
        categoryId: categories[1].id,
        price: 480.0,
        stock: 999,
        status: ProductStatus.IN_STOCK,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} sample products`);

  const generatedProducts = Array.from({ length: 100 }, (_, index) => {
    const productNumber = index + 1;
    const statuses: ProductStatus[] = [
      ProductStatus.IN_STOCK,
      ProductStatus.LOW_STOCK,
      ProductStatus.OUT_OF_STOCK,
      ProductStatus.DISCONTINUED,
    ];

    return {
      name: `Sample Operations Product ${productNumber}`,
      sku: `OPS-SAMPLE-${String(productNumber).padStart(4, '0')}`,
      description: `Generated demo product record ${productNumber} for catalog testing.`,
      categoryId: categories[index % categories.length].id,
      price: Number((49.99 + (index % 80) * 25.5).toFixed(2)),
      stock: (index * 7) % 250,
      status: statuses[index % statuses.length],
    };
  });
  await prisma.product.createMany({ data: generatedProducts });
  console.log(`✅ Created ${products.length + generatedProducts.length} total products`);

  // 6. Create Support Tickets with AI Analysis & Comments
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'OP-1001',
      customerId: customer1.id,
      createdByUserId: employee.id,
      assignedToUserId: employee.id,
      subject: 'Critical shipment tracking stopped updating 48 hours ago',
      description: 'Customer reports that shipment tracking container #US-8891 has been stuck at the transit hub for over 48 hours without any telemetry update. The cargo contains time-sensitive components.',
      priority: TicketPriority.HIGH,
      category: TicketCategory.DELIVERY,
      status: TicketStatus.IN_PROGRESS,
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      ticketId: ticket1.id,
      provider: 'fallback',
      model: 'heuristic-nlp-v1',
      priority: TicketPriority.HIGH,
      category: TicketCategory.DELIVERY,
      sentiment: Sentiment.NEGATIVE,
      summary: 'Customer Acme Global Logistics reports container #US-8891 tracking stopped updating for 48 hours. Requires urgent delivery follow-up.',
      suggestedResponse: 'Hello Acme Logistics Team,\n\nThank you for alerting us. We have initiated a direct tracer with our hub freight manager regarding container #US-8891 to unblock telemetry and expedite delivery.\n\nBest regards,\nOpsPilot Operations',
      nextAction: 'Contact Chicago logistics transit dispatch and verify container scan status.',
      processingTimeMs: 45,
    },
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: ticket1.id,
      userId: employee.id,
      content: 'Called freight hub supervisor. Container is clearing customs scan and telemetry will update by 3 PM.',
      isInternal: true,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'OP-1002',
      customerId: customer2.id,
      createdByUserId: employee.id,
      assignedToUserId: manager.id,
      subject: 'Invoice #INV-2026-088 shows duplicate processing fee',
      description: 'Apex FinTech noticed an extra $120 surcharge listed on invoice #INV-2026-088 for the cloud storage tier. Requesting a credit memo or revised billing statement.',
      priority: TicketPriority.MEDIUM,
      category: TicketCategory.BILLING,
      status: TicketStatus.OPEN,
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      ticketId: ticket2.id,
      provider: 'fallback',
      model: 'heuristic-nlp-v1',
      priority: TicketPriority.MEDIUM,
      category: TicketCategory.BILLING,
      sentiment: Sentiment.NEUTRAL,
      summary: 'Apex FinTech Solutions is inquiring about a duplicate $120 processing surcharge on invoice #INV-2026-088.',
      suggestedResponse: 'Hello Apex FinTech Team,\n\nWe have reviewed invoice #INV-2026-088. We have issued a credit adjustment of $120 to your account ledger.\n\nBest regards,\nOpsPilot Finance',
      nextAction: 'Verify billing ledger transaction ID and issue credit memo in accounting module.',
      processingTimeMs: 38,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'OP-1003',
      customerId: customer3.id,
      createdByUserId: manager.id,
      assignedToUserId: admin.id,
      subject: 'SSO SAML authentication integration query for 500 seats',
      description: 'Quantum BioLabs wants to configure Okta SSO SAML 2.0 federation before onboarding their research staff next month.',
      priority: TicketPriority.LOW,
      category: TicketCategory.TECHNICAL,
      status: TicketStatus.RESOLVED,
      resolvedAt: new Date(),
    },
  });

  console.log('✅ Created 3 support tickets with AI analyses and comments');

  const priorities: TicketPriority[] = [
    TicketPriority.LOW,
    TicketPriority.MEDIUM,
    TicketPriority.HIGH,
    TicketPriority.URGENT,
  ];
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
  const supportUsers = [admin, manager, employee];
  const generatedTickets = Array.from({ length: 100 }, (_, index) => {
    const ticketNumber = index + 1;
    const status = ticketStatuses[index % ticketStatuses.length];

    return {
      ticketNumber: `OP-SAMPLE-${String(ticketNumber).padStart(4, '0')}`,
      customerId: customers[index % customers.length].id,
      createdByUserId: supportUsers[index % supportUsers.length].id,
      assignedToUserId: supportUsers[(index + 1) % supportUsers.length].id,
      subject: `Sample support request ${ticketNumber}`,
      description: `Generated demo ticket ${ticketNumber} for ${ticketCategories[index % ticketCategories.length].toLowerCase()} workflow testing.`,
      priority: priorities[index % priorities.length],
      category: ticketCategories[index % ticketCategories.length],
      status,
      resolvedAt: status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED ? new Date() : null,
      createdAt: new Date(Date.now() - index * 3600000),
    };
  });
  await prisma.ticket.createMany({ data: generatedTickets });
  console.log(`✅ Created ${generatedTickets.length + 3} total support tickets`);

  // 7. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Review Q3 Enterprise Customer Renewals',
        description: 'Prepare executive summaries for top 10 accounts.',
        status: TaskStatus.IN_PROGRESS,
        assignedToUserId: manager.id,
        dueDate: new Date(Date.now() + 86400000 * 3),
      },
      {
        title: 'Calibrate AI Model Confidence Thresholds',
        description: 'Verify sentiment classification precision against latest benchmark tickets.',
        status: TaskStatus.COMPLETED,
        assignedToUserId: admin.id,
      },
      {
        title: 'Audit Inventory for Developer Laptops',
        description: 'Re-order workstation stock when below 5 units.',
        status: TaskStatus.PENDING,
        assignedToUserId: employee.id,
        dueDate: new Date(Date.now() + 86400000 * 5),
      },
    ],
  });

  console.log('✅ Created 3 operational tasks');

  // 8. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'SYSTEM',
        entityId: 'ROOT',
        details: JSON.stringify({ message: 'OpsPilot production seed initialized' }),
      },
      {
        userId: employee.id,
        action: 'CREATE_TICKET',
        entityType: 'TICKET',
        entityId: ticket1.id,
        details: JSON.stringify({ ticketNumber: 'OP-1001', customer: 'Acme Global Logistics' }),
      },
      {
        userId: employee.id,
        action: 'AI_TICKET_ANALYSIS',
        entityType: 'TICKET',
        entityId: ticket1.id,
        details: JSON.stringify({ sentiment: 'NEGATIVE', priority: 'HIGH', provider: 'fallback' }),
      },
      {
        userId: manager.id,
        action: 'CREATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: customer1.id,
        details: JSON.stringify({ name: 'Acme Global Logistics' }),
      },
    ],
  });

  console.log('✅ Created activity audit logs');
  console.log('🎉 Standard Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
