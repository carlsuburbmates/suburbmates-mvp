'use server';
/**
 * @fileOverview An AI agent that moderates forum post content using Vertex AI's safety features.
 *
 * - moderateForumPost - A function that checks if post content is safe.
 * - ModerateForumPostInput - The input type for the function.
 * - ModerateForumPostOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateRequest } from '@genkit-ai/google-genai';

const ModerateForumPostInputSchema = z.object({
  postContent: z.string().describe('The content of the forum post to moderate.'),
});
export type ModerateForumPostInput = z.infer<typeof ModerateForumPostInputSchema>;

const ModerateForumPostOutputSchema = z.object({
  isSafe: z.boolean().describe("Whether the content is considered safe or not."),
  reason: z.string().optional().describe("The reason why the content was blocked, if applicable."),
});
export type ModerateForumPostOutput = z.infer<typeof ModerateForumPostOutputSchema>;


// Define the safety settings to be applied.
// We block content that is rated MEDIUM or higher for these sensitive categories.
const safetySettings: GenerateRequest['safetySettings'] = [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
];

const harmCategoryMap: Record<string, string> = {
  'HARM_CATEGORY_HATE_SPEECH': 'Hate Speech',
  'HARM_CATEGORY_HARASSMENT': 'Harassment',
  'HARM_CATEGORY_DANGEROUS_CONTENT': 'Dangerous Content',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'Sexually Explicit Content',
};


export async function moderateForumPost(input: ModerateForumPostInput): Promise<ModerateForumPostOutput> {
  return moderateForumPostFlow(input);
}


const moderateForumPostFlow = ai.defineFlow(
  {
    name: 'moderateForumPostFlow',
    inputSchema: ModerateForumPostInputSchema,
    outputSchema: ModerateForumPostOutputSchema,
  },
  async (input) => {
    
    try {
        const response = await ai.generate({
            model: 'gemini-1.5-flash',
            prompt: `Is the following text appropriate for a community forum? Text: "${input.postContent}"`,
            config: {
                safetySettings,
            },
        });

        const finishReason = response.candidates[0]?.finishReason;
        const safetyRatings = response.candidates[0]?.safetyRatings;
        
        // If the model blocks the content due to safety settings
        if (finishReason === 'SAFETY') {
            let blockedCategories: string[] = [];
            if (safetyRatings) {
                blockedCategories = safetyRatings
                    .filter(rating => rating.blocked)
                    .map(rating => harmCategoryMap[rating.category] || rating.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' '));
            }

            const reasonMessage = blockedCategories.length > 0
                ? `This post was blocked for containing content related to: ${blockedCategories.join(', ')}.`
                : 'This post was blocked due to safety concerns.';

            return { isSafe: false, reason: reasonMessage };
        }

        // If the content is not explicitly blocked, we consider it safe.
        return { isSafe: true };

    } catch (e: any) {
      // It's possible the generate call itself throws an error if the prompt is blocked.
      // We can inspect the error to see if it's a safety issue.
      if (e.message.includes('SAFETY')) {
        return {
          isSafe: false,
          reason: 'This post was blocked due to safety concerns.'
        };
      }
      
      // For other errors, we re-throw them.
      console.error("Moderation flow error:", e);
      throw e;
    }
  }
);
