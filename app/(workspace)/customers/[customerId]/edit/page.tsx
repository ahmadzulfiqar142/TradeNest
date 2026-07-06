import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateCustomerForm } from "@/features/customers/components/create-customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { customerId } = await params;

  const { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, address, city, notes, status")
    .eq("workspace_id", workspaceId)
    .eq("id", customerId)
    .single();

  if (!customer) notFound();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit customer</h1>
            <p className="text-sm text-muted-foreground">
              Update customer details, contact information, and balance.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
              Customers
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <CreateCustomerForm
              mode="edit"
              workspaceId={workspaceId}
              customer={customer}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
