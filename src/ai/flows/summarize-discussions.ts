'use server';

/**
 * @fileOverview An AI tool to summarize forum discussions into concise bullet points.
 *
 * - summarizeDiscussion - A function that summarizes a forum discussion.
 * - SummarizeDiscussionInput - The input type for the summarizeDiscussion function.
 * - SummarizeDiscussionOutput - The return type for the summarizeDiscussion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDiscussionInputSchema = z.object({
  discussionText: z
    .string()
    .describe('The text of the forum discussion to summarize.'),
});
export type SummarizeDiscussionInput = z.infer<typeof SummarizeDiscussionInputSchema>;

const SummarizeDiscussionOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise bullet point summary of the forum discussion.'),
});
export type SummarizeDiscussionOutput = z.infer<typeof SummarizeDiscussionOutputSchema>;

export async function summarizeDiscussion(
  input: SummarizeDiscussionInput
): Promise<SummarizeDiscussionOutput> {
  return summarizeDiscussionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDiscussionPrompt',
  input: {schema: SummarizeDiscussionInputSchema},
  output: {schema: SummarizeDiscussionOutputSchema},
  prompt: `Summarize the following forum discussion into concise bullet points:\n\n{{{discussionText}}}`,
});

const summarizeDiscussionFlow = ai.defineFlow(
  {
    name: 'summarizeDiscussionFlow',
    inputSchema: SummarizeDiscussionInputSchema,
    outputSchema: SummarizeDiscussionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
