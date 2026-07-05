import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { getSaleDetails, cancelSale } from "@/actions/sale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SALE_STATUS_LABELS, SALE_STATUS_COLORS } from "@/schemas/sale";

export const metadata: Metadata = { title: "Sale Details | TradeNest" };

interface SaleDetailPageProps {
  params: Promise<{ saleId: string }>;
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { saleId } = await params;
  const { sale, items, payments, error } = await getSaleDetails(workspaceId, saleId);

  if (error || !sale) notFound();

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = Number(sale.total) - totalPaid;

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Sales</span>
        </Link>

        {sale.status !== "cancelled" && sale.status !== "paid" && (
          <form
            action={async () => {
              "use server";
              await cancelSale(workspaceId, saleId);
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Sale
            </Button>
          </form>
        )}
      </div>

      {/* Invoice Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-mono">
                {sale.invoice_number}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date(sale.sale_date).toLocaleDateString("en-PK", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`self-start inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                SALE_STATUS_COLORS[sale.status] ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {SALE_STATUS_LABELS[sale.status] ?? sale.status}
            </span>
          </div>

          {sale.customers && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
              <Link
                href={`/customers/${sale.customers.id}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {sale.customers.first_name} {sale.customers.last_name}
              </Link>
              <p className="text-sm text-muted-foreground">{sale.customers.phone}</p>
              {sale.customers.address && (
                <p className="text-sm text-muted-foreground">{sale.customers.address}</p>
              )}
            </div>
          )}

          {sale.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-foreground">{sale.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Items</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-center">Disc %</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      Rs. {Number(item.unit_price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.discount > 0 ? `${item.discount}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rs. {Number(item.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t flex flex-col items-end gap-2 text-sm">
            <div className="flex gap-12 text-muted-foreground">
              <span>Subtotal</span>
              <span className="w-32 text-right font-medium text-foreground">
                Rs. {Number(sale.subtotal).toLocaleString()}
              </span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex gap-12 text-muted-foreground">
                <span>Discount</span>
                <span className="w-32 text-right text-red-500">
                  − Rs. {Number(sale.discount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex gap-12 font-bold text-base">
              <span>Total</span>
              <span className="w-32 text-right">
                Rs. {Number(sale.total).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Payments</h2>
            {outstanding > 0 && sale.status !== "cancelled" && sale.customers && (
              <Button asChild size="sm">
                <Link href={`/payments?customerId=${sale.customers.id}&saleId=${saleId}`}>
                  Record Payment
                </Link>
              </Button>
            )}
          </div>

          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        {p.payment_method.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.reference_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        Rs. {Number(p.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Payment summary */}
          <div className="mt-4 pt-4 border-t flex flex-col items-end gap-2 text-sm">
            <div className="flex gap-12 text-muted-foreground">
              <span>Total Paid</span>
              <span className="w-32 text-right font-medium text-green-600">
                Rs. {totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-12 font-bold">
              <span>Outstanding</span>
              <span className={`w-32 text-right ${outstanding > 0 ? "text-red-500" : "text-green-600"}`}>
                {outstanding > 0 ? `Rs. ${outstanding.toLocaleString()}` : "Settled ✓"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
