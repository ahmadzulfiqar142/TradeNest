# TypeScript `any` Type Patterns Guide

**This document is specifically about eliminating `any` type from the TradeNest codebase.**

Every AI assistant and developer must read this before writing any TypeScript code in this project.

---

## The Golden Rule

```
❌ NEVER USE `any` TYPE
✅ ALWAYS USE PROPER TYPES
```

Using `any` disables TypeScript's type checking and introduces runtime bugs. There are NO exceptions to this rule.

---

## Why `any` is Dangerous

```typescript
// With `any` - TypeScript does nothing
const [data, setData] = useState<any>(null);
setData({ id: "123", name: "Test" });
console.log(data.nonExistentProperty); // No error, but crashes at runtime

// Without `any` - TypeScript catches errors
const [data, setData] = useState<Workspace | null>(null);
setData({ id: "123" }); // Error: missing 'name' property
console.log(data.nonExistentProperty); // Error: property doesn't exist
```

---

## Common `any` Patterns and Fixes

### 1. useState with `any`

**❌ WRONG:**
```typescript
const [workspaceData, setWorkspaceData] = useState<any>(null);
const [products, setProducts] = useState<any[]>([]);
const [loading, setLoading] = useState<any>(false);
```

**✅ CORRECT:**
```typescript
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";
import type { Product } from "@/types/database.types";

const [workspaceData, setWorkspaceData] = useState<CreateWorkspaceFormValues | null>(null);
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState<boolean>(false);
```

**How to find the right type:**
1. Check `schemas/` for form value types
2. Check `types/database.types.ts` for database types
3. Define an interface if needed

---

### 2. Function Parameters with `any`

**❌ WRONG:**
```typescript
const handleSubmit = async (data: any) => {
  console.log(data.email);
};

const processWorkspace = (workspace: any) => {
  return workspace.name;
};
```

**✅ CORRECT:**
```typescript
import type { LoginFormValues } from "@/schemas/auth";
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";

const handleSubmit = async (data: LoginFormValues) => {
  console.log(data.email); // Typed!
};

const processWorkspace = (workspace: CreateWorkspaceFormValues) => {
  return workspace.name; // Typed!
};
```

---

### 3. FormData.get() with `as any`

**❌ WRONG:**
```typescript
const name = formData.get("name") as any;
const email = formData.get("email") as any;
const image = formData.get("image") as any;
```

**✅ CORRECT:**
```typescript
const name = formData.get("name")?.toString() ?? null;
const email = formData.get("email")?.toString() ?? "";
const image = formData.get("image")?.toString() ?? null;
```

**Why:** `formData.get()` returns `FormDataEntryValue | null`, which is `string | File | Blob | null`. Never cast it.

---

### 4. API Responses with `as any`

**❌ WRONG:**
```typescript
const { data } = await supabase.from("workspaces").select("*").single();
const workspace = data as any;
console.log(workspace.name);
```

**✅ CORRECT:**
```typescript
import type { Database } from "@/types/database.types";

const supabase = createClient<Database>();
const { data } = await supabase.from("workspaces").select("*").single();
// data is automatically typed as Workspace | null
if (data) {
  console.log(data.name); // Typed!
}
```

---

### 5. Event Handlers with `any`

**❌ WRONG:**
```typescript
const handleChange = (e: any) => {
  setValue(e.target.value);
};

const handleClick = (e: any) => {
  console.log(e);
};
```

**✅ CORRECT:**
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e);
};
```

---

### 6. Component Props with `any`

**❌ WRONG:**
```typescript
interface Props {
  user: any;
  onNext: (data: any) => void;
  children: any;
}

export function Component({ user, onNext, children }: Props) {
  return <div>{user.name}</div>;
}
```

**✅ CORRECT:**
```typescript
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";

interface Props {
  user: {
    id: string;
    email: string;
  };
  onNext: (data: CreateWorkspaceFormValues) => void;
  children: React.ReactNode;
}

export function Component({ user, onNext, children }: Props) {
  return <div>{user.email}</div>; // Typed!
}
```

---

### 7. Array Types with `any`

**❌ WRONG:**
```typescript
const [items, setItems] = useState<any[]>([]);
const [matrix, setMatrix] = useState<any[][]>([]);
```

**✅ CORRECT:**
```typescript
import type { Product } from "@/types/database.types";

const [items, setItems] = useState<Product[]>([]);
const [matrix, setMatrix] = useState<number[][]>([]);

// Or define inline
const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
```

---

### 8. Callback Functions with `any`

**❌ WRONG:**
```typescript
const handleSuccess = (data: any) => {
  console.log(data);
};

const handleError = (error: any) => {
  console.error(error.message);
};
```

**✅ CORRECT:**
```typescript
import type { CreateProductFormValues } from "@/schemas/product";

const handleSuccess = (data: CreateProductFormValues) => {
  console.log(data.name);
};

const handleError = (error: Error) => {
  console.error(error.message);
};
```

---

### 9. Return Types with `any`

**❌ WRONG:**
```typescript
function getWorkspace() {
  return { id: "123", name: "Test" };
}
// Returns: any
```

**✅ CORRECT:**
```typescript
interface Workspace {
  id: string;
  name: string;
}

function getWorkspace(): Workspace {
  return { id: "123", name: "Test" };
}
// Returns: Workspace
```

---

### 10. Generic Types with `any`

**❌ WRONG:**
```typescript
function fetchData(url: string): Promise<any> {
  return fetch(url).then(res => res.json());
}
```

**✅ CORRECT:**
```typescript
interface ApiResponse<T> {
  data: T;
  error: string | null;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  const data = await response.json();
  return { data, error: null };
}

// Usage
const result = await fetchData<Product>("/api/products");
console.log(result.data.name); // Typed!
```

---

## Finding the Right Type

### Step 1: Check Schemas

```typescript
// schemas/workspace.ts
export const createWorkspaceSchema = z.object({...});
export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

// Usage
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";
```

### Step 2: Check Database Types

```typescript
// types/database.types.ts
export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: { id: string; name: string; ... }
      }
    }
  }
}

// Usage
import type { Database } from "@/types/database.types";
type Workspace = Database['public']['Tables']['workspaces']['Row'];
```

### Step 3: Check Existing Components

```typescript
// components/workspace-form.tsx
interface WorkspaceFormProps {
  workspace: Workspace; // Already defined
}
```

### Step 4: Define Your Own

```typescript
// If no type exists, define it
interface MyDataType {
  id: string;
  name: string;
  createdAt: Date;
}
```

---

## Type Replacement Cheat Sheet

| Instead of `any` | Use This | Where to Find |
|------------------|----------|---------------|
| `useState<any>(null)` | `useState<Type \| null>(null)` | Schema or interface |
| `(data: any) => void` | `(data: SpecificType) => void` | Schema type |
| `const x: any = ...` | `const x: SpecificType = ...` | Define or import |
| `formData.get("x") as any` | `formData.get("x")?.toString() ?? null` | Always this pattern |
| `response as any` | Properly typed response | Database types |
| `event: any` | `event: React.ChangeEvent<...>` | React types |
| `children: any` | `children: React.ReactNode` | React type |
| `array: any[]` | `array: SpecificType[]` | Schema or interface |
| `return data as any` | Return typed data | Let TypeScript infer |

---

## When You Can't Find a Type

### Option 1: Use `unknown` (Temporary)

```typescript
// If you truly don't know the type yet
const processData = (data: unknown) => {
  // Narrow it down
  if (typeof data === "object" && data !== null && "id" in data) {
    // TypeScript now knows data has an id
    console.log((data as { id: string }).id);
  }
};
```

### Option 2: Create an Interface

```typescript
// Define the shape you expect
interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
}

const processWorkspace = (data: WorkspaceData) => {
  console.log(data.name); // Typed!
};
```

### Option 3: Ask for Clarification

If you can't determine the correct type:
1. Check the database schema in `types/database.types.ts`
2. Check the Zod schema in `schemas/`
3. If still unclear, ask: "What type should this be?"

**Never use `any` as a shortcut.**

---

## Real-World Examples from This Project

### Example 1: Onboarding Component

**Before (with `any`):**
```typescript
interface OnboardingStepTwoProps {
  onNext: (data: any) => void;  // ❌
}

const [workspaceData, setWorkspaceData] = useState<any>(null);  // ❌
```

**After (proper types):**
```typescript
import type { CreateWorkspaceFormValues } from "@/schemas/workspace";

interface OnboardingStepTwoProps {
  onNext: (data: CreateWorkspaceFormValues) => void;  // ✅
}

const [workspaceData, setWorkspaceData] = useState<CreateWorkspaceFormValues | null>(null);  // ✅
```

### Example 2: Product Action

**Before (with `as`):**
```typescript
const newImageUrl = formData.get("imageUrl") as string | null;  // ❌
const oldImageUrl = formData.get("oldImageUrl") as string | null;  // ❌
```

**After (proper typing):**
```typescript
const newImageUrl = formData.get("imageUrl")?.toString() ?? null;  // ✅
const oldImageUrl = formData.get("oldImageUrl")?.toString() ?? null;  // ✅
```

### Example 3: Profile Action

**Before (wrong signature):**
```typescript
export async function updateProfile(formData: FormData) {  // ❌
  const full_name = formData.get("full_name") as string;  // ❌
}
```

**After (proper signature):**
```typescript
export type ProfileActionState = {
  message: string;
  success: boolean;
};

export async function updateProfile(
  profileId: string,
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {  // ✅
  const full_name = formData.get("full_name")?.toString() ?? "";  // ✅
}
```

---

## TypeScript Strict Mode

This project uses TypeScript strict mode. This means:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

With strict mode enabled:
- `any` types are flagged
- Null checks are required
- Type inference is stronger
- Errors are caught at compile time

**This is a feature, not a bug.** Embrace the strictness.

---

## ESLint Enforcement

ESLint rules will catch `any` usage:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

If you see this error:
```
Error: Unexpected any. Specify a more precise type. (@typescript-eslint/no-explicit-any)
```

**Fix it immediately.** Don't disable the rule.

---

## Checklist: Before You Commit

When writing TypeScript code, verify:

- [ ] No `any` types in code
- [ ] No `as string` or `as any` assertions
- [ ] All FormData values use `?.toString() ?? null`
- [ ] All useState calls have explicit generic types
- [ ] All function parameters have explicit types
- [ ] All return types are explicit (or properly inferred)
- [ ] All component props have interfaces
- [ ] All event handlers have proper React types
- [ ] All API responses use Database generic
- [ ] Build passes: `npm run build`

---

## Quick Decision Tree

```
Need to type something?
    ↓
Is it a form value?
    ↓ YES
Check schemas/ for Zod schema → use z.infer type
    ↓ NO
Is it from database?
    ↓ YES
Use Database['public']['Tables']['table']['Row']
    ↓ NO
Is it a React component?
    ↓ YES
Define Props interface
    ↓ NO
Is it an event handler?
    ↓ YES
Use React.ChangeEvent, React.MouseEvent, etc.
    ↓ NO
Is it a callback?
    ↓ YES
Define function signature type
    ↓ NO
Still don't know?
    ↓
Create an interface or type alias
    ↓
STILL don't know?
    ↓
ASK FOR HELP - Don't use `any`
```

---

## Common Objections and Responses

### "But it's just a quick prototype..."

**Response:** There are no quick prototypes in production code. Type it properly from the start.

### "I don't have time to find the right type..."

**Response:** Spending 2 minutes now saves 2 hours debugging later. Use the decision tree above.

### "TypeScript is too strict..."

**Response:** That's the point. Strict types catch bugs before they reach production.

### "The code works with `any`..."

**Response:** "Works" ≠ "Correct". It will break when you least expect it.

### "I'll fix it later..."

**Response:** You won't. Technical debt accumulates. Fix it now.

---

## Summary

1. **NEVER use `any`** — No exceptions
2. **Find the right type** — Check schemas, database types, or define your own
3. **Use `?.toString() ?? null`** for FormData
4. **Define interfaces** for complex objects
5. **Use React types** for events and components
6. **Ask if unsure** — Better to ask than to use `any`
7. **Run the build** — `npm run build` will catch type errors

---

## Remember

> "Any is a trap. It feels like freedom, but it's actually giving up on type safety."

Every time you type `any`, you're saying "I give up on TypeScript." Don't give up. Find the right type.

---

## Resources

- [TypeScript Handbook: Any Type](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#any)
- [Why You Shouldn't Use Any](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#any)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

**This document is mandatory reading for all code contributions to TradeNest.**