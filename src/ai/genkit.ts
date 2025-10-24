'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {vertexAI} from '@genkit-ai/vertexai';

// Initialize the googleAI plugin with Vertex AI for production-grade performance.
// This uses the service account for authentication instead of a hardcoded API key.
export const ai = genkit({
  plugins: [vertexAI(), googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
