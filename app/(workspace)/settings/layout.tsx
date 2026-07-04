import { SettingsSidebar } from "@/features/settings/components/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SettingsSidebar />
      <div className="flex-1 md:ml-64">{children}</div>
    </div>
  );
}
