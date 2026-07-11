import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { createClient } from "@/supabase/server";
import { getPaymentDetails } from "@/actions/payment";
import { PaymentDetailsClient } from "./payment-details-client";

export const metadata: Metadata = {
  title: "Payment Details | TradeNest",
  description: "View payment details",
};

interface PaymentDetailsPageProps {
  params: Promise<{ paymentId: string }>;
}

export default async function PaymentDetailsPage({
  params,
}: PaymentDetailsPageProps) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    notFound();
  }

  const { paymentId } = await params;
  const result = await getPaymentDetails(workspaceId, paymentId);

  if (!result.payment || result.error) {
    notFound();
  }

  // Fetch sale data if payment is linked to a sale
  let saleData = null;
  if (result.payment.sale_id) {
    const supabase = await createClient();
    const { data: sale } = await supabase
      .from("sales")
      .select("invoice_number, total")
      .eq("id", result.payment.sale_id)
      .single();

    saleData = sale;
  }

  return (
    <PaymentDetailsClient
      payment={{ ...result.payment, sales: saleData }}
      workspaceName="TradeNest"
    />
  );
}
