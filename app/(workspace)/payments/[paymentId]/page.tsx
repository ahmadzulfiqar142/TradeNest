import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
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

  return <PaymentDetailsClient payment={result.payment} />;
}
