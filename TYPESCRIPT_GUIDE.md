# TypeScript Type Safety Guide

This document is the **authoritative reference** for TypeScript type handling in the TradeNest project. All AI assistants and developers must follow these patterns when adding new features or modifying existing code.

## Table of Contents

1. [Project Type System](#project-type-system)
2. [FormData Handling](#formdata-handling)
3. [Server Actions](#server-actions)
4. [React Components](#react-components)
5. [Supabase Database Types](#supabase-database-types)
6. [Zod Schema Integration](#zod-schema-integration)
7. [Type Patterns by Feature](#type-patterns-by-feature)
8. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
9. [Quick Reference](#quick-reference)

---

## Project Type System

### Type Hierarchy

```
Zod Schema (schemas/*.ts)
    ↓ z.infer<typeof schema>
Form Values Type
    ↓ used in
Component Props / Server Actions
    ↓ validated against
Zod Schema.parse() / .safeParse()
```

### Schema Locations

All form validation schemas are in the `schemas/` directory:

- `schemas/auth.ts` — Login, signup forms
- `schemas/workspace.ts` — Workspace creation, update
- `schemas/product.ts` — Product creation, update
- `schemas/customer.ts` — Customer forms (if exists)
- `schemas/supplier.ts` — Supplier forms (if exists)

**Rule:** Every form MUST have a corresponding Zod schema. Never create form types without a schema.

---

## FormData Handling

### The Problem

`FormData.get()` returns `FormDataEntryValue | null`, which is:
```typescript
type FormDataEntryValue = string | File | Blob;
```

### ❌ NEVER Do This

```typescript
// ❌ WRONG - unsafe cast
const name = formData.get("name") as string;
const email = formData.get("email") as string | null;

// ❌ WRONG - assumes string without check
const value = formData.get("field").toString();
```

### ✅ ALWAYS Do This

```typescript
// ✅ For nullable strings
const name = formData.get("name")?.toString() ?? null;

// ✅ For required strings with default
const email = formData.get("email")?.toString() ?? "";

// ✅ For numbers
const price = formData.get("price") ? Number(formData.get("price")) : 0;
const quantity = formData.get("quantity") ? parseInt(formData.get("quantity") as string) : 0;

// ✅ For booleans
const isActive = formData.get("isActive") === "true";
```

### Pattern: FormData to Zod Schema

```typescript
const parsed = createProductSchema.safeParse({
  name: formData.get("name")?.toString(),
  description: formData.get("description")?.toString(),
  price: formData.get("price") ? Number(formData.get("price")) : 0,
});

if (!parsed.success) {
  return {
    message: parsed.error.issues[0]?.message,
    success: false,
  };
}

const values = parsed.data; // Typed as CreateProductFormValues
```

---

## Server Actions

### Signature Pattern

All server actions that use `useActionState` MUST follow this exact signature:

```typescript
// actions/feature.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. Define action state type
export type FeatureActionState = {
  message: string;
  success: boolean;
};

// 2. Action signature: (boundParam, previousState, formData)
export async function featureAction(
  boundParam: string,                    // ID or other bound parameter
  _previousState: FeatureActionState,   // Always named _previousState
  formData: FormData,                    // Always named formData
): Promise<FeatureActionState> {
  // 3. Validate with Zod
  const parsed = featureSchema.safeParse({
    field: formData.get("field")?.toString(),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message || "Invalid input",
      success: false,
    };
  }

  // 4. Auth check
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { message: "Unauthorized", success: false };
  }

  // 5. Business logic with typed data
  const values = parsed.data; // Typed!

  // 6. Success/failure response
  revalidatePath("/feature");
  return { message: "Success", success: true };
}
```

### Usage in Client Components

```typescript
// components/feature-form.tsx
"use client";

import { useActionState } from "react";
import { featureAction } from "@/actions/feature";

export function FeatureForm({ id }: { id: string }) {
  // 1. Wrap action with bound parameter
  const [state, formAction, pending] = useActionState(
    async (previousState, formData) =>
      featureAction(id, previousState, formData),
    { message: "", success: false }
  );

  // 2. Use formAction in form
  return (
    <form action={formAction}>
      <input name="field" />
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Redirect vs Return

```typescript
// Use redirect for navigation after success
if (success) {
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Use return for form state updates
return { message: "Saved", success: true };
```

---

## React Components

### Props Interface Pattern

```typescript
// components/example.tsx
interface ExampleProps {
  // Required props
  user: {
    id: string;
    email: string;
  };
  
  // Optional props
  onNext?: (data: ExampleFormValues) => void;
  
  // Callback with specific signature
  onSubmit: (values: ExampleFormValues) => Promise<void>;
  
  // Children pattern
  children: React.ReactNode;
}

export function Example({ user, onNext, onSubmit, children }: ExampleProps) {
  // Implementation
}
```

### State Typing

```typescript
import { useState } from "react";
import type { ExampleFormValues } from "@/schemas/example";

// ✅ Explicit types
const [data, setData] = useState<ExampleFormValues | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [items, setItems] = useState<string[]>([]);

// ❌ Never use any
const [data, setData] = useState<any>(null);
```

### Event Handlers

```typescript
// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setValue(value);
};

// Form submit
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

// Click handler
const handleClick = () => {
  // ...
};
```

---

## Supabase Database Types

### Client Setup

```typescript
// lib/supabase/server.ts
import type { Database } from "@/types/database.types";

export function createClient() {
  return createServerClient<Database>(...);
}

export function createAdminClient() {
  return createSupabaseClient<Database>(...);
}
```

### Query Typing

```typescript
// actions/example.ts
const supabase = await createClient();

// Select specific columns
const { data, error } = await supabase
  .from("workspaces")
  .select("id, name, slug")
  .eq("user_id", user.id)
  .single();

// data is typed as: { id: string; name: string; slug: string } | null

// Select with relations
const { data } = await supabase
  .from("workspace_members")
  .select(`
    role,
    workspaces (
      id,
      name,
      slug
    )
  `)
  .eq("user_id", user.id);

// data is typed with proper relations
```

### Insert/Update Typing

```typescript
// Insert
const { data, error } = await supabase
  .from("products")
  .insert({
    workspace_id: workspaceId,
    name: values.name,
    purchase_price: values.purchasePrice,
    // TypeScript validates field names and types
  })
  .select("id")
  .single();

// Update
const { error } = await supabase
  .from("products")
  .update({
    name: values.name,
    selling_price: values.sellingPrice,
  })
  .eq("id", productId);
```

---

## Zod Schema Integration

### Creating Schemas

```typescript
// schemas/product.ts
import { z } from "zod";

// Reusable validators
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const money = z.coerce
  .number({ error: "Enter a valid amount" })
  .min(0, "Amount cannot be negative");

// Main schema
export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  description: optionalText,
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  purchasePrice: money,
  sellingPrice: money,
});

// Export inferred type
export type CreateProductFormValues = z.infer<typeof createProductSchema>;
```

### Using Schemas in Components

```typescript
// components/product-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductFormValues } from "@/schemas/product";

export function ProductForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
  });

  const onSubmit = (data: CreateProductFormValues) => {
    // data is fully typed!
    console.log(data.name, data.purchasePrice);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

---

## Type Patterns by Feature

### Authentication

```typescript
// schemas/auth.ts
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// actions/auth.ts
export async function login(data: LoginFormValues) {
  const validatedData = loginSchema.parse(data);
  // validatedData is typed as LoginFormValues
}
```

### Workspace Management

```typescript
// schemas/workspace.ts
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessWhatsapp: z.string().optional(),
});

export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;
```

### Product Management

```typescript
// schemas/product.ts
export const createProductSchema = z.object({
  name: z.string().trim().min(2),
  description: optionalText,
  imageUrl: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
  categoryId: optionalText,
  newCategoryName: optionalText,
  purchasePrice: money,
  sellingPrice: money,
  stockQuantity: quantity,
  minStockQuantity: quantity,
  expiryDate: optionalDate,
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
```

---

## Common Mistakes to Avoid

### 1. Using `any` Type

```typescript
// ❌ WRONG
const [data, setData] = useState<any>(null);
const handleData = (data: any) => {};

// ✅ CORRECT
const [data, setData] = useState<CreateWorkspaceFormValues | null>(null);
const handleData = (data: CreateWorkspaceFormValues) => {};
```

### 2. Unsafe Type Assertions

```typescript
// ❌ WRONG
const value = formData.get("field") as string;
const user = data as User;

// ✅ CORRECT
const value = formData.get("field")?.toString() ?? null;
const user = data as User | null; // Only if truly needed
```

### 3. Wrong Server Action Signature

```typescript
// ❌ WRONG
export async function action(data: FormData) { }
export async function action(prevState: any, formData: FormData) { }

// ✅ CORRECT
export async function action(
  param: string,
  _previousState: ActionState,
  formData: FormData
) { }
```

### 4. Incorrect useActionState Binding

```typescript
// ❌ WRONG
useActionState(updateProfile.bind(null, profile.id), initialState)

// ✅ CORRECT
useActionState(
  async (previousState, formData) => updateProfile(profile.id, previousState, formData),
  initialState
)
```

### 5. Missing Null Checks

```typescript
// ❌ WRONG
const user = (await supabase.auth.getUser()).data.user;
console.log(user.email);

// ✅ CORRECT
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return { error: "Unauthorized" };
console.log(user.email);
```

---

## Quick Reference

### FormData Extraction

```typescript
// String (nullable)
const value = formData.get("field")?.toString() ?? null;

// String (required, with default)
const value = formData.get("field")?.toString() ?? "";

// Number
const num = formData.get("number") ? Number(formData.get("number")) : 0;

// Integer
const int = formData.get("count") ? parseInt(formData.get("count") as string) : 0;

// Boolean
const bool = formData.get("active") === "true";
```

### Server Action Template

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { schema } from "@/schemas/feature";

export type ActionState = {
  message: string;
  success: boolean;
};

export async function featureAction(
  id: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse({
    field: formData.get("field")?.toString(),
  });

  if (!parsed.success) {
    return { message: "Invalid input", success: false };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { message: "Unauthorized", success: false };
  }

  // Business logic here

  revalidatePath("/feature");
  return { message: "Success", success: true };
}
```

### Component Template

```typescript
"use client";

import { useActionState } from "react";
import { featureAction } from "@/actions/feature";
import type { FeatureFormValues } from "@/schemas/feature";

interface FeatureFormProps {
  id: string;
}

export function FeatureForm({ id }: FeatureFormProps) {
  const [state, formAction, pending] = useActionState(
    async (previousState, formData) =>
      featureAction(id, previousState, formData),
    { message: "", success: false }
  );

  return (
    <form action={formAction}>
      {/* Form fields */}
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

---

## Checklist for New Features

When adding a new feature, ensure:

- [ ] Created Zod schema in `schemas/feature.ts`
- [ ] Exported type with `z.infer<typeof schema>`
- [ ] Server action follows `(param, _previousState, formData)` signature
- [ ] All FormData values use `?.toString() ?? null` pattern
- [ ] Component props have explicit interface
- [ ] State has explicit generic types
- [ ] No `any` types anywhere
- [ ] No unsafe `as` assertions
- [ ] Supabase queries use `Database` generic
- [ ] Proper null checks after auth.getUser()
- [ ] Form validation with Zod before processing
- [ ] Proper error messages returned in action state

---

## Build Verification

After making changes, verify TypeScript correctness:

```bash
npm run build
```

**Success criteria:**
- ✓ Compiled successfully
- ✓ Finished TypeScript
- ✓ No type errors
- ✓ All pages generated

---

## Additional Resources

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React useActionState](https://react.dev/reference/react/useActionState)
- [Supabase TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

## Notes for AI Assistants

When working on this codebase:

1. **Always check schemas first** — Look in `schemas/` for existing types before creating new ones
2. **Never use `any`** — If you can't find the right type, ask or create a proper interface
3. **FormData is not string** — Always use `?.toString() ?? null` pattern
4. **Server actions have 3 parameters** — `(param, previousState, formData)`
5. **useActionState needs wrapper** — Don't bind directly, use async wrapper function
6. **Test the build** — Run `npm run build` to verify changes compile

This guide is the single source of truth for TypeScript patterns in this project.