'use server';

/**
 * @fileOverview Summarizes event details into a concise summary for residents.
 *
 * - summarizeEvents - A function that summarizes event details.
 * - SummarizeEventsInput - The input type for the summarizeEvents function.
 * - SummarizeEventsOutput - The return type for the summarizeEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEventsInputSchema = z.object({
  eventDetails: z
    .string()
    .describe('The details of the event to be summarized.'),
});
export type SummarizeEventsInput = z.infer<typeof SummarizeEventsInputSchema>;

const SummarizeEventsOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the event details.'),
});
export type SummarizeEventsOutput = z.infer<typeof SummarizeEventsOutputSchema>;

export async function summarizeEvents(
  input: SummarizeEventsInput
): Promise<SummarizeEventsOutput> {
  return summarizeEventsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEventsPrompt',
  input: {schema: SummarizeEventsInputSchema},
  output: {schema: SummarizeEventsOutputSchema},
  prompt: `Summarize the following event details into a few sentences:

{{{eventDetails}}}`,
});

const summarizeEventsFlow = ai.defineFlow(
  {
    name: 'summarizeEventsFlow',
    inputSchema: SummarizeEventsInputSchema,
    outputSchema: SummarizeEventsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
