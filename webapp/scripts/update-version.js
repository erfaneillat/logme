#!/usr/bin/env node

/**
 * Pre-build script to update version.json with a unique build hash
 * This ensures the webapp can detect when a new version is deployed
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const versionFilePath = path.join(__dirname, '../public/version.json');
const packageJsonPath = path.join(__dirname, '../package.json');

// Read current package.json version
let packageVersion = '1.0.0';
try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageVersion = packageJson.version || '1.0.0';
} catch (error) {
    console.warn('Could not read package.json version, using default');
}

// Generate a unique build hash based on timestamp and random bytes
const timestamp = new Date().toISOString();
const randomBytes = crypto.randomBytes(8).toString('hex');
const buildHash = crypto
    .createHash('sha256')
    .update(`${timestamp}-${randomBytes}`)
    .digest('hex')
    .substring(0, 12);

const versionInfo = {
    version: packageVersion,
    buildTime: timestamp,
    buildHash: buildHash
};

// Write the updated version.json
fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2) + '\n');

console.log(`✅ Updated version.json:`);
console.log(`   Version: ${versionInfo.version}`);
console.log(`   Build Time: ${versionInfo.buildTime}`);
console.log(`   Build Hash: ${versionInfo.buildHash}`);
