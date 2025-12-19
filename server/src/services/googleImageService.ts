import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface ImageGenerationResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

export class GoogleImageService {
    private readonly apiKey: string;
    private readonly model: string = 'gemini-3-pro-image-preview';
    private readonly endpoint: string;
    private readonly uploadsDir: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_AI_API_KEY || '';
        this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

        // Use relative path from current directory - works whether in src/ or dist/
        // From src/services or dist/services, going ../../uploads reaches server/uploads
        this.uploadsDir = path.join(__dirname, '../../uploads/kitchen');

        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }

        console.log(`GoogleImageService initialized. Uploads dir: ${this.uploadsDir}`);
    }

    /**
     * Generate an image from a text prompt using Google's Gemini image generation model
     */
    async generateImage(prompt: string, maxRetries: number = 3): Promise<ImageGenerationResult> {
        if (!this.apiKey) {
            return { success: false, error: 'GOOGLE_AI_API_KEY not configured' };
        }

        if (!prompt || prompt.trim().length === 0) {
            return { success: false, error: 'Empty prompt provided' };
        }

        const enhancedPrompt = this.enhancePrompt(prompt);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.post(
                    this.endpoint,
                    {
                        contents: [
                            {
                                parts: [{ text: enhancedPrompt }]
                            }
                        ],
                        generationConfig: {
                            responseModalities: ['TEXT', 'IMAGE']
                        }
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': this.apiKey
                        },
                        timeout: 120000 // 2 minute timeout for image generation
                    }
                );

                // Extract base64 image from response
                const base64Image = this.extractImageFromResponse(response.data);

                if (!base64Image) {
                    // If no image in response, try with different config
                    if (attempt < maxRetries) {
                        console.log(`No image in response (attempt ${attempt}), retrying...`);
                        await this.delay(1000 * attempt); // Exponential backoff
                        continue;
                    }
                    return { success: false, error: 'No image generated in response' };
                }

                // Save image to disk
                const imageUrl = await this.saveImage(base64Image);

                console.log(`Image generated successfully for prompt: "${prompt.substring(0, 50)}..."`);
                return { success: true, imageUrl };

            } catch (error: any) {
                console.error(`Image generation attempt ${attempt} failed:`, error.message);

                // Handle rate limiting
                if (error.response?.status === 429) {
                    const waitTime = Math.min(30000, 2000 * Math.pow(2, attempt));
                    console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
                    await this.delay(waitTime);
                    continue;
                }

                // Handle other retriable errors
                if (attempt < maxRetries && this.isRetriableError(error)) {
                    await this.delay(1000 * attempt);
                    continue;
                }

                return {
                    success: false,
                    error: error.response?.data?.error?.message || error.message || 'Image generation failed'
                };
            }
        }

        return { success: false, error: 'Max retries exceeded' };
    }

    /**
     * Enhance the prompt for better food photography results
     */
    private enhancePrompt(prompt: string): string {
        // Add photography styling hints if not already present
        const hasStyleHints = /professional|photography|studio|lighting|food photo/i.test(prompt);

        if (!hasStyleHints) {
            return `Professional food photography, studio lighting, appetizing presentation: ${prompt}. High quality, detailed, vibrant colors, clean background.`;
        }

        return prompt;
    }

    /**
     * Extract base64 image data from the API response
     */
    private extractImageFromResponse(data: any): string | null {
        try {
            const candidates = data?.candidates;
            if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
                return null;
            }

            for (const candidate of candidates) {
                const parts = candidate?.content?.parts;
                if (!parts || !Array.isArray(parts)) continue;

                for (const part of parts) {
                    if (part?.inlineData?.data && part?.inlineData?.mimeType?.startsWith('image/')) {
                        return part.inlineData.data;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error extracting image from response:', error);
            return null;
        }
    }

    /**
     * Save base64 image to disk with compression and return the URL
     */
    private async saveImage(base64Data: string): Promise<string> {
        const inputBuffer = Buffer.from(base64Data, 'base64');
        const filename = `food-${uuidv4()}.webp`;
        const filepath = path.join(this.uploadsDir, filename);

        // Compress and resize image using sharp
        // - Resize to max 800x800 (good for food thumbnails)
        // - Convert to WebP format (much smaller than PNG)
        // - Use 80% quality (good balance of size vs quality)
        const compressedBuffer = await sharp(inputBuffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer();

        await fs.promises.writeFile(filepath, compressedBuffer);

        const originalSize = (inputBuffer.length / 1024).toFixed(1);
        const compressedSize = (compressedBuffer.length / 1024).toFixed(1);
        console.log(`Image saved to: ${filepath} (${originalSize}KB -> ${compressedSize}KB)`);

        // Return relative URL path - this will be appended to the API base URL
        return `/api/kitchen/images/${filename}`;
    }

    /**
     * Check if an error is retriable
     */
    private isRetriableError(error: any): boolean {
        const status = error.response?.status;
        // Retry on server errors, rate limits, and timeouts
        return status >= 500 || status === 429 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    }

    /**
     * Delay helper for exponential backoff
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const googleImageService = new GoogleImageService();
