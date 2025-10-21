
'use client';

import { PageHeader } from "@/components/page-header";
import { DashboardSidebar } from "./vendor/sidebar";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Vendor } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "vendors", user.uid) : null),
    [firestore, user]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  const isVendor = !!vendor;
  const isLoading = isUserLoading || isVendorLoading;

  const getTitle = () => {
    if (isLoading) return "Loading Dashboard...";
    return isVendor ? "Vendor Dashboard" : "Resident Dashboard";
  };

  const getDescription = () => {
    if (isLoading) return "Please wait while we load your information.";
    return isVendor
      ? "Manage your profile, listings, and payments."
      : "Manage your profile and view your order history.";
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
            <DashboardSidebar isVendor={isVendor} />
          </aside>
          <main className="lg:col-span-4">{children}</main>
        </div>
      </div>
    </div>
  );
}

    