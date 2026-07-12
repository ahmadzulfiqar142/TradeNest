"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/supabase/server";
import { inventoryAdjustmentSchema, type InventoryAdjustmentValues } from "@/schemas/inventory";

export type InventoryActionState = { success: boolean; message: string };

async function getAuthorizedUser(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, error: "Unauthorized" };
  const admin = createAdminClient();
  const { data: member } = await admin.from("workspace_members").select("id").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  return member ? { supabase, user, error: null } : { supabase, user: null, error: "You do not have access to this workspace." };
}

export async function adjustInventory(workspaceId: string, values: InventoryAdjustmentValues): Promise<InventoryActionState> {
  const parsed = inventoryAdjustmentSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Check the adjustment details." };
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { success: false, message: error ?? "Unauthorized" };
  const { error: adjustmentError } = await supabase.rpc("adjust_inventory", {
    p_workspace_id: workspaceId, p_product_id: parsed.data.productId, p_direction: parsed.data.direction,
    p_quantity: parsed.data.quantity, p_reason: parsed.data.reason, p_user_id: user.id,
  });
  if (adjustmentError) return { success: false, message: adjustmentError.message };
  revalidatePath("/inventory"); revalidatePath("/inventory/current-stock"); revalidatePath("/inventory/history"); revalidatePath("/inventory/low-stock"); revalidatePath("/");
  return { success: true, message: "Inventory adjusted successfully." };
}
