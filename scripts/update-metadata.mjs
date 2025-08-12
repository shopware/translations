#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';

const CROWDIN_PROJECT_ID = process.env.CROWDIN_PROJECT_ID;
const CROWDIN_PERSONAL_TOKEN = process.env.CROWDIN_PERSONAL_TOKEN;

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const rootDir = path.resolve(dirname, '..');
const metadataFile = path.join(rootDir, 'crowdin-metadata.json');

const headers = {
    'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}`,
    'Content-Type': 'application/json'
};

const url = `https://api.crowdin.com/api/v2/projects/${CROWDIN_PROJECT_ID}/languages/progress?limit=500`;

// All changed files passed in as CLI arguments (after index 2 because index 0 is node and index 1 is the script name)
const changedFiles = process.argv.slice(2);

async function run() {
    // Build a payload containing updates for locales that had changes
    let diffData = await getDiffPayload(changedFiles);
    // Read the current metadata from the file
    const existingData = getExistingMetadata();

    // Merge existing metadata with the new diff data
    const mergedData = mergeData(existingData, diffData);

    // Save updated metadata back to the file
    const jsonData = JSON.stringify(mergedData, null, 2);
    fs.writeFileSync(metadataFile, jsonData + '\n', 'utf8');
}

// Build an update payload for locales affected by changed files including their locale, last updatedAt and the percentage of translation progress
async function getDiffPayload(changedFiles) {
    const payload = [];
    if (changedFiles.length === 0) return payload;

    const processedLocales = new Set();
    const crowdinData = await fetchCrowdinData();

    for (const file of changedFiles) {
        // Only process files inside the translations/ directory
        if (!file.startsWith('translations/')) continue;

        const pathParts = file.split('/');
        if (pathParts.length < 2) continue;

        const locale = pathParts[1];

        // Skip if locale already handled in this run
        if (processedLocales.has(locale)) continue;
        processedLocales.add(locale);

        // If we have Crowdin data for this locale, add it to the payload
        if (crowdinData[locale]) {
            payload.push({
                locale: locale,
                updatedAt: new Date().toISOString(),
                progress: crowdinData[locale].progress,
            });
        }
    }

    return payload;
}

// Read and parse the existing metadata file
function getExistingMetadata() {
    try {
        const data = fs.readFileSync(metadataFile, 'utf8');

        return JSON.parse(data);
    } catch (error) {
        console.error('Error while reading file: ', error);

        return [];
    }
}

// Fetch current translation progress for all locales from Crowdin API
async function fetchCrowdinData() {
    const response = await fetch(url, { headers });

    if (!response.ok) {
        console.error(response);
        throw new Error(`Crowdin API error: ${response.status}`);
    }

    const fetched = await response.json();

    let result = {};

    for (const item of fetched.data) {
        const data = item.data;
        const locale = data.language.locale;

        result[locale] = {
            progress: data.translationProgress,
            locale: locale,
        };
    }

    return result;
}

// Merge existing metadata with new payload data
function mergeData(existingData, payload) {
    const mergedData = [...existingData];

    for (const newItem of payload) {
        // Look for an existing entry for the same locale
        const existingIndex = mergedData.findIndex(item => item.locale === newItem.locale);

        if (existingIndex !== -1) {
            // Update existing entry with new data
            mergedData[existingIndex] = { ...mergedData[existingIndex], ...newItem };
        } else {
            // Add new locale entry
            mergedData.push(newItem);
        }
    }

    return mergedData;
}

// Execute the script
await run();
