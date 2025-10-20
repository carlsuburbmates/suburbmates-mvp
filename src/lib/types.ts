export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  imageId: string;
};

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
