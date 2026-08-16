"use client";

import { useState } from "react";
import { AlertTriangle, Package, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { writeOffExpiredBatch } from "@/actions/batch";

interface ExpiryAlertsClientProps {
  workspaceId: string;
  expiringProducts: Array<{
    product_id: string;
    product_name: string;
    batch_id: string | null;
    batch_number: string | null;
    expiry_date: string;
    days_until_expiry: number;
    stock_quantity: number;
    category_name: string | null;
  }>;
  lowStockProducts: Array<{
    product_id: string;
    product_name: string;
    stock_quantity: number;
    min_stock_quantity: number;
    selling_price: number;
    category_name: string | null;
  }>;
}

export function ExpiryAlertsClient({
  workspaceId,
  expiringProducts,
  lowStockProducts,
}: ExpiryAlertsClientProps) {
  const { success, error } = useToast();
  const [writingOff, setWritingOff] = useState<string | null>(null);
  const [writeOffTarget, setWriteOffTarget] = useState<string | null>(null);

  async function confirmWriteOff(batchId: string) {
    setWritingOff(batchId);
    const result = await writeOffExpiredBatch(workspaceId, batchId);
    if (result.success) {
      success("Written off", result.message);
    } else {
      error("Error", result.message);
    }
    setWritingOff(null);
    setWriteOffTarget(null);
  }
  const expiredProducts = expiringProducts.filter(
    (p) => p.days_until_expiry < 0,
  );
  const expiringSoonProducts = expiringProducts.filter(
    (p) => p.days_until_expiry >= 0,
  );

  const getExpiryBadge = (days: number) => {
    if (days < 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Expired
        </span>
      );
    } else if (days <= 7) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Critical ({days} days)
        </span>
      );
    } else if (days <= 30) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Warning ({days} days)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          {days} days
        </span>
      );
    }
  };

  const getStockBadge = (current: number, min: number) => {
    const ratio = current / min;
    if (ratio <= 0.5) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Critical
        </span>
      );
    } else if (ratio <= 1) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Low
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Adequate
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Monitor product expiry and stock levels
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expired Products
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {expiredProducts.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expiring Soon
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {expiringSoonProducts.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {lowStockProducts.length}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expired Products */}
      {expiredProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Expired Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredProducts.map((product) => (
                <div
                  key={product.batch_id ?? product.product_id}
                  className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.category_name && `${product.category_name} • `}
                      Stock: {product.stock_quantity} units
                      {product.batch_number &&
                        ` • Batch: ${product.batch_number}`}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Expired on{" "}
                      {new Date(product.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getExpiryBadge(product.days_until_expiry)}
                    {product.batch_id && (
                      <>
                        <button
                          onClick={() => setWriteOffTarget(product.batch_id!)}
                          disabled={writingOff === product.batch_id}
                          className="p-1.5 rounded text-red-600 hover:bg-red-100 disabled:opacity-50"
                          title="Write off expired batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ConfirmDialog
                          open={writeOffTarget === product.batch_id}
                          onOpenChange={(open) =>
                            !open && setWriteOffTarget(null)
                          }
                          onConfirm={() => confirmWriteOff(product.batch_id!)}
                          title="Write off expired batch?"
                          description={`This will permanently remove ${product.stock_quantity} units of ${product.product_name} (batch: ${product.batch_number ?? "N/A"}). This action cannot be undone.`}
                          confirmText="Write off"
                          cancelText="Cancel"
                          variant="destructive"
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon */}
      {expiringSoonProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="w-5 h-5" />
              Expiring Within 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringSoonProducts.map((product) => (
                <div
                  key={product.batch_id ?? product.product_id}
                  className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.category_name && `${product.category_name} • `}
                      Stock: {product.stock_quantity} units
                      {product.batch_number &&
                        ` • Batch: ${product.batch_number}`}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Expires on{" "}
                      {new Date(product.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                  {getExpiryBadge(product.days_until_expiry)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Package className="w-5 h-5" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.category_name && `${product.category_name} • `}
                      Min Stock: {product.min_stock_quantity} units
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Current: {product.stock_quantity} units • Price: Rs{" "}
                      {product.selling_price.toFixed(2)}
                    </p>
                  </div>
                  {getStockBadge(
                    product.stock_quantity,
                    product.min_stock_quantity,
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Alerts */}
      {expiredProducts.length === 0 &&
        expiringSoonProducts.length === 0 &&
        lowStockProducts.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  All Good!
                </h3>
                <p className="text-muted-foreground">
                  No expiry or stock alerts at this time.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
