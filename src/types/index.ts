export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'LEAD';

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: CustomerStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'BILLING' | 'TECHNICAL' | 'DELIVERY' | 'ACCOUNT' | 'GENERAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface TicketData {
  id: string;
  ticketNumber: string;
  customerId: string;
  customer?: { id: string; name: string; email: string; company?: string | null };
  createdByUserId: string;
  createdByUser?: { id: string; name: string; email: string };
  assignedToUserId?: string | null;
  assignedToUser?: { id: string; name: string; email: string } | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
  aiAnalysis?: AIAnalysisData | null;
  comments?: TicketCommentData[];
}

export interface TicketCommentData {
  id: string;
  ticketId: string;
  userId: string;
  user?: { id: string; name: string; email: string; role: UserRole };
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface AIAnalysisData {
  id: string;
  ticketId: string;
  provider: string;
  model: string;
  priority: TicketPriority;
  category: TicketCategory;
  sentiment: Sentiment;
  summary: string;
  suggestedResponse: string;
  nextAction: string;
  rawTokens?: number | null;
  processingTimeMs?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogData {
  id: string;
  userId?: string | null;
  user?: { id: string; name: string; email: string; role: UserRole } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  openTasks: number;
  completedTasks: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recentActivity: ActivityLogData[];
  aiInsights: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
