#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// storefront/component/privacy-notice.html.twig in Shopware v6.7.13.1.
export const parameters = {
    '%privacyModalTagOpen%': '<button type="button" class="btn btn-link-inline" aria-haspopup="dialog" data-ajax-modal="true" data-url="/privacy">',
    '%privacyModalTagClose%': '</button>',
    '%tosModalTagOpen%': '<button type="button" class="btn btn-link-inline" aria-haspopup="dialog" data-ajax-modal="true" data-url="/terms">',
    '%tosModalTagClose%': '</button>',
};

export function substitute(message) {
    // Symfony MessageFormatter uses case-sensitive strtr for these non-plural
    // messages. Replace only the supplied keys, once, without repairing typos.
    return message.replace(/%privacyModalTagOpen%|%privacyModalTagClose%|%tosModalTagOpen%|%tosModalTagClose%/g,
        token => parameters[token]);
}

export function validate(message) {
    if (typeof message !== 'string') {
        return ['Missing general.privacyNoticeTextModal'];
    }

    const errors = [];
    for (const token of Object.keys(parameters)) {
        if (message.split(token).length - 1 !== 1) {
            errors.push(`Expected exactly one ${token}`);
        }
    }

    // Check identities before substitution: both closing tags render identically.
    let opened = null;
    for (const [, kind, action] of message.matchAll(/%(privacy|tos)ModalTag(Open|Close)%/g)) {
        if (action === 'Open') {
            if (opened !== null) errors.push('Nested modal tags');
            opened = kind;
        } else {
            if (opened !== kind) errors.push(`Unpaired ${kind} closing tag`);
            opened = null;
        }
    }
    if (opened !== null) errors.push(`Unclosed ${opened} tag`);

    const rendered = substitute(message);
    if (rendered.includes('%')) errors.push('Unsubstituted placeholder');
    if ((rendered.match(/<button\b/g) ?? []).length !== 2 || (rendered.match(/<\/button>/g) ?? []).length !== 2) {
        errors.push('Expected exactly two opening and closing button tags');
    }
    const buttons = [...rendered.matchAll(/<button\b[^>]*>([^<>]*)<\/button>/g)];
    if (buttons.length !== 2) errors.push('Expected two complete modal buttons with text labels');
    for (const [, label] of buttons) {
        // Also reject invisible/non-breaking whitespace and the d/g artifacts
        // from the broken translations. A general minimum length would exclude
        // legitimate short labels in some writing systems.
        const visible = label.replace(/&(?:nbsp|#160|#xA0);/gi, ' ').replace(/[\p{Z}\p{C}]/gu, '').trim();
        if (!visible || /^[dg]$/i.test(visible)) errors.push('Empty or single-letter artifact button label');
    }
    return errors;
}

export function checkTranslations(directory = path.join(root, 'translations')) {
    const failures = [];
    let checked = 0;
    for (const locale of fs.readdirSync(directory).sort()) {
        // Acholi is Crowdin's pseudo-locale (see update-metadata.mjs).
        if (locale === 'ach-UG') continue;
        const file = path.join(directory, locale, 'Platform/Storefront/storefront.json');
        // Some locales currently contain plugin translations only.
        if (!fs.existsSync(file)) continue;
        const message = JSON.parse(fs.readFileSync(file, 'utf8')).general?.privacyNoticeTextModal;
        const errors = validate(message);
        checked++;
        if (errors.length) failures.push({ locale, errors });
    }
    if (checked === 0) throw new Error('No storefront translations found');
    return { checked, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const { checked, failures } = checkTranslations();
    for (const { locale, errors } of failures) console.error(`${locale}: ${errors.join('; ')}`);
    console.log(`Registration modal translations: ${checked - failures.length}/${checked} passed (ach-UG excluded).`);
    process.exitCode = failures.length ? 1 : 0;
}
