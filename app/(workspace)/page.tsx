import { redirect } from "next/navigation";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import DashboardClient from "@/features/dashboard/components/DashboardClient";
import { getAllDashboardData } from "@/actions/dashboard";
import { getDateRange, DEFAULT_PRESET } from "@/lib/dashboard-filters";
import type { FilterPreset, DateRange } from "@/lib/dashboard-filters";

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const params = await searchParams;
  const preset = (params.preset as FilterPreset) ?? DEFAULT_PRESET;
  const customRange: DateRange | undefined =
    params.from && params.to ? { from: params.from, to: params.to } : undefined;

  const range = getDateRange(preset, customRange);
  const initialData = await getAllDashboardData(workspaceId, range);

  return (
    <DashboardClient
      workspaceId={workspaceId}
      initialData={initialData}
      initialPreset={preset}
      initialCustomRange={customRange}
    />
  );
}
