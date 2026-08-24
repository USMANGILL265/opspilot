# OpsPilot — Database Design, ERD & Indexing Strategy

## 1. Overview
The persistence layer of OpsPilot is built on PostgreSQL 16 managed via Prisma ORM. The schema is 3NF normalized across 11 core tables with referential integrity, cascading deletion policies, and targeted indexing for low-latency pagination and high-throughput search.

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ TICKET : "creates"
    USER ||--o{ TICKET : "is assigned to"
    USER ||--o{ TICKET_COMMENT : "writes"
    USER ||--o{ TICKET_ASSIGNMENT : "assigns / receives"
    USER ||--o{ ACTIVITY_LOG : "triggers"
    USER ||--o{ TASK : "assigned to"
    USER ||--o{ PASSWORD_RESET_TOKEN : "owns"

    CUSTOMER ||--o{ TICKET : "submits"
    CATEGORY ||--o{ PRODUCT : "contains"
    TICKET ||--o{ TICKET_COMMENT : "has"
    TICKET ||--o{ TICKET_ASSIGNMENT : "has"
    TICKET ||--o| AI_ANALYSIS : "triaged by"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "ADMIN | MANAGER | EMPLOYEE"
        string avatarUrl
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    PASSWORD_RESET_TOKEN {
        string id PK
        string tokenHash UK
        string userId FK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    CUSTOMER {
        string id PK
        string name
        string email
        string phone
        string company
        enum status "ACTIVE | INACTIVE | LEAD"
        string notes
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "Soft Delete"
    }

    CATEGORY {
        string id PK
        string name UK
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        string id PK
        string name
        string sku UK
        string description
        string categoryId FK
        float price
        int stock
        enum status "IN_STOCK | LOW_STOCK | OUT_OF_STOCK | DISCONTINUED"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "Soft Delete"
    }

    TICKET {
        string id PK
        string ticketNumber UK
        string customerId FK
        string createdByUserId FK
        string assignedToUserId FK
        string subject
        string description
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        enum category "BILLING | TECHNICAL | DELIVERY | ACCOUNT | GENERAL"
        enum status "OPEN | IN_PROGRESS | WAITING | RESOLVED | CLOSED"
        datetime createdAt
        datetime updatedAt
        datetime resolvedAt
    }

    TICKET_COMMENT {
        string id PK
        string ticketId FK
        string userId FK
        string content
        boolean isInternal
        datetime createdAt
    }

    TICKET_ASSIGNMENT {
        string id PK
        string ticketId FK
        string assignedByUserId FK
        string assignedToUserId FK
        string note
        datetime createdAt
    }

    AI_ANALYSIS {
        string id PK
        string ticketId FK,UK
        string provider
        string model
        enum priority
        enum category
        enum sentiment "POSITIVE | NEUTRAL | NEGATIVE"
        string summary
        string suggestedResponse
        string nextAction
        int processingTimeMs
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITY_LOG {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        string details "JSON"
        string ipAddress
        datetime createdAt
    }

    TASK {
        string id PK
        string title
        string description
        enum status "PENDING | IN_PROGRESS | COMPLETED"
        datetime dueDate
        string assignedToUserId FK
        datetime createdAt
        datetime updatedAt
    }
```

---

## 3. Database Normalization & Integrity
1. **Email & SKU Uniqueness**: Unique constraints are placed on `User.email`, `Category.slug`, `Product.sku`, and `Ticket.ticketNumber` to eliminate data anomalies.
2. **Soft Deletion (`deletedAt`)**: Implemented on `Customer` and `Product` tables to maintain audit compliance and preserve historical references in previous support tickets and invoices.
3. **One-to-One AI Analysis**: `AIAnalysis.ticketId` is unique and has cascade deletion linked to its parent ticket.

---

## 4. Indexing Strategy & Optimization
- **Composite Indexes**:
  - `Customer(status, deletedAt)`: Optimizes filtered listing queries avoiding full table scans.
  - `Product(categoryId, deletedAt)` & `Product(status, deletedAt)`: Speeds up catalog filtering.
  - `Ticket(status, priority)`: Essential for support dashboard queues (e.g. finding urgent open tickets).
  - `TicketComment(ticketId, createdAt)`: Enables instant rendering of chronological ticket conversation threads.
  - `ActivityLog(entityType, entityId)` & `ActivityLog(userId, createdAt)`: Optimizes audit trail queries.
