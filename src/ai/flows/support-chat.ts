'use server'
/**
 * @fileOverview A RAG-powered AI chatbot to answer user questions based on platform documentation.
 *
 * - supportChat - The main flow that takes a user query and returns a grounded answer.
 */

import { ai } from '@/ai/genkit'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

const SupportChatInputSchema = z.object({ query: z.string() })
const SupportChatOutputSchema = z.object({ response: z.string() })

export type SupportChatInput = z.infer<typeof SupportChatInputSchema>
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>

// In-memory cache for documentation context to avoid repeated file system reads
let docsCache: { content: string; timestamp: number } | null = null
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes cache

// Enhanced helper to read documentation files with caching
function readDocsContext(): string {
  const now = Date.now()

  if (docsCache && now - docsCache.timestamp < CACHE_DURATION_MS) {
    return docsCache.content
  }

  const candidates = [
    path.join(
      process.cwd(),
      'docs/firebase-guidelines/firebase-development-guidelines.md'
    ),
    path.join(
      process.cwd(),
      'docs/firebase-guidelines/validation-checklists/firestore.md'
    ),
    path.join(
      process.cwd(),
      'docs/firebase-guidelines/validation-checklists/auth.md'
    ),
    path.join(process.cwd(), 'docs/PRD.md'),
    path.join(process.cwd(), 'docs/SSOT.md'),
    path.join(process.cwd(), 'docs/blueprint.md'),
  ]

  const chunks: string[] = []
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf8')
        chunks.push(`=== ${path.basename(candidate)} ===\n${content.slice(0, 3000)}\n`)
      }
    } catch {
      // Ignore read errors to keep flow resilient
    }

    if (chunks.join('\n').length > 10000) break // Increased limit for broader context
  }

  const context = chunks.join('\n\n')

  docsCache = {
    content: context,
    timestamp: now,
  }

  return context
}

// Define the prompt that will be used to generate the answer.
const supportPrompt = ai.definePrompt({
  name: 'support-chat-prompt',
  input: {
    schema: z.object({
      query: z.string(),
      context: z.string(),
    }),
  },
  system: `You are the "Suburbmates Support Assistant," a friendly and helpful AI chatbot for a local community platform. Your goal is to answer user questions accurately based on the provided context.

      **Instructions:**
      1.  Analyze the user's "Query" and the "Context" provided.
      2.  Formulate a concise and clear answer to the query using **only** the information from the "Context".
      3.  Do not make up information, policies, or features that are not explicitly mentioned in the context.
      4.  If the context does not contain the information needed to answer the query, you MUST respond with: "I'm sorry, I don't have information on that topic. You can try rephrasing your question or browse our documentation."
      5.  Keep your answers brief and to the point.
      6.  Always be polite and helpful in your tone.`,
  prompt: `
        **Query:**
        {{{query}}}
        
        ---
        
        **Context:**
        {{{context}}}
      `,
})

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async (input) => {
    const context = readDocsContext()

    const llmResponse = await supportPrompt({
      query: input.query,
      context,
    })

    return { response: llmResponse.text }
  }
)

export async function supportChat(
  input: SupportChatInput
): Promise<SupportChatOutput> {
  return supportChatFlow(input)
}
