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
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
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
      '/api/customers': {
        get: {
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
          summary: 'Create a new customer',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '201': { description: 'Customer created' },
          },
        },
      },
      '/api/products': {
        get: {
          summary: 'List products with filters and category relations',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '200': { description: 'Paginated product list' },
          },
        },
        post: {
          summary: 'Create a product with unique SKU',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '201': { description: 'Product created' },
          },
        },
      },
      '/api/tickets': {
        get: {
          summary: 'List support tickets with status and priority filters',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '200': { description: 'Paginated ticket list' },
          },
        },
        post: {
          summary: 'Create support ticket and trigger background AI analysis',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '201': { description: 'Ticket created and AI queued' },
          },
        },
      },
      '/api/tickets/{id}/analyze': {
        post: {
          summary: 'Run on-demand AI analysis on a ticket',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'AI analysis generated and stored' },
          },
        },
      },
      '/api/search': {
        get: {
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
      '/api/dashboard/stats': {
        get: {
          summary: 'Get cached dashboard KPIs and AI insights',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            '200': { description: 'Dashboard metrics payload' },
          },
        },
      },
      '/api/health': {
        get: {
          summary: 'Health check probe for database, cache, and AI providers',
          responses: {
            '200': { description: 'System healthy' },
            '503': { description: 'Service degraded or unhealthy' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
