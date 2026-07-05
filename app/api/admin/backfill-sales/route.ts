import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch all non-deleted payments that are linked to a sale
  const { data: paymentRows } = await admin
    .from("payments")
    .select("sale_id, amount")
    .is("deleted_at", null)
    .not("sale_id", "is", null);

  // Group totals by sale_id
  const totals = new Map<string, number>();
  for (const p of paymentRows ?? []) {
    if (!p.sale_id) continue;
    totals.set(p.sale_id, (totals.get(p.sale_id) ?? 0) + Number(p.amount));
  }

  // Fetch all sales
  const { data: sales } = await admin
    .from("sales")
    .select("id, total");

  if (!sales) {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }

  let updated = 0;
  for (const sale of sales) {
    const totalPaid = totals.get(sale.id) ?? 0;
    const saleTotal = Number(sale.total);
    const paidAmount = Math.min(totalPaid, saleTotal);
    const remainingAmount = Math.max(0, saleTotal - totalPaid);
    const status =
      totalPaid <= 0
        ? "pending"
        : totalPaid >= saleTotal
          ? "paid"
          : "partially_paid";

    await admin
      .from("sales")
      .update({ paid_amount: paidAmount, remaining_amount: remainingAmount, status, payment_status: status })
      .eq("id", sale.id);

    updated++;
  }

  return NextResponse.json({ success: true, message: `Backfilled ${updated} sales` });
}
