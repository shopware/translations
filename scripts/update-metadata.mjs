#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';

const CROWDIN_PROJECT_ID = process.env.CROWDIN_PROJECT_ID;
const CROWDIN_PERSONAL_TOKEN = process.env.CROWDIN_PERSONAL_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const metadataFile = path.join(rootDir, 'crowdin-metadata.json');

const headers = {
    'Authorization': `Bearer ${CROWDIN_PERSONAL_TOKEN}`,
    'Content-Type': 'application/json'
};

const url = `https://api.crowdin.com/api/v2/projects/${CROWDIN_PROJECT_ID}/languages/progress?limit=500`;

const changedFiles = process.argv.slice(2);

async function run() {
    let diffData = await getDiffPayload(changedFiles);
    const existingData = getExistingMetadata();

    const mergedData = mergeData(existingData, diffData);

    const jsonData = JSON.stringify(mergedData, null, 2);

    fs.writeFileSync(metadataFile, jsonData + '\n', 'utf8');
}

async function getDiffPayload(changedFiles) {
    const payload = [];
    if (changedFiles.length === 0) return payload;

    const processedLocales = new Set();
    const crowdinData = await fetchCrowdinData();

    for (const file of changedFiles) {
        if (!file.startsWith('translations/')) continue;

        const pathParts = file.split('/');
        if (pathParts.length < 2) continue;

        const locale = pathParts[1];

        if (processedLocales.has(locale)) continue;
        processedLocales.add(locale);

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

function getExistingMetadata() {
    try {
        const data = fs.readFileSync(metadataFile, 'utf8');

        return JSON.parse(data);
    } catch (error) {
        console.error('Error while reading file: ', error);

        return [];
    }
}

async function fetchCrowdinData() {
    const response = await fetch(url, { headers });

    if (!response.ok) {
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

function mergeData(existingData, payload) {
    const mergedData = [...existingData];

    for (const newItem of payload) {
        const existingIndex = mergedData.findIndex(item => item.locale === newItem.locale);

        if (existingIndex !== -1) {
            mergedData[existingIndex] = { ...mergedData[existingIndex], ...newItem };
        } else {
            mergedData.push(newItem);
        }
    }

    return mergedData;
}

await run();
