import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Button } from "@/components/ui/button";
import { CreateCustomerForm } from "@/features/customers/components/create-customer-form";

export default async function NewCustomerPage() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Add customer</h1>
            <p className="text-sm text-gray-400">
              Create a new customer with contact details and balance
              information.
            </p>
          </div>
          <Button variant="dark-outline" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
              Customers
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <CreateCustomerForm workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}
