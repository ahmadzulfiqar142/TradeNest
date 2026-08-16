"use server";

import { revalidatePath } from "next/cache";
import {
  inventoryAdjustmentSchema,
  stockInBatchSchema,
  type InventoryAdjustmentValues,
  type StockInBatchValues,
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

export async function stockInBatch(
  workspaceId: string,
  values: StockInBatchValues,
): Promise<InventoryActionState> {
  const parsed = stockInBatchSchema.safeParse(values);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Check the stock-in details.",
    };
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { success: false, message: error ?? "Unauthorized" };
  const { error: rpcError } = await supabase.rpc("stock_in_batch", {
    p_workspace_id: workspaceId,
    p_product_id: parsed.data.productId,
    p_product_unit_id: parsed.data.productUnitId,
    p_quantity: parsed.data.quantity,
    p_batch_number: parsed.data.batchNumber ?? null,
    p_expiry_date: parsed.data.expiryDate ?? null,
    p_purchase_price: parsed.data.purchasePrice,
    p_user_id: user.id,
  });
  if (rpcError) return { success: false, message: rpcError.message };
  revalidatePath("/inventory");
  revalidatePath("/inventory/current-stock");
  revalidatePath("/inventory/history");
  revalidatePath("/inventory/alerts");
  revalidatePath("/");
  return { success: true, message: "Stock received successfully." };
}
