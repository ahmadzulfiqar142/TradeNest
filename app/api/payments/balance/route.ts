import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const customerId = searchParams.get("customerId");

    if (!workspaceId || !customerId) {
      return NextResponse.json(
        { success: false, error: "Workspace ID and Customer ID are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get total purchases
    const { data: sales } = await supabase
      .from("sales")
      .select("total")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", customerId);

    // Get total payments (excluding soft deleted)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", customerId)
      .is("deleted_at", null);

    const totalPurchases =
      sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
    const totalPaid =
      payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) ?? 0;
    const pendingBalance = totalPurchases - totalPaid;

    return NextResponse.json({
      success: true,
      balance: pendingBalance,
      totalPurchases,
      totalPaid,
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch balance" },
      { status: 500 },
    );
  }
}
