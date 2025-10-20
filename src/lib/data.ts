import type { Vendor, ForumThread, CommunityEvent } from "@/lib/types";

export const vendors: Vendor[] = [
  {
    id: "1",
    name: "Green Thumb Gardening",
    category: "Gardening",
    rating: 4.8,
    reviews: 120,
    description: "Expert gardening and landscaping services for a beautiful suburban oasis.",
    imageId: "vendor-gardener",
  },
  {
    id: "2",
    name: "The Daily Grind Cafe",
    category: "Cafe",
    rating: 4.9,
    reviews: 350,
    description: "Your local spot for artisanal coffee, fresh pastries, and light lunches.",
    imageId: "vendor-cafe",
  },
  {
    id: "3",
    name: "Reliable Plumbing Co.",
    category: "Plumbing",
    rating: 4.7,
    reviews: 88,
    description: "24/7 emergency plumbing services. No job too big or too small.",
    imageId: "vendor-plumber",
  },
  {
    id: "4",
    name: "The Book Nook",
    category: "Retail",
    rating: 4.9,
    reviews: 150,
    description: "A cozy independent bookshop with a curated selection for all ages.",
    imageId: "vendor-bookshop",
  },
];

export const forumThreads: ForumThread[] = [
  {
    id: "thread-1",
    title: "Upcoming changes to local park zoning",
    author: { name: "Local Council", avatarId: "user-avatar-4" },
    timestamp: "2 days ago",
    tags: [
      { name: "Council Partner", variant: "destructive", isCouncil: true },
      { name: "Zoning", variant: "outline" },
    ],
    posts: [
      {
        id: "post-1-1",
        author: { name: "Local Council", avatarId: "user-avatar-4" },
        timestamp: "2 days ago",
        content: "We are seeking community feedback on the proposed zoning changes for Maple Leaf Park. The proposal involves designating a new area for off-leash dogs and adding community garden plots. Please find the detailed plans attached and share your thoughts below before the 15th of next month.",
      },
      {
        id: "post-1-2",
        author: { name: "Brenda P.", avatarId: "user-avatar-1" },
        timestamp: "1 day ago",
        content: "This is fantastic news! More space for community gardens is exactly what this neighborhood needs. I'm fully in support. Will there be a cost to rent a plot?",
      },
      {
        id: "post-1-3",
        author: { name: "Mark S.", avatarId: "user-avatar-2" },
        timestamp: "1 day ago",
        content: "I have some concerns about the off-leash area. The park is heavily used by families with young children. How will safety be ensured? I'd like to see plans for fencing and clear signage.",
      },
    ],
  },
  {
    id: "thread-2",
    title: "Seeking recommendations for a reliable house painter",
    author: { name: "Sarah J.", avatarId: "user-avatar-3" },
    timestamp: "5 days ago",
    tags: [{ name: "Recommendations", variant: "secondary" }],
    posts: [
      {
        id: "post-2-1",
        author: { name: "Sarah J.", avatarId: "user-avatar-3" },
        timestamp: "5 days ago",
        content: "Hi everyone, I'm looking to get the exterior of my house painted this spring. Does anyone have recommendations for a local painter who does good work at a fair price? Thanks in advance!",
      },
      {
        id: "post-2-2",
        author: { name: "Brenda P.", avatarId: "user-avatar-1" },
        timestamp: "5 days ago",
        content: "We used 'Paint Perfect' last year and were really happy with them. Not the cheapest quote we got, but their attention to detail was worth it. You can find them in the vendor marketplace on here!",
      },
    ],
  },
];

export const communityEvents: CommunityEvent[] = [
  {
    id: "event-1",
    title: "Annual Suburb Spring Fair",
    date: "Saturday, October 26th, 2024",
    location: "Central Park",
    description: "Join us for a day of fun with local food stalls, live music, and activities for the whole family.",
    details: "The Annual Suburb Spring Fair is a highlight of our community calendar. This year, we're featuring over 30 local vendors, a main stage with performances from local bands, a petting zoo for the kids, and a craft market. Entry is free. The event runs from 10:00 AM to 4:00 PM, rain or shine. Please consider using public transport as parking is limited.",
    imageId: "event-market",
  },
  {
    id: "event-2",
    title: "Introduction to Pottery Workshop",
    date: "Sunday, November 3rd, 2024",
    location: "Community Arts Center",
    description: "A hands-on workshop for beginners. Learn the basics of wheel throwing and create your own masterpiece.",
    details: "Unleash your creativity at our Introduction to Pottery Workshop. This 3-hour session is designed for absolute beginners. Our experienced instructor will guide you through the fundamentals of preparing clay and using the potter's wheel. All materials and firing costs for one piece are included in the ticket price of $50. Limited spots available, booking is essential via the Arts Center website.",
    imageId: "event-workshop",
  },
  {
    id: "event-3",
    title: "Riverbank Cleanup Day",
    date: "Saturday, November 9th, 2024",
    location: "Meet at the Old Bridge",
    description: "Help keep our suburb beautiful by volunteering for the annual riverbank cleanup.",
    details: "Let's work together to protect our local environment. Join the community for the annual Riverbank Cleanup Day. We will provide gloves, bags, and safety vests. Please wear sturdy, closed-toe shoes and bring a reusable water bottle. The cleanup will run from 9:00 AM to 12:00 PM, followed by a complimentary BBQ for all volunteers. This is a great way to meet neighbors and make a tangible difference.",
    imageId: "event-cleanup",
  },
];
