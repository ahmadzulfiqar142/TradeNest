import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
        <p className="text-muted-foreground">Track and manage your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <Warehouse className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <CardTitle>Inventory Module</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Stock in/out transactions</li>
            <li>• Stock adjustments</li>
            <li>• Transaction history</li>
            <li>• Low stock alerts</li>
            <li>• Inventory valuation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
