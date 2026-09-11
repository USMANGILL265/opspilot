import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'OpsPilot API Documentation',
      version: '1.0.0',
      description:
        'Production-grade RESTful API for OpsPilot AI-Enabled Business Operations Platform.',
      contact: {
        name: 'Muhammad Usman Gill',
        email: 'admin@opspilot.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'opspilot_session',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string', nullable: true },
            company: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'LEAD'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            sku: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            stock: { type: 'integer' },
            status: { type: 'string', enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'] },
            categoryId: { type: 'string', nullable: true },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            ticketNumber: { type: 'string' },
            subject: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            category: { type: 'string', enum: ['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL'] },
            status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'] },
            customerId: { type: 'string' },
            assignedToUserId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            assignedToUserId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AIAnalysis: {
          type: 'object',
          properties: {
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            category: { type: 'string', enum: ['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL'] },
            sentiment: { type: 'string', enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] },
            summary: { type: 'string' },
            suggestedResponse: { type: 'string' },
            nextAction: { type: 'string' },
            processingTimeMs: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'User successfully registered' },
            '409': { description: 'Email already exists' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Authenticate and receive session token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Clear session cookies and revoke token',
          responses: {
            '200': { description: 'Logged out successfully' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Initiate password reset email and token generation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Reset token generated if user exists' },
          },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Reset account password with valid verification token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Password reset successfully' },
            '400': { description: 'Invalid or expired token' },
          },
        },
      },
      '/api/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers with server-side pagination and filters',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'LEAD'] } },
          ],
          responses: {
            '200': { description: 'Paginated customer list' },
          },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create a new customer',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '201': { description: 'Customer created' },
          },
        },
      },
      '/api/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer details and history',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Customer details with ticket history' } },
        },
        patch: {
          tags: ['Customers'],
          summary: 'Update customer attributes',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Customer updated' } },
        },
        delete: {
          tags: ['Customers'],
          summary: 'Soft-delete (archive) customer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Customer archived' } },
        },
      },
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'List products with filters and category relations',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '200': { description: 'Paginated product list' },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Create a product with unique SKU',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '201': { description: 'Product created' },
          },
        },
      },
      '/api/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get single product details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Product details' } },
        },
        patch: {
          tags: ['Products'],
          summary: 'Update product properties or inventory stock',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Product updated' } },
        },
        delete: {
          tags: ['Products'],
          summary: 'Soft-delete product',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Product archived' } },
        },
      },
      '/api/tickets': {
        get: {
          tags: ['Tickets'],
          summary: 'List support tickets with status and priority filters',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '200': { description: 'Paginated ticket list' },
          },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Create support ticket and trigger background AI analysis',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '201': { description: 'Ticket created and AI queued' },
          },
        },
      },
      '/api/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket thread, comments, assignments, and AI analysis',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Full ticket detail payload' } },
        },
        patch: {
          tags: ['Tickets'],
          summary: 'Update ticket status, priority, or assign to employee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Ticket updated' } },
        },
        delete: {
          tags: ['Tickets'],
          summary: 'Delete ticket (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Ticket deleted' } },
        },
      },
      '/api/tickets/{id}/analyze': {
        post: {
          tags: ['AI Features'],
          summary: 'Run on-demand AI analysis on a ticket',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'AI analysis generated and stored' },
            '202': { description: 'Job enqueued in background BullMQ worker' },
          },
        },
      },
      '/api/tickets/{id}/ai-response': {
        post: {
          tags: ['AI Features'],
          summary: 'Generate an AI suggested response for customer support reply',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Suggested reply generated' },
          },
        },
      },
      '/api/tickets/{id}/comments': {
        get: {
          tags: ['Tickets'],
          summary: 'Fetch chronological conversation comments for ticket',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'List of comments' } },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Post staff reply or internal note to ticket thread',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '201': { description: 'Comment created' } },
        },
      },
      '/api/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'List operational tasks with filters and server-side pagination',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] } },
            { name: 'assignedToUserId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Paginated tasks list' } },
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create operational task and assign to user',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: { '201': { description: 'Task created successfully' } },
        },
      },
      '/api/tasks/{id}': {
        get: {
          tags: ['Tasks'],
          summary: 'Get single task details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Task details' } },
        },
        patch: {
          tags: ['Tasks'],
          summary: 'Update task status, due date, or assignee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Task updated' } },
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete task (Admin / Manager only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Task deleted' } },
        },
      },
      '/api/search': {
        get: {
          tags: ['Search'],
          summary: 'Execute intelligent hybrid full-text and AI natural language search',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'aiAssisted', in: 'query', schema: { type: 'boolean', default: true } },
          ],
          responses: {
            '200': { description: 'Search results' },
          },
        },
      },
      '/api/categories': {
        get: {
          tags: ['Products'],
          summary: 'List all product categories',
          responses: { '200': { description: 'List of categories' } },
        },
        post: {
          tags: ['Products'],
          summary: 'Create product category',
          responses: { '201': { description: 'Category created' } },
        },
      },
      '/api/audit-logs': {
        get: {
          tags: ['Observability'],
          summary: 'View complete system audit trail (Admin only)',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: { '200': { description: 'Audit log entries' } },
        },
      },
      '/api/dashboard/stats': {
        get: {
          tags: ['Observability'],
          summary: 'Get cached dashboard KPIs and dynamic AI operational insights',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '200': { description: 'Dashboard metrics payload' },
          },
        },
      },
      '/api/health': {
        get: {
          tags: ['Observability'],
          summary: 'Health check probe for database, cache, and AI providers',
          responses: {
            '200': { description: 'System healthy' },
            '503': { description: 'Service degraded or unhealthy' },
          },
        },
      },
      '/api/metrics': {
        get: {
          tags: ['Observability'],
          summary: 'Prometheus-compatible and JSON operational metrics telemetry',
          responses: {
            '200': { description: 'System telemetry metrics' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
