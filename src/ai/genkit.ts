import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({
    apiKey: '828556004852d02d939e7bc560f3ad14bafae57b'
  })],
  model: 'googleai/gemini-2.5-flash',
});
