"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "@/lib/auth/workspace";

export type WriteOffActionState = { success: boolean; message: string };

export async function writeOffExpiredBatch(
  workspaceId: string,
  batchId: string,
): Promise<WriteOffActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { success: false, message: error ?? "Unauthorized" };

  const { error: rpcError } = await supabase.rpc("write_off_expired_batch", {
    p_workspace_id: workspaceId,
    p_batch_id: batchId,
    p_user_id: user.id,
  });

  if (rpcError) return { success: false, message: rpcError.message };

  revalidatePath("/inventory/alerts");
  revalidatePath("/inventory/current-stock");
  revalidatePath("/inventory/history");
  revalidatePath("/");

  return { success: true, message: "Batch written off successfully." };
}
