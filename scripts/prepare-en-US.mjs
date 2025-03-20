import fs from "node:fs";
import path from "node:path";

const languageMapping = {
    'en-GB': ['en-US']
};

function deepMerge(source, target) {
    for (const [key, value] of Object.entries(source)) {
        if (typeof value === "object" && typeof target[key] === "object") {
            target[key] = deepMerge(value, target[key]);
        } else if (target[key] === undefined || typeof target[key] !== typeof value) {
            target[key] = value;
        }
    }

    return target;
}

function findJsonFiles(directory) {
    let result = [];
    const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        if (file.isDirectory()) {
            result = result.concat(findJsonFiles(fullPath));
        } else if (file.isFile() && file.name.endsWith(".json")) {
            result.push(fullPath);
        }
    }

    return result;
}

export const main = async () => {
    for (const [sourceLanguage, targets] of Object.entries(languageMapping)) {
        const sourceFiles = findJsonFiles(`translations/${sourceLanguage}`);

        for (const sourceFile of sourceFiles) {
            const source = JSON.parse(fs.readFileSync(sourceFile, "utf-8"));
            for (const targetLanguage of targets) {
                const targetFileName = sourceFile.replace(sourceLanguage, targetLanguage);
                const targetFilePath = path.dirname(targetFileName);
                if (!fs.existsSync(targetFileName)) {
                    fs.mkdirSync(targetFilePath, { recursive: true });
                    fs.copyFileSync(sourceFile, targetFileName);
                    continue;
                }

                const target = JSON.parse(fs.readFileSync(targetFileName, "utf-8"));
                const merged = deepMerge(source, target);
                fs.writeFileSync(targetFileName, JSON.stringify(merged, null, 4));
            }
        }
    }
}
