import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { data: customers, error } = await supabase
    .from("customers")
    .select(
      "id, first_name, last_name, phone, address, city, notes, status, created_at",
    )
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[CustomersPage] Supabase error:", error.message);
  }

  return (
    <CustomersClient
      customers={customers ?? []}
      workspaceId={workspaceId}
    />
  );
}
