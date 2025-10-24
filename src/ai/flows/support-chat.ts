
'use server';
/**
 * @fileOverview A RAG-powered AI chatbot to answer user questions based on platform documentation.
 *
 * - supportChat - The main flow that takes a user query and returns a grounded answer.
 */
import { ai } from '@/ai/genkit';
import { defineIndexer, DirectorySourceReader, find, index } from 'genkit/indexing';
import { z } from 'zod';
import { geminiPro, googleAI } from '@genkit-ai/google-genai';

// Define the knowledge base by pointing to the documentation files
const knowledgeBase = defineIndexer(
  {
    name: 'suburbmates-docs',
    indexPath: '.genkit/indexes/suburbmates-docs',
  },
  async (configure) => {
    // We are using a simplified text-based reader for .tsx files.
    // In a production scenario, you might want a more sophisticated parser
    // to extract only the relevant text content.
    const docReader = new DirectorySourceReader({
      path: './docs',
      glob: '**/*.md', // Read all markdown files in the docs directory
    });
    const contentReader = new DirectorySourceReader({
      path: './src/app',
      glob: '**/@(policy|terms|privacy|accessibility)/page.tsx', // Read key policy pages
    });
    
    // We pass custom chunking options to break the documents into smaller, more digestible pieces for the model.
    configure({
      sources: [docReader, contentReader],
      chunking: {
        // A chunk is a piece of a document that is embedded and stored in the index.
        // The size of a chunk is important for the quality of the search results.
        // We set the size to 512 characters with an overlap of 128 characters.
        size: 512,
        overlap: 128,
      },
    });
  }
);


// Index the documents. This is a one-time operation that should be run when the documents change.
// Genkit's dev UI provides a way to manually trigger this indexing.
index({ indexer: knowledgeBase });

// Define the prompt that will be used to generate the answer.
const supportPrompt = ai.definePrompt(
  {
    name: 'support-chat-prompt',
    input: {
      schema: z.object({
        query: z.string(),
        context: z.string(),
      }),
    },
    system: `You are the "Suburbmates Support Assistant," a friendly and helpful AI chatbot for a local community platform. Your goal is to answer user questions accurately based on the provided context.

      **Instructions:**
      1.  Analyze the user's "Query" and the "Context" provided.
      2.  Formulate a concise and clear answer to the query using **only** the information from the "Context".
      3.  Do not make up information, policies, or features that are not explicitly mentioned in the context.
      4.  If the context does not contain the information needed to answer the query, you MUST respond with: "I'm sorry, I don't have information on that topic. You can try rephrasing your question or browse our documentation."
      5.  Keep your answers brief and to the point.
      6.  Always be polite and helpful in your tone.`,
    prompt: `
        **Query:**
        {{{query}}}
        
        ---
        
        **Context:**
        {{{context}}}
      `,
  }
);


export const supportChat = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ response: z.string() }),
  },
  async (input) => {

    // 1. Retrieve relevant documents from our knowledge base.
    const searchResults = await find(knowledgeBase, input.query, {
      k: 3, // Retrieve the top 3 most relevant chunks
    });

    const context = searchResults
        .map((r) => r.content[0]?.text || '')
        .join('\n\n');

    // 2. Generate the answer using the retrieved context.
    const llmResponse = await supportPrompt({
      query: input.query,
      context,
    });
    
    return { response: llmResponse.text };
  }
);
