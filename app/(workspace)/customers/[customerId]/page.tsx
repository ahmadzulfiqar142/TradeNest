import { notFound, redirect } from "next/navigation";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { getCustomerDetails } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";
import { CustomerDetailsClient } from "./customer-details-client";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { customerId } = await params;
  const result = await getCustomerDetails(workspaceId, customerId);

  if (!result.customer || result.error) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {result.customer.first_name} {result.customer.last_name}
          </h1>
          <p className="text-muted-foreground">Customer details and transaction history</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <CustomerDetailsClient
        workspaceId={workspaceId}
        customer={result.customer}
        invoices={result.invoices}
        payments={result.paymentHistory}
        ledger={result.ledger}
        summary={result.summary}
        currency={result.currency}
        currencySymbol={result.currencySymbol}
      />
    </div>
  );
}
