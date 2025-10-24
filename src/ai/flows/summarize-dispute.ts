
'use server';
/**
 * @fileOverview An AI agent that summarizes a Stripe dispute and assesses its risk.
 *
 * - summarizeDispute - A function that runs a comprehensive analysis on dispute details.
 * - SummarizeDisputeInput - The input type for the function.
 * - DisputeSummary - The return type for the function (the summary object).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the flow
export const SummarizeDisputeInputSchema = z.object({
    disputeReason: z.string().describe('The raw dispute reason provided by Stripe (e.g., "fraudulent", "product_not_received").'),
    productName: z.string().describe('The name of the product or listing being disputed.'),
    amount: z.number().describe('The disputed amount in currency units (e.g., dollars).'),
});
export type SummarizeDisputeInput = z.infer<typeof SummarizeDisputeInputSchema>;

// Define the structured output the AI must produce
export const DisputeSummarySchema = z.object({
    summary: z.string()
        .describe('A concise, one-sentence, human-readable summary of the dispute.'),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
        .describe('An assessment of the risk level to the platform or vendor.'),
    recommendedAction: z.string()
        .describe('A brief, actionable next step for the admin or vendor (e.g., "Advise vendor to submit shipping proof.").'),
});
export type DisputeSummary = z.infer<typeof DisputeSummarySchema>;


// The main exported function that wraps the Genkit flow
export async function summarizeDispute(input: SummarizeDisputeInput): Promise<DisputeSummary> {
    return summarizeDisputeFlow(input);
}


// Define the prompt for the AI model
const summarizeDisputePrompt = ai.definePrompt({
    name: 'summarizeDisputePrompt',
    input: { schema: SummarizeDisputeInputSchema },
    output: { schema: DisputeSummarySchema },
    system: `You are a "Dispute Resolution Analyst" for a local marketplace platform. Your task is to analyze a new payment dispute and provide a structured summary for the platform administrator.

    **Your Steps:**
    1.  **Summarize the Issue:** Read the raw 'disputeReason' from Stripe and the 'productName'. Translate this into a simple, human-readable 'summary'. For example, if the reason is 'product_not_received', the summary should be "Customer claims they did not receive the product."
    2.  **Assess Risk Level:** Based on the reason, determine the 'riskLevel'.
        -   'HIGH': Use for reasons like 'fraudulent'. This indicates a serious issue.
        -   'MEDIUM': Use for reasons like 'credit_not_processed' or 'general'. These are ambiguous.
        -   'LOW': Use for reasons like 'product_not_received' or 'product_unacceptable'. These are common operational issues.
    3.  **Recommend Action:** Provide a clear and concise 'recommendedAction' for the platform administrator or vendor.
        -   If 'product_not_received', recommend: "Advise vendor to submit shipping proof or tracking information to Stripe."
        -   If 'product_unacceptable', recommend: "Advise vendor to submit photos of the product and communication logs with the customer."
        -   If 'fraudulent', recommend: "Monitor vendor account for further fraudulent activity. Advise vendor to provide all transaction details to Stripe."
        -   For other reasons, provide a sensible default like "Advise vendor to review the dispute in their Stripe dashboard and respond immediately."

    **Final Output:**
    Populate all fields in the JSON output with your analysis.`,
    prompt: `Analyze the following dispute:
    - Product Name: {{{productName}}}
    - Disputed Amount: {{{amount}}}
    - Stripe Reason: "{{{disputeReason}}}"`,
});


// Define the Genkit flow
const summarizeDisputeFlow = ai.defineFlow(
    {
        name: 'summarizeDisputeFlow',
        inputSchema: SummarizeDisputeInputSchema,
        outputSchema: DisputeSummarySchema,
    },
    async (input) => {
        const { output } = await summarizeDisputePrompt(input);
        
        if (!output) {
            throw new Error("The AI agent failed to return a valid dispute summary.");
        }
        
        return output;
    }
);
