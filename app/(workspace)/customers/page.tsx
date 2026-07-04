import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const [{ data: customers }] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, name, email, phone, whatsapp, address, city, state, country, id_number, credit_limit, opening_balance, current_balance, notes, is_active, created_at",
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  const customerRows = customers ?? [];

  return <CustomersClient customers={customerRows} />;
}
