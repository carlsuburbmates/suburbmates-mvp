
'use client';

import { PageHeader } from "@/components/page-header";
import { DashboardSidebar } from "./vendor/sidebar";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Vendor } from "@/lib/types";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const isVendorPath = pathname.includes('/dashboard/vendor');

  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "vendors", user.uid) : null),
    [firestore, user]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  const isLoading = isUserLoading || (isVendorPath && isVendorLoading);

  const getTitle = () => {
    if (isLoading) return "Loading Dashboard...";
    if (isVendorPath) {
      return vendor?.businessName || "Business Dashboard";
    }
    return "My Dashboard";
  };

  const getDescription = () => {
    if (isLoading) return "Please wait while we load your information.";
    if (isVendorPath) {
      if (vendor?.paymentsEnabled) {
        return "Manage your business profile, marketplace listings, and sales.";
      }
      return "Manage your business profile and directory listing."
    }
    return "Manage your orders and account settings."
  };

  return (
    <div>
      <PageHeader
        title={getTitle()}
        description={getDescription()}
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-5 gap-8">
          <aside className="lg:col-span-1">
            <DashboardSidebar isVendor={!!vendor} hasActiveListings={!!vendor?.paymentsEnabled} />
          </aside>
          <main className="lg:col-span-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
