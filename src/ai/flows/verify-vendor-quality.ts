'use server';
/**
 * @fileOverview An advanced AI agent that verifies the quality and safety of a new vendor registration.
 *
 * - verifyVendorQuality - A function that runs a comprehensive analysis on a vendor's details.
 * - VerifyVendorQualityInput - The input type for the function.
 * - VerifyVendorQualityOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PROMPT_VERSION = '1.0';
const VENDOR_CATEGORIES = ["gardening", "cafe", "plumbing", "retail", "bakery", "services"];

// Input schema for the flow
export const VerifyVendorQualityInputSchema = z.object({
    businessName: z.string(),
    description: z.string(),
    category: z.string(),
});
export type VerifyVendorQualityInput = z.infer<typeof VerifyVendorQualityInputSchema>;

// Define the structured output the AI must produce
export const VerificationSummarySchema = z.object({
    overallRecommendation: z.enum(['AUTO_APPROVE', 'NEEDS_REVIEW', 'AUTO_REJECT'])
        .describe('The final recommendation based on all checks.'),
    recommendationReason: z.string()
        .describe('A brief, clear reason for the overall recommendation.'),
    safetyAnalysis: z.object({
        rating: z.enum(['SAFE', 'NEEDS_REVIEW'])
            .describe('Safety rating of the content.'),
        reason: z.string()
            .describe('Reasoning for the safety rating.'),
        piiDetected: z.boolean()
            .describe('True if Personally Identifiable Information (PII) like private phone numbers or emails were detected in the description.'),
    }).describe('Analysis of content safety and PII.'),
    descriptionQuality: z.object({
        score: z.number().min(1).max(10)
            .describe('A score from 1-10 on the quality and professionalism of the business description.'),
        confidence: z.number().min(0).max(100)
            .describe('The AI\'s confidence in the quality score (0-100).'),
        reason: z.string()
            .describe('Reasoning for the quality score.'),
    }).describe('Analysis of the business description\'s quality.'),
    categoryVerification: z.object({
        isMatch: z.boolean()
            .describe('True if the user-selected category matches the business description.'),
        confidence: z.number().min(0).max(100)
            .describe('The AI\'s confidence in the category match assessment (0-100).'),
        suggestion: z.string()
            .describe('The most appropriate category from the provided list.'),
        reason: z.string()
            .describe('Reasoning for the category assessment and suggestion.'),
    }).describe('Analysis of the business category.'),
    promptVersion: z.string().describe('The version of the prompt used for this analysis.'),
});
export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;


// The main exported function that wraps the Genkit flow
export async function verifyVendorQuality(input: VerifyVendorQualityInput): Promise<VerificationSummary> {
    return verifyVendorQualityFlow(input);
}


// Define the prompt for the AI model
const verificationPrompt = ai.definePrompt({
    name: 'verifyVendorQualityPrompt',
    input: { schema: VerifyVendorQualityInputSchema },
    output: { schema: VerificationSummarySchema },
    system: `You are an advanced "Trust & Quality" agent for a local business directory. Your task is to analyze a new business registration and provide a structured verification summary.

    **Business Context:**
    - The platform is for local community businesses.
    - Accepted Categories: ${VENDOR_CATEGORIES.join(', ')}.

    **Your Steps:**
    1.  **Safety Analysis:**
        - Review the business description for any inappropriate content (hate speech, spam, harassment, illegal services).
        - Detect if any Personally Identifiable Information (PII) like private email addresses or phone numbers are in the description. Public business contact info is acceptable, but flag anything that looks like personal contact details.
        - Set 'rating' to 'NEEDS_REVIEW' if any safety or PII issues are found. Otherwise, 'SAFE'.
    2.  **Description Quality Analysis:**
        - Evaluate the business description based on clarity, professionalism, grammar, and completeness.
        - Assign a 'score' from 1 (very poor) to 10 (excellent). A simple "We sell cakes" is low quality. A description with details about ingredients, style, and what makes the business unique is high quality.
        - Provide your 'confidence' in this score.
    3.  **Category Verification Analysis:**
        - Read the description and determine the most fitting category from the provided list: [${VENDOR_CATEGORIES.join(', ')}]. This is your 'suggestion'.
        - Compare your suggestion to the user's chosen 'category'. Set 'isMatch' to true or false.
        - Provide your 'confidence' in this assessment.
    4.  **Overall Recommendation:**
        - Set 'overallRecommendation' to 'AUTO_REJECT' if the content is clearly unsafe or violates platform rules (e.g., selling illegal items).
        - Set 'overallRecommendation' to 'NEEDS_REVIEW' if:
            - safetyAnalysis.rating is 'NEEDS_REVIEW'.
            - descriptionQuality.score is 4 or less.
            - categoryVerification.isMatch is false and confidence is above 60.
        - Otherwise, set 'overallRecommendation' to 'AUTO_APPROVE'.
    5.  **Final Output:**
        - Set 'promptVersion' to '${PROMPT_VERSION}'.
        - Populate all fields in the JSON output with your analysis and reasoning. Your reasoning should be concise and clear.`,
    prompt: `Analyze the following business registration:
    - Business Name: {{{businessName}}}
    - User-Selected Category: {{{category}}}
    - Description: "{{{description}}}"`,
});


// Define the Genkit flow
const verifyVendorQualityFlow = ai.defineFlow(
    {
        name: 'verifyVendorQualityFlow',
        inputSchema: VerifyVendorQualityInputSchema,
        outputSchema: VerificationSummarySchema,
        // Optional: Add retry and backoff for production robustness
        // backoff: {
        //   initial: 1000,
        //   max: 60000,
        //   multiplier: 2,
        // },
        // retry: 3,
    },
    async (input) => {
        const { output } = await verificationPrompt(input);
        
        // This should not happen if the model follows instructions, but it's a good safeguard.
        if (!output) {
            throw new Error("The AI agent failed to return a valid verification summary.");
        }
        
        return output;
    }
);
