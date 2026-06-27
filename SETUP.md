# Setup Guide - Business Management System

## Quick Start Guide

### Step 1: Prerequisites

Ensure you have the following installed:
- Node.js 20+ (required for Next.js 15)
- npm or yarn
- Git

### Step 2: Clone and Install

```bash
cd Documents/business-management-saas
npm install
```

### Step 3: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Go to Project Settings > API

### Step 4: Configure Environment Variables

Create `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Business Management System
```

### Step 5: Setup Database

1. Go to Supabase Dashboard > SQL Editor
2. Run the SQL files in order:

**a) Create Tables (supabase/schema.sql)**
```sql
-- Copy and paste content from supabase/schema.sql
```

**b) Enable RLS (supabase/rls-policies.sql)**
```sql
-- Copy and paste content from supabase/rls-policies.sql
```

**c) Create Functions (supabase/functions.sql)**
```sql
-- Copy and paste content from supabase/functions.sql
```

### Step 6: Enable Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)

### Step 7: Setup Storage Buckets

Go to Storage and create these buckets:

- `product-images` (public)
- `workspace-logos` (public)
- `documents` (private)
- `receipts` (private)

### Step 8: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure Overview

```
business-management-saas/
├── app/                         # Next.js App Router
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (workspace)/            # Workspace routes
│   │   └── [workspaceSlug]/
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── inventory/
│   │       ├── customers/
│   │       ├── suppliers/
│   │       ├── sales/
│   │       ├── purchases/
│   │       ├── expenses/
│   │       └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/                  # Reusable UI components
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── card.tsx
├── features/                    # Feature modules
│   ├── auth/
│   │   └── components/
│   │       ├── login-form.tsx
│   │       └── signup-form.tsx
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── customers/
│   ├── suppliers/
│   ├── sales/
│   ├── purchases/
│   └── expenses/
├── lib/                         # Utility functions
│   └── utils.ts
├── hooks/                       # Custom React hooks
├── services/                    # API services
├── actions/                     # Server actions
│   └── auth.ts
├── schemas/                     # Zod validation schemas
│   └── auth.ts
├── types/                       # TypeScript types
│   └── database.types.ts
├── supabase/                    # Supabase configuration
│   ├── client.ts               # Browser client
│   ├── server.ts               # Server client
│   ├── middleware.ts           # Middleware client
│   ├── schema.sql              # Database schema
│   ├── rls-policies.sql        # Security policies
│   └── functions.sql           # Database functions
├── middleware.ts                # Next.js middleware
├── .env.local                   # Environment variables (create this)
├── .env.local.example          # Template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Database Schema Overview

### Core Tables

1. **workspaces** - Business workspaces
2. **profiles** - User profiles (linked to auth.users)
3. **workspace_members** - User-workspace relationships with roles
4. **categories** - Product categories
5. **products** - Product catalog
6. **inventory_transactions** - Stock movement history
7. **customers** - Customer database
8. **suppliers** - Supplier database
9. **sales** - Sales records
10. **sale_items** - Sales line items
11. **purchases** - Purchase records
12. **purchase_items** - Purchase line items
13. **customer_ledger** - Customer account history
14. **supplier_ledger** - Supplier account history
15. **expenses** - Business expenses
16. **payments** - Payment records
17. **notifications** - System notifications
18. **audit_logs** - Activity logs

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Workspace isolation** - Users can only access their workspace data
- **Role-based permissions** - Owner, Admin, Manager, Employee
- **Audit logging** - Track all important actions

## Development Workflow

### Current Milestone: ✅ Milestone 1 Complete

- [x] Project setup
- [x] Next.js 15 with TypeScript
- [x] Supabase integration
- [x] Database schema
- [x] RLS policies
- [x] Database functions
- [x] Authentication pages
- [x] Core UI components

### Next Steps: Milestone 2 - Authentication & Workspace

1. Create workspace creation flow
2. Build workspace switching functionality
3. Implement user profile management
4. Add workspace invitation system
5. Create workspace settings page

### Future Milestones

3. Dashboard with analytics
4. Product and inventory management
5. Customer and sales system
6. Supplier and purchase management
7. Reports and exports
8. Polish and deployment

## Key Features

### Multi-Tenant Architecture

Every table has `workspace_id` to ensure complete data isolation between businesses.

### Role-Based Access Control

- **Owner**: Full access, can delete workspace
- **Admin**: Manage members, full business operations
- **Manager**: Business operations, limited settings
- **Employee**: Day-to-day operations, no settings

### Realtime Updates

Using Supabase Realtime for:
- Dashboard statistics
- Inventory updates
- Notifications
- Sales updates

### Security Best Practices

- Environment variables for secrets
- Server-side validation
- RLS for database security
- Proper error handling
- CSRF protection
- XSS prevention

## Troubleshooting

### Node.js Version Error

If you see "Unsupported engine" errors, upgrade Node.js:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

### Supabase Connection Error

1. Check `.env.local` file exists
2. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
3. Ensure Supabase project is not paused

### Database Error

1. Ensure all SQL files have been run in order
2. Check for SQL errors in Supabase logs
3. Verify RLS policies are enabled

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## Testing

### Manual Testing Checklist

- [ ] User can sign up
- [ ] Email verification works
- [ ] User can log in
- [ ] User can log out
- [ ] User can create workspace
- [ ] User can switch workspaces
- [ ] RLS prevents cross-workspace access

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Your Business Name
```

## Support

For issues or questions:
1. Check this setup guide
2. Review Supabase documentation
3. Check Next.js documentation
4. Open a GitHub issue

## License

MIT

---

**Built with ❤️ using Next.js 15, Supabase, and TypeScript**
