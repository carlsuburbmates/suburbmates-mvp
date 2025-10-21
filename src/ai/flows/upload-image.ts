'use server';
/**
 * @fileOverview A Genkit flow for uploading images to Firebase Storage.
 * 
 * - uploadImage - A function that handles image uploads.
 * - UploadImageInput - The input type for the uploadImage function.
 * - UploadImageOutput - The return type for the uploadImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as mime from 'mime-types';

// Ensures Firebase Admin is initialized
import 'firebase-admin/app';


const UploadImageInputSchema = z.object({
    fileDataUri: z.string().describe("The image file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    filePath: z.string().describe("The desired path and filename in Firebase Storage (e.g., 'listings/image.png')."),
});
export type UploadImageInput = z.infer<typeof UploadImageInputSchema>;

const UploadImageOutputSchema = z.object({
    publicUrl: z.string().describe('The public URL of the uploaded image.'),
});
export type UploadImageOutput = z.infer<typeof UploadImageOutputSchema>;

export async function uploadImage(input: UploadImageInput): Promise<UploadImageOutput> {
    return uploadImageFlow(input);
}

const uploadImageFlow = ai.defineFlow(
    {
        name: 'uploadImageFlow',
        inputSchema: UploadImageInputSchema,
        outputSchema: UploadImageOutputSchema,
    },
    async (input) => {
        const { fileDataUri, filePath } = input;
        
        const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
        
        // Extract content type and data from data URI
        const matches = fileDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid data URI format.');
        }
        const contentType = matches[1];
        const base64Data = matches[2];

        const buffer = Buffer.from(base64Data, 'base64');
        const file = bucket.file(filePath);

        await file.save(buffer, {
            metadata: {
                contentType,
            },
            public: true, // Make the file publicly accessible
        });

        // The public URL format is: https://storage.googleapis.com/[BUCKET_NAME]/[FILE_PATH]
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        return { publicUrl };
    }
);
