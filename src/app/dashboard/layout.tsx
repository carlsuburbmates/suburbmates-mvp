
'use client';

import { PageHeader } from "@/components/page-header";
import { DashboardSidebar } from "./vendor/sidebar";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Vendor } from "@/lib/types";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [hasVendorClaim, setHasVendorClaim] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(true);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        setHasVendorClaim(!!idTokenResult.claims.vendor);
        setIsClaimLoading(false);
      });
    } else if (!isUserLoading) {
      setIsClaimLoading(false);
    }
  }, [user, isUserLoading]);


  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "vendors", user.uid) : null),
    [firestore, user]
  );
  const { data: vendor, isLoading: isVendorDocLoading } = useDoc<Vendor>(vendorRef);

  const isLoading = isUserLoading || isClaimLoading || (vendor && isVendorDocLoading);
  
  // Determine role based on claims and data
  const isBusiness = !!vendor; // Has a business profile of any kind
  const isMarketplaceVendor = isBusiness && !!vendor?.paymentsEnabled; // Approved to sell

  const getTitle = () => {
    if (isLoading) return "Loading Dashboard...";
    if (isMarketplaceVendor) return vendor?.businessName || "Vendor Dashboard";
    if (isBusiness) return vendor?.businessName || "Business Dashboard";
    return "My Dashboard";
  };

  const getDescription = () => {
    if (isLoading) return "Please wait while we load your information.";
    if (isMarketplaceVendor) return "Manage your business profile, marketplace listings, and sales.";
    if (isBusiness) return "Manage your business directory listing and complete onboarding to become a vendor.";
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
            <DashboardSidebar isBusiness={isBusiness} isMarketplaceVendor={isMarketplaceVendor} />
          </aside>
          <main className="lg:col-span-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
