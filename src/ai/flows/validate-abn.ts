'use server';
/**
 * @fileOverview An AI agent that validates an Australian Business Number (ABN).
 *
 * - validateAbn - A function that validates an ABN and checks the business name.
 * - ValidateAbnInput - The input type for the validateAbn function.
 * - ValidateAbnOutput - The return type for the validateAbn function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ValidateAbnInputSchema = z.object({
  abn: z.string().describe('The ABN to validate.'),
  businessName: z.string().describe('The business name to verify against the ABN.'),
});
export type ValidateAbnInput = z.infer<typeof ValidateAbnInputSchema>;

const ValidateAbnOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the ABN is valid and the business name matches.'),
  message: z.string().describe('A message indicating the result of the validation.'),
});
export type ValidateAbnOutput = z.infer<typeof ValidateAbnOutputSchema>;

// Live ABN Lookup Tool
const abnLookupTool = ai.defineTool(
  {
    name: 'abnLookup',
    description: 'Looks up an Australian Business Number (ABN) and returns the associated business name.',
    inputSchema: z.object({
      abn: z.string(),
    }),
    outputSchema: z.object({
      isValid: z.boolean(),
      businessName: z.string().optional(),
    }),
  },
  async (input) => {
    console.log(`[ABN LIVE] Looking up ABN: ${input.abn}`);
    const guid = process.env.ABR_GUID;
    if (!guid || guid === 'YOUR_GUID_HERE') {
      console.error("ABR GUID not configured in .env file.");
      return { isValid: false };
    }

    // ABN needs to be stripped of spaces for the API call
    const abn = input.abn.replace(/\s/g, '');
    const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${abn}&guid=${guid}`;
    
    try {
      const response = await fetch(url, { method: 'GET' });
      // The ABR API wraps its JSON in parentheses, which need to be removed.
      const rawText = await response.text();
      const jsonText = rawText.replace(/^callback\(|\)$/g, '');
      const data = JSON.parse(jsonText);

      if (data.ErrorMessage) {
        console.warn(`[ABN LIVE] ABR API Error: ${data.ErrorMessage}`);
        return { isValid: false };
      }
      
      // We look for the main business name. Other names might exist.
      const mainName = data.BusinessName?.find((n: any) => n.IsCurrent);

      if (mainName && mainName.Name) {
        return { isValid: true, businessName: mainName.Name };
      }

      return { isValid: false };
    } catch (error) {
      console.error('[ABN LIVE] Fetch or Parse Error:', error);
      return { isValid: false };
    }
  }
);


export async function validateAbn(input: ValidateAbnInput): Promise<ValidateAbnOutput> {
  return validateAbnFlow(input);
}


const prompt = ai.definePrompt({
    name: 'validateAbnPrompt',
    input: { schema: ValidateAbnInputSchema },
    output: { schema: ValidateAbnOutputSchema },
    system: `You are an ABN validation agent. Your task is to use the provided tool to check if an ABN is valid and if the provided business name matches the registered name.

    1. Use the 'abnLookup' tool with the provided ABN.
    2. If the tool returns 'isValid: false', then the ABN is invalid. Respond with 'isValid: false' and an appropriate message.
    3. If the tool returns 'isValid: true', compare the 'businessName' returned by the tool with the 'businessName' from the user's input.
    4. If the names match (case-insensitive), respond with 'isValid: true' and a success message.
    5. If the names do not match, respond with 'isValid: false' and a message explaining the mismatch.`,
    prompt: `Validate this ABN: {{{abn}}} for this business: {{{businessName}}}`,
    tools: [abnLookupTool],
});


const validateAbnFlow = ai.defineFlow(
  {
    name: 'validateAbnFlow',
    inputSchema: ValidateAbnInputSchema,
    outputSchema: ValidateAbnOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
