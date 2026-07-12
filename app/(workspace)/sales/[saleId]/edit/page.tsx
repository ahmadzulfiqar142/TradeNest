import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import {
  getSaleDetails,
  getProductsForSale,
  getCustomersForSale,
} from "@/actions/sale";
import { SaleForm } from "@/features/sales/components/sale-form";

export const metadata: Metadata = { title: "Edit Sale | TradeNest" };

interface EditSalePageProps {
  params: Promise<{ saleId: string }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { saleId } = await params;
  const { sale, items, error } = await getSaleDetails(workspaceId, saleId);

  if (error || !sale) notFound();

  // Only allow editing of pending sales
  if (sale.status !== "pending") {
    redirect(`/sales/${saleId}`);
  }

  // Fetch products and customers for the form
  const [productsResult, customersResult] = await Promise.all([
    getProductsForSale(workspaceId),
    getCustomersForSale(workspaceId),
  ]);

  const products = productsResult.products || [];
  const customers = customersResult.customers || [];

  // Transform sale data for the form
  const initialData = {
    customerId: sale.customer_id || undefined,
    saleDate: sale.sale_date,
    discount: sale.discount || 0,
    notes: sale.notes || undefined,
    items: items.map((item) => {
      if (item.product_id) {
        return {
          type: "product" as const,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          discount: item.discount || 0,
          total: Number(item.total),
        };
      } else {
        return {
          type: "one_time" as const,
          productId: null,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          discount: item.discount || 0,
          total: Number(item.total),
        };
      }
    }),
    paidAmount: Number(sale.paid_amount),
    paymentMethod: (sale as any).payment_method || undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Sale</h1>
        <p className="text-muted-foreground mt-1">
          Update sale details for invoice {sale.invoice_number}
        </p>
      </div>

      <SaleForm
        mode="edit"
        initialData={initialData}
        products={products}
        customers={customers}
        saleId={saleId}
        workspaceId={workspaceId}
      />
    </div>
  );
}
