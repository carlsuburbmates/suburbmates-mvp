
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
};

export type Listing = {
    id: string;
    vendorId: string;
    listingName: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
}

export type ForumPost = {
  id: string;
  author: {
    name: string;
    avatarId: string;
  };
  timestamp: string;
  content: string;
};

export type ForumThread = {
  id: string;
  title: string;
  author: {
    name: string;
    avatarId: string;
  };
  timestamp: string;
  tags: {
    name: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    isCouncil?: boolean;
  }[];
  posts: ForumPost[];
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
