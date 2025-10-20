import { PageHeader } from "@/components/page-header";
import { DashboardSidebar } from "./vendor/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title="Vendor Dashboard"
        description="Manage your profile, listings, and payments."
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <DashboardSidebar />
          </aside>
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
