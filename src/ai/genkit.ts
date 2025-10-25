'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize the googleAI plugin.
// This configuration uses the googleAI plugin, which is sufficient for accessing Gemini models
// and avoids the initialization conflicts caused by including the vertexAI plugin alongside it
// in this application's setup.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
