import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";

export default async function CategoriesPage() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, description, is_active").eq("workspace_id", workspaceId).order("name");
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Categories</h1><p className="text-muted-foreground">Product categories are created from the product form.</p></div><div className="rounded-lg border bg-card"><ul className="divide-y">{categories?.map((category) => <li key={category.id} className="p-4"><p className="font-medium">{category.name}</p>{category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}</li>)}{!categories?.length && <li className="p-8 text-center text-muted-foreground">No categories yet.</li>}</ul></div></div>;
}
