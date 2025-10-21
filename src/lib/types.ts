

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type Vendor = {
  id: string;
  businessName: string;
  abn: string;
  email: string;
  phone?: string;
  website?: string;
  stripeAccountId?: string;
  paymentsEnabled?: boolean;
  reviewCount?: number;
  averageRating?: number;
  latitude?: number;
  longitude?: number;
};

export type Listing = {
    id: string;
    vendorId: string;
    listingName: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    deliveryMethod: 'Pickup Only' | 'Local Delivery Available';
}

export type ForumPost = {
  id: string;
  authorName: string;
  authorAvatarId: string;
  timestamp: string;
  content: string;
};

export type ForumThread = {
  id: string;
  title: string;
  authorName: string;
  authorAvatarId: string;
  timestamp: string;
  tags: {
    name: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    isCouncil?: boolean;
  }[];
  postCount?: number;
};

export type CommunityEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  details: string;
  imageId: string;
};

export type Order = {
  id: string;
  listingName: string;
  customerName: string;
  customerId?: string;
  vendorId?: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Refunded';
  paymentIntentId?: string;
};

export type Review = {
  id: string;
  residentId: string;
  residentName: string;
  rating: number;
  comment: string;
  timestamp: string;
};

export type Resident = {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    suburb: string;
}

    