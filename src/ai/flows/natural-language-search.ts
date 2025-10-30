'use server'
/**
 * @fileOverview An AI agent that translates natural language queries into structured search filters for the business directory.
 *
 * - naturalLanguageSearch - A function that processes a user's conversational search query.
 * - NaturalLanguageSearchInput - The input type for the function.
 * - NaturalLanguageSearchOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit'
import { z } from 'zod'

const NaturalLanguageSearchInputSchema = z.object({
  query: z
    .string()
    .describe(
      "The user's natural language search query for finding a local business."
    ),
})
export type NaturalLanguageSearchInput = z.infer<
  typeof NaturalLanguageSearchInputSchema
>

const NaturalLanguageSearchOutputSchema = z
  .object({
    category: z
      .string()
      .optional()
      .describe(
        'The identified business category, if any. Must be one of: gardening, cafe, plumbing, retail, bakery, services.'
      ),
    keywords: z
      .array(z.string())
      .optional()
      .describe(
        'A list of specific keywords or attributes extracted from the query (e.g., "wifi", "dog-friendly", "gluten-free").'
      ),
  })
  .describe("The structured search filters extracted from the user's query.")
export type NaturalLanguageSearchOutput = z.infer<
  typeof NaturalLanguageSearchOutputSchema
>

// Define the tool that the AI can use to report its findings.
// This enforces a structured output.
const searchFilterTool = ai.defineTool(
  {
    name: 'setSearchFilters',
    description:
      "Use this tool to provide the structured search filters based on the user's query.",
    inputSchema: NaturalLanguageSearchOutputSchema,
    outputSchema: z.void(),
  },
  async () => {} // The tool doesn't do anything, it's just for structured output.
)

export async function naturalLanguageSearch(
  input: NaturalLanguageSearchInput
): Promise<NaturalLanguageSearchOutput> {
  const llmResponse = await ai.generate({
    prompt: `You are a search assistant for a local business directory. Your goal is to understand a user's query and translate it into structured filters. Analyze the following query and use the setSearchFilters tool to set the appropriate category and keywords.

    Available categories are: gardening, cafe, plumbing, retail, bakery, services.

    User Query: "${input.query}"`,
    tools: [searchFilterTool],
    model: 'googleai/gemini-2.5-flash',
  })

  const toolRequest = llmResponse.toolRequests?.[0]
  if (toolRequest && toolRequest.toolRequest?.name === 'setSearchFilters') {
    return toolRequest.toolRequest.input as NaturalLanguageSearchOutput
  }

  // Fallback if the tool is not called
  return {
    category: undefined,
    keywords: [],
  }
}
