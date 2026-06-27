# Business Management System - SaaS Platform

A production-ready, multi-tenant Business Management System built with Next.js 15 and Supabase.

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** (Strict Mode)
- **Tailwind CSS v4**
- **shadcn/ui** for components
- **React Hook Form** for forms
- **Zod** for validation
- **TanStack Table** for data tables
- **TanStack Query** for data fetching
- **Recharts** for charts
- **Lucide React** for icons

### Backend
- **Supabase PostgreSQL** (Database)
- **Supabase Auth** (Authentication)
- **Supabase Storage** (File storage)
- **Supabase Realtime** (Live updates)
- **Supabase RLS** (Row Level Security)
- **Supabase RPC** (Database functions)

## Architecture

### Multi-Tenant Workspace Model

Every business is a **Workspace**. Each workspace has complete data isolation with:

- Users with roles (Owner, Admin, Manager, Employee)
- Products and Categories
- Inventory Management
- Customers and Suppliers
- Sales and Purchases
- Invoicing System
- Ledger Management
- Expenses Tracking
- Analytics and Reports

### Security

- Row Level Security (RLS) on all tables
- Workspace-based data isolation
- Role-based permissions
- No cross-workspace data leakage

## Features

### Core Modules

1. **Authentication**
   - Email/Password login
   - Password reset
   - Email verification
   - Workspace invitations

2. **Workspace Management**
   - Create/Edit workspace
   - Upload logo
   - Invite team members
   - Role management
   - Switch workspaces

3. **Dashboard**
   - Today's sales/purchases
   - Monthly revenue and profit
   - Pending payments
   - Low stock alerts
   - Interactive charts

4. **Products**
   - Categories
   - Product management
   - SKU/Barcode
   - Stock levels
   - Pricing (purchase, selling, wholesale)
   - Batch and expiry tracking

5. **Inventory**
   - Stock in/out
   - Adjustments
   - Transaction history
   - Low stock alerts

6. **Customers**
   - Customer profiles
   - Purchase history
   - Payment tracking
   - Ledger management

7. **Suppliers**
   - Supplier profiles
   - Purchase orders
   - Outstanding balance
   - Payment history

8. **Sales**
   - Create invoices
   - Cash/Credit/Partial payments
   - PDF generation
   - Barcode scanning
   - Discount and tax

9. **Purchases**
   - Purchase orders
   - Auto inventory update
   - Supplier payments

10. **Expenses**
    - Category-based tracking
    - Monthly reports

11. **Reports**
    - Sales reports
    - Profit analysis
    - Inventory valuation
    - Export to PDF/CSV/Excel

12. **Ledger System**
    - Customer ledger
    - Supplier ledger
    - Payment tracking
    - Account statements

## Database Schema

See `supabase/schema.sql` for complete schema.

### Key Tables

- `workspaces` - Business workspaces
- `profiles` - User profiles
- `workspace_members` - Workspace membership with roles
- `products` - Product catalog
- `categories` - Product categories
- `inventory_transactions` - Stock movements
- `customers` - Customer database
- `suppliers` - Supplier database
- `sales` - Sales records
- `sale_items` - Sale line items
- `purchases` - Purchase records
- `purchase_items` - Purchase line items
- `customer_ledger` - Customer account history
- `supplier_ledger` - Supplier account history
- `expenses` - Expense tracking
- `payments` - Payment records
- `notifications` - System notifications
- `audit_logs` - Activity logs

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd business-management-saas
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Supabase**

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Business Management System
```

4. **Setup Database**

Run the following SQL files in your Supabase SQL editor (in order):

```bash
supabase/schema.sql        # Create tables
supabase/rls-policies.sql  # Enable RLS
supabase/functions.sql     # Create functions
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
business-management-saas/
├── app/                      # Next.js app router
│   ├── (auth)/              # Auth pages
│   └── (workspace)/         # Workspace pages
│       └── [workspaceSlug]/
│           ├── dashboard/
│           ├── products/
│           ├── inventory/
│           ├── customers/
│           ├── suppliers/
│           ├── sales/
│           ├── purchases/
│           ├── expenses/
│           ├── reports/
│           └── settings/
├── components/              # Reusable components
│   └── ui/                 # shadcn/ui components
├── features/               # Feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── customers/
│   ├── suppliers/
│   ├── sales/
│   ├── purchases/
│   └── expenses/
├── lib/                    # Utilities
├── hooks/                  # Custom hooks
├── services/              # API services
├── actions/               # Server actions
├── schemas/               # Zod schemas
├── types/                 # TypeScript types
├── supabase/             # Supabase config
│   ├── client.ts         # Browser client
│   ├── server.ts         # Server client
│   ├── middleware.ts     # Middleware client
│   ├── schema.sql        # Database schema
│   ├── rls-policies.sql  # RLS policies
│   └── functions.sql     # Database functions
└── middleware.ts         # Next.js middleware
```

## Development Roadmap

### Milestone 1: ✅ Setup & Configuration
- [x] Project initialization
- [x] Supabase integration
- [x] Database schema
- [x] RLS policies
- [x] Database functions
- [x] Authentication setup

### Milestone 2: Authentication & Workspace
- [ ] Login/Signup pages
- [ ] Workspace creation
- [ ] Workspace switching
- [ ] User invitations
- [ ] Profile management

### Milestone 3: Dashboard
- [ ] Dashboard layout
- [ ] Statistics cards
- [ ] Charts integration
- [ ] Recent activity
- [ ] Quick actions

### Milestone 4: Products & Inventory
- [ ] Product CRUD
- [ ] Category management
- [ ] Inventory tracking
- [ ] Stock alerts

### Milestone 5: Customers & Sales
- [ ] Customer management
- [ ] Sales invoice
- [ ] Payment processing
- [ ] Ledger system

### Milestone 6: Suppliers & Purchases
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Supplier payments

### Milestone 7: Reports & Analytics
- [ ] Sales reports
- [ ] Profit analysis
- [ ] Export functionality

### Milestone 8: Polish & Deploy
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Documentation

## Code Standards

- TypeScript strict mode
- No `any` types
- Server Components by default
- Client Components only when needed
- Zod validation for all forms
- Proper error handling
- Optimistic UI updates
- Clean architecture
- SOLID principles

## Contributing

This is a production-ready SaaS application. Contributions should maintain:

- Code quality
- Type safety
- Security best practices
- Performance optimization
- Documentation

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
