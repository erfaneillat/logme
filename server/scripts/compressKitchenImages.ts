/**
 * Script to compress existing kitchen images from PNG to optimized WebP
 * Run with: npx ts-node scripts/compressKitchenImages.ts
 */

import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import the model
import KitchenCategory from '../src/models/KitchenCategory';

const UPLOADS_DIR = path.join(__dirname, '../uploads/kitchen');

async function compressImage(inputPath: string, outputPath: string): Promise<{ originalSize: number; compressedSize: number }> {
    const inputBuffer = await fs.promises.readFile(inputPath);

    const compressedBuffer = await sharp(inputBuffer)
        .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

    await fs.promises.writeFile(outputPath, compressedBuffer);

    return {
        originalSize: inputBuffer.length,
        compressedSize: compressedBuffer.length
    };
}

async function main() {
    console.log('🚀 Starting kitchen image compression script...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cal_ai';
    console.log(`📦 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all categories
    const categories = await KitchenCategory.find();
    console.log(`📁 Found ${categories.length} categories\n`);

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let imagesProcessed = 0;
    let imagesSkipped = 0;
    let errors = 0;

    for (const category of categories) {
        console.log(`\n📂 Processing category: ${category.title}`);
        let categoryUpdated = false;

        for (const subcategory of category.subCategories) {
            for (let i = 0; i < subcategory.items.length; i++) {
                const item = subcategory.items[i];
                if (!item || !item.image) continue;

                // Check if it's a PNG image URL
                if (!item.image.includes('/api/kitchen/images/') || !item.image.endsWith('.png')) {
                    continue;
                }

                // Extract filename
                const filename = item.image.split('/').pop();
                if (!filename) continue;

                const inputPath = path.join(UPLOADS_DIR, filename);
                const outputFilename = filename.replace('.png', '.webp');
                const outputPath = path.join(UPLOADS_DIR, outputFilename);

                // Check if source file exists
                if (!fs.existsSync(inputPath)) {
                    console.log(`  ⚠️  File not found: ${filename}`);
                    imagesSkipped++;
                    continue;
                }

                // Check if already converted
                if (fs.existsSync(outputPath)) {
                    console.log(`  ⏭️  Already converted: ${filename}`);
                    // Update URL anyway if still pointing to PNG
                    const newUrl = item.image.replace('.png', '.webp');
                    subcategory.items[i]!.image = newUrl;
                    categoryUpdated = true;
                    imagesSkipped++;
                    continue;
                }

                try {
                    // Compress the image
                    const { originalSize, compressedSize } = await compressImage(inputPath, outputPath);
                    totalOriginalSize += originalSize;
                    totalCompressedSize += compressedSize;

                    // Update the URL in database
                    const newUrl = item.image.replace('.png', '.webp');
                    subcategory.items[i]!.image = newUrl;
                    categoryUpdated = true;

                    // Delete the old PNG file
                    await fs.promises.unlink(inputPath);

                    const origKB = (originalSize / 1024).toFixed(1);
                    const compKB = (compressedSize / 1024).toFixed(1);
                    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(0);
                    console.log(`  ✅ ${item.name}: ${origKB}KB → ${compKB}KB (${savings}% smaller)`);
                    imagesProcessed++;
                } catch (error) {
                    console.log(`  ❌ Error processing ${item.name}:`, error);
                    errors++;
                }
            }
        }

        // Save category if updated
        if (categoryUpdated) {
            await category.save();
            console.log(`  💾 Saved category: ${category.title}`);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 COMPRESSION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Images processed: ${imagesProcessed}`);
    console.log(`⏭️  Images skipped: ${imagesSkipped}`);
    console.log(`❌ Errors: ${errors}`);

    if (imagesProcessed > 0) {
        const totalOrigMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
        const totalCompMB = (totalCompressedSize / 1024 / 1024).toFixed(2);
        const totalSavings = ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(0);
        console.log(`\n📉 Total size: ${totalOrigMB}MB → ${totalCompMB}MB`);
        console.log(`💰 Space saved: ${totalSavings}%`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Done! Database disconnected.');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
