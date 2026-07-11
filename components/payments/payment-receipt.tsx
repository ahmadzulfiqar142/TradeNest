"use client";

import { format } from "date-fns";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentReceiptProps {
  payment: {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    customers: {
      first_name: string;
      last_name: string;
      phone: string;
    } | null;
    sales: {
      invoice_number: string;
      total: number;
    } | null;
  };
  workspaceName?: string;
}

export function PaymentReceipt({
  payment,
  workspaceName = "TradeNest",
}: PaymentReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt - ${payment.id.slice(0, 8)}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #2563EB;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .header h1 {
                color: #2563EB;
                margin: 0;
              }
              .info-section {
                margin-bottom: 20px;
              }
              .info-section h2 {
                color: #2563EB;
                font-size: 16px;
                margin-bottom: 10px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
              }
              .label {
                font-weight: bold;
                color: #6b7280;
              }
              .value {
                color: #111827;
              }
              .amount-section {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .amount-row {
                display: flex;
                justify-content: space-between;
                font-size: 18px;
                font-weight: bold;
              }
              .amount {
                color: #2563EB;
                font-size: 24px;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${workspaceName}</h1>
              <p>Payment Receipt</p>
            </div>

            <div class="info-section">
              <h2>Receipt Information</h2>
              <div class="info-row">
                <span class="label">Receipt Number:</span>
                <span class="value">${payment.reference_number || payment.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="label">Payment Date:</span>
                <span class="value">${format(new Date(payment.payment_date), "MMMM dd, yyyy")}</span>
              </div>
              <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${payment.payment_method.replace(/_/g, " ").toUpperCase()}</span>
              </div>
            </div>

            <div class="info-section">
              <h2>Customer Information</h2>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${payment.customers ? `${payment.customers.first_name} ${payment.customers.last_name}` : "N/A"}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${payment.customers?.phone || "N/A"}</span>
              </div>
            </div>

            ${
              payment.sales
                ? `
            <div class="info-section">
              <h2>Invoice Information</h2>
              <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value">${payment.sales.invoice_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Invoice Total:</span>
                <span class="value">$${payment.sales.total.toFixed(2)}</span>
              </div>
            </div>
            `
                : ""
            }

            <div class="amount-section">
              <div class="amount-row">
                <span>Payment Amount:</span>
                <span class="amount">$${payment.amount.toFixed(2)}</span>
              </div>
            </div>

            ${
              payment.notes
                ? `
            <div class="info-section">
              <h2>Notes</h2>
              <p>${payment.notes}</p>
            </div>
            `
                : ""
            }

            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>Generated on ${format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Receipt Preview */}
      <div
        id="receipt-content"
        className="bg-white border-2 border-gray-200 rounded-lg p-8 max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
          <h1 className="text-3xl font-bold text-blue-600">{workspaceName}</h1>
          <p className="text-gray-600">Payment Receipt</p>
        </div>

        {/* Receipt Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2 mb-3">
            Receipt Information
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">
                Receipt Number:
              </span>
              <span className="text-gray-900">
                {payment.reference_number ||
                  payment.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Payment Date:</span>
              <span className="text-gray-900">
                {format(new Date(payment.payment_date), "MMMM dd, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">
                Payment Method:
              </span>
              <span className="text-gray-900">
                {payment.payment_method.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2 mb-3">
            Customer Information
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Name:</span>
              <span className="text-gray-900">
                {payment.customers
                  ? `${payment.customers.first_name} ${payment.customers.last_name}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Phone:</span>
              <span className="text-gray-900">
                {payment.customers?.phone || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        {payment.sales && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2 mb-3">
              Invoice Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">
                  Invoice Number:
                </span>
                <span className="text-gray-900">
                  {payment.sales.invoice_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">
                  Invoice Total:
                </span>
                <span className="text-gray-900">
                  ${payment.sales.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Payment Amount:</span>
            <span className="text-blue-600 text-2xl">
              ${payment.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-600 border-b border-gray-200 pb-2 mb-3">
              Notes
            </h2>
            <p className="text-gray-700">{payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t border-gray-200">
          <p>Thank you for your payment!</p>
          <p>Generated on {format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 no-print">
        <Button onClick={handlePrint} variant="default" size="lg">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        <Button onClick={handleDownload} variant="outline" size="lg">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
