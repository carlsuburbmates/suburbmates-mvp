'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-events.ts';
import '@/ai/flows/summarize-discussions.ts';
import '@/ai/flows/validate-abn.ts';
import '@/ai/flows/upload-image.ts';
import '@/ai/tests/test-abn-validation.ts';
