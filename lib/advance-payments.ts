"use server";

import { createClient } from "@/supabase/server";

/**
 * Consumes the oldest unlinked advance payments for a customer, oldest-first,
 * up to `amount`. Links consumed records to `saleId` and records ledger entries.
 * Returns the total actually consumed (may be less than `amount` if balance is insufficient).
 */
export async function consumeAdvancePayments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  customerId: string,
  saleId: string,
  amount: number,
  saleDate: string,
  userId: string,
): Promise<number> {
  const { data: advances } = await supabase
    .from("payments")
    .select("id, amount")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .is("sale_id", null)
    .is("deleted_at", null)
    .order("payment_date", { ascending: true });

  if (!advances || advances.length === 0) return 0;

  let remaining = amount;

  for (const adv of advances) {
    if (remaining <= 0) break;
    const consume = Math.min(Number(adv.amount), remaining);

    if (consume >= Number(adv.amount)) {
      await supabase
        .from("payments")
        .update({ sale_id: saleId, notes: `Advance applied to invoice` })
        .eq("id", adv.id);
    } else {
      await supabase
        .from("payments")
        .update({ amount: Number(adv.amount) - consume })
        .eq("id", adv.id);

      const { data: newAdv } = await supabase
        .from("payments")
        .insert({
          workspace_id: workspaceId,
          customer_id: customerId,
          sale_id: saleId,
          amount: consume,
          payment_method: "advance",
          payment_date: saleDate,
          notes: `Advance applied to invoice`,
          created_by: userId,
        })
        .select("id")
        .single();

      if (newAdv) {
        await supabase.rpc("update_customer_ledger", {
          p_customer_id: customerId,
          p_workspace_id: workspaceId,
          p_transaction_type: "payment",
          p_reference_type: "payment",
          p_reference_id: newAdv.id,
          p_debit: 0,
          p_credit: consume,
          p_description: "Advance applied to invoice",
        });
      }
    }

    remaining -= consume;
  }

  return amount - remaining;
}
