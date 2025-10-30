/**
 * @fileoverview A script to seed the Firestore database with initial data for the Civic Hub.
 * To run, use: `npm run db:seed`
 * This script is idempotent; it will not duplicate data if run multiple times.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import 'dotenv/config'

// --- Data Definitions ---

const forumThreads = [
  {
    id: 'council-plan-2030',
    title: 'Feedback on the Darebin 2030 Community Vision',
    authorName: 'Darebin City Council',
    authorAvatarUrl: 'https://placehold.co/100x100/A8D5E2/333333?text=DC',
    timestamp: '2024-05-10T10:00:00Z',
    tags: [
      { name: 'Official', variant: 'default' as const, isCouncil: true },
      { name: 'Planning', variant: 'secondary' as const },
    ],
  },
  {
    id: 'preston-market-future',
    title: 'The future of Preston Market: what do residents want?',
    authorName: 'Valerie P.',
    authorAvatarUrl:
      'https://images.unsplash.com/photo-1692736475357-7c18bfbb808b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8d29tYW4lMjBzbWlsaW5nfGVufDB8fHx8MTc2MDkxNzQxNXww&ixlib=rb-4.1.0&q=80&w=1080',
    timestamp: '2024-05-15T14:30:00Z',
    tags: [
      { name: 'Community', variant: 'outline' as const },
      { name: 'Development', variant: 'destructive' as const },
    ],
  },
]

const forumPosts = {
  'council-plan-2030': [
    {
      authorName: 'Darebin City Council',
      authorAvatarUrl: 'https://placehold.co/100x100/A8D5E2/333333?text=DC',
      timestamp: '2024-05-10T10:00:00Z',
      content:
        "Hello Darebin residents! We've released the draft for our 2030 Community Vision and would love your feedback. Please review the attached (fictional) document and let us know your thoughts on key areas like sustainability, transport, and local business support.",
    },
    {
      authorName: 'John M.',
      authorAvatarUrl:
        'https://images.unsplash.com/photo-1612694790876-bec1383fbb40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxtYW4lMjBnbGFzc2VzfGVufDB8fHx8MTc2MDg1MjA3MHww&ixlib=rb-4.1.0&q=80&w=1080',
      timestamp: '2024-05-11T09:22:00Z',
      content:
        "Thanks for sharing. My main concern is public transport. The plan mentions 'improving connections,' but we need more concrete actions. More frequent buses along the 86 tram corridor, especially on weekends, would make a huge difference.",
    },
  ],
  'preston-market-future': [
    {
      authorName: 'Valerie P.',
      authorAvatarUrl:
        'https://images.unsplash.com/photo-1692736475357-7c18bfbb808b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8d29tYW4lMjBzbWlsaW5nfGVufDB8fHx8MTc2MDkxNzQxNXww&ixlib=rb-4.1.0&q=80&w=1080',
      timestamp: '2024-05-15T14:30:00Z',
      content:
        "I'm creating this thread because I'm worried about all the development plans for Preston Market. It's such an important part of our community. I want to hear from others what they value most and what they'd hate to lose. For me, it's the diverse range of vendors and the chaotic, vibrant atmosphere.",
    },
  ],
}

const communityEvents = [
  {
    id: 'darebin-creek-cleanup-2024',
    title: 'Darebin Creek Community Cleanup',
    date: 'Saturday, August 17, 2024 @ 10:00 AM',
    location: 'Darebin Parklands, enter from Separation Street',
    description:
      "Join your neighbors for our annual creek cleanup day! Let's work together to keep our local waterways beautiful and safe for wildlife.",
    details:
      'All ages welcome. Please wear sturdy, closed-toe shoes. Gloves and bags will be provided. A free sausage sizzle will be held for all volunteers at 1 PM near the main BBQ area. This event is a great way to meet people and make a tangible difference in our environment. Sponsored by Darebin City Council and GreenLeaf Gardening Supplies.',
    imageId: 'event-cleanup',
  },
  {
    id: 'northcote-town-hall-market',
    title: 'Northcote Town Hall Artisan Market',
    date: 'Sunday, August 25, 2024 @ 11:00 AM - 4:00 PM',
    location: 'Northcote Town Hall Arts Centre',
    description:
      'Discover unique, handmade goods from local artists and creators at the quarterly artisan market.',
    details:
      'Explore a curated selection of ceramics, jewelry, prints, textiles, and more. Support local artists and find one-of-a-kind treasures. The market will feature live music from local musicians and a coffee cart from The Daily Grind Cafe. Entry is free.',
    imageId: 'event-market',
  },
]

// --- Seeding Logic ---

async function main() {
  console.log('--- Starting Database Seed ---')

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY not found in .env file. Cannot initialize Firebase Admin.'
    )
  }

  // Initialize Firebase Admin
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    initializeApp({
      credential: cert(serviceAccount),
    })
  }

  const db = getFirestore()

  // Seed Forum Threads and Posts
  for (const thread of forumThreads) {
    const threadRef = db.collection('forumThreads').doc(thread.id)
    const threadSnap = await threadRef.get()

    if (!threadSnap.exists) {
      console.log(`Creating thread: ${thread.title}`)
      await threadRef.set({ ...thread, postCount: 0 })

      // Seed posts for this new thread
      // @ts-ignore
      const postsForThread = forumPosts[thread.id] || []
      for (const post of postsForThread) {
        console.log(`  - Adding post by ${post.authorName}`)
        await threadRef.collection('posts').add(post)
      }

      // Update post count
      await threadRef.update({ postCount: postsForThread.length })
    } else {
      console.log(`Skipping existing thread: ${thread.title}`)
    }
  }

  // Seed Community Events
  for (const event of communityEvents) {
    const eventRef = db.collection('communityEvents').doc(event.id)
    const eventSnap = await eventRef.get()

    if (!eventSnap.exists) {
      console.log(`Creating event: ${event.title}`)
      await eventRef.set(event)
    } else {
      console.log(`Skipping existing event: ${event.title}`)
    }
  }

  console.log('\n--- Database Seed Complete ---')
}

main().catch((error) => {
  console.error('Error seeding database:', error)
  process.exit(1)
})
