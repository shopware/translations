import fs from "node:fs";
import path from "node:path";

const source_language_locale = "en-GB"
const target_language_locale = "en-US"

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
    const source_files = findJsonFiles(`translations/${source_language_locale}`);

    for (const file of source_files) {
        const source = JSON.parse(fs.readFileSync(file, "utf-8"));
        const target_file_name = file.replace(source_language_locale, target_language_locale);
        const target_file_path = path.dirname(target_file_name)
        if (!fs.existsSync(target_file_name)) {
            fs.mkdirSync(target_file_path, { recursive: true })
            fs.copyFileSync(file, target_file_name);
            continue;
        }

        const target = JSON.parse(fs.readFileSync(target_file_name, "utf-8"));

        const merged = deepMerge(source, target);

        fs.writeFileSync(target_file_name, JSON.stringify(merged, null, 4));
    }
}
