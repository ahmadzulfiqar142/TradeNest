import { Metadata } from "next";
import { CreateWorkspaceForm } from "@/features/workspace/components/create-workspace-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create Workspace | Business Management System",
  description: "Create a new workspace for your business",
};

export default function CreateWorkspacePage() {
  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Create Your Workspace</h1>
        <p className="mt-2 text-muted-foreground">
          Set up your business workspace to get started
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>
            Enter your business information to create a new workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
