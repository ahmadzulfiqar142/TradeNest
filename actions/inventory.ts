"use server";

import { revalidatePath } from "next/cache";
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentValues,
} from "@/schemas/inventory";
import { getAuthorizedUser } from "@/lib/auth/workspace";

export type InventoryActionState = { success: boolean; message: string };

export async function adjustInventory(
  workspaceId: string,
  values: InventoryAdjustmentValues,
): Promise<InventoryActionState> {
  const parsed = inventoryAdjustmentSchema.safeParse(values);
  if (!parsed.success)
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ?? "Check the adjustment details.",
    };
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { success: false, message: error ?? "Unauthorized" };
  const { error: adjustmentError } = await supabase.rpc("adjust_inventory", {
    p_workspace_id: workspaceId,
    p_product_id: parsed.data.productId,
    p_direction: parsed.data.direction,
    p_quantity: parsed.data.quantity,
    p_reason: parsed.data.reason,
    p_user_id: user.id,
  });
  if (adjustmentError)
    return { success: false, message: adjustmentError.message };
  revalidatePath("/inventory");
  revalidatePath("/inventory/current-stock");
  revalidatePath("/inventory/history");
  revalidatePath("/inventory/low-stock");
  revalidatePath("/");
  return { success: true, message: "Inventory adjusted successfully." };
}

