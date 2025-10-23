
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type Consent = {
  agreementId: 'vendor_tos' | 'refund_policy' | 'buyer_tos';
  version: string;
  timestamp: string;
};

export type Vendor = {
  id: string;
  businessName: string;
  abn: string;
  abnVerified?: boolean;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  stripeAccountId?: string;
  paymentsEnabled?: boolean;
  reviewCount?: number;
  averageRating?: number;
  latitude?: number;
  longitude?: number;
  refundPolicyUrl?: string;
  supportEmail?: string;
  fulfilmentTerms?: string;
  consents?: Consent[];
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
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  timestamp: string;
  content: string;
};

export type ForumThread = {
  id: string;
  title: string;
  authorName: string;
  authorAvatarUrl: string;
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
  buyerId: string;
  vendorId: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Refunded' | 'FAILED_PAYMENT' | 'DISPUTED';
  paymentIntentId: string;
  fulfilmentEta?: string;
  commChannelId?: string;
  customerName?: string; 
};

export type Review = {
  id: string;
  residentId: string;
  residentName: string;
  rating: number;
  comment: string;
  timestamp: string;
};

export type CommunicationChannel = {
  id: string;
  orderId: string;
  buyerId: string;
  vendorId: string;
  status: 'OPEN' | 'CLOSED';
};

export type Message = {
  id: string;
  commChannelId: string;
  senderId: string;
  role: 'buyer' | 'vendor' | 'system';
  body: string;
  createdAt: string;
};

export type Agreement = {
  id: string;
  type: 'buyer_tos' | 'vendor_tos' | 'refund_policy';
  version: string;
  url: string;
  _lastValidated: string;
};

export type RefundRequest = {
  id: string;
  orderId: string;
  buyerId: string;
  vendorId: string;
  reason: string;
  attachments?: string[];
  state: 'OPEN' | 'VENDOR_REVIEW' | 'STRIPE_PROCESSING' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';
  stripeRefundId?: string;
  decision?: string;
  decisionBy?: string;
  decisionAt?: string;
};

export type Dispute = {
    id?: string; // Firestore document ID
    stripeDisputeId: string;
    paymentIntentId: string;
    orderId: string;
    vendorId: string;
    buyerId: string;
    amount: number;
    currency: string;
    reason: string;
    status: string;
    createdAt: string;
    evidenceDueBy: string;
}

export type LogEntry = {
    id?: string;
    timestamp: string;
    type: 'webhook' | 'email';
    source: string;
    eventId: string;
    status: 'received' | 'processed' | 'sent' | 'failed';
    payload: object;
    error?: string;
}
