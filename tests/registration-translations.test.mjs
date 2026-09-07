import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTranslations, parameters, substitute, validate } from '../scripts/validate-registration-translations.mjs';

const brokenItalian = 'Selezionando continua confermi di aver letto la nostra informativa sulla protezione dei dati %pPrivacyModalTagOpen%d%privacyModalTagClose% e di aver accettato i nostri termini e condizioni generali %toSmodalTagOpen%g%tosModalTagClose%.';
const italian = 'Selezionando continua confermi di aver letto la nostra %privacyModalTagOpen%informativa sulla protezione dei dati%privacyModalTagClose% e di aver accettato i nostri %tosModalTagOpen%termini e condizioni generali%tosModalTagClose%.';
const english = 'I have acknowledged the %privacyModalTagOpen%privacy policy%privacyModalTagClose% and have read and agree to the %tosModalTagOpen%general terms and conditions%tosModalTagClose%.';

test('reproduces the exact broken Italian substitution', () => {
    assert.equal(substitute(brokenItalian), 'Selezionando continua confermi di aver letto la nostra informativa sulla protezione dei dati %pPrivacyModalTagOpen%d</button> e di aver accettato i nostri termini e condizioni generali %toSmodalTagOpen%g</button>.');
    assert.ok(validate(brokenItalian).includes('Unsubstituted placeholder'));
});

test('renaming the Italian tokens alone leaves invalid d/g labels', () => {
    const renamed = brokenItalian.replace('%pPrivacyModalTagOpen%', '%privacyModalTagOpen%').replace('%toSmodalTagOpen%', '%tosModalTagOpen%');
    assert.ok(validate(renamed).includes('Empty or single-letter artifact button label'));
});

test('fixed Italian renders the complete translated labels', () => {
    assert.deepEqual(validate(italian), []);
    assert.equal(substitute(italian), `Selezionando continua confermi di aver letto la nostra ${parameters['%privacyModalTagOpen%']}informativa sulla protezione dei dati</button> e di aver accettato i nostri ${parameters['%tosModalTagOpen%']}termini e condizioni generali</button>.`);
});

test('valid controls preserve Unicode and allow either language-specific link order', () => {
    for (const message of [english,
        'Ich habe die %privacyModalTagOpen%Datenschutzbestimmungen%privacyModalTagClose% und die %tosModalTagOpen%AGB%tosModalTagClose% gelesen.',
        '%tosModalTagOpen%conditions générales%tosModalTagClose% / %privacyModalTagOpen%protection des données%privacyModalTagClose%',
    ]) assert.deepEqual(validate(message), []);
});

test('rejects missing, misspelled, duplicate, crossed, reversed and nested tags', () => {
    for (const message of [
        undefined,
        english.replace('%privacyModalTagOpen%', ''),
        english.replace('%privacyModalTagOpen%', '%PrivacyModalTagOpen%'),
        english + '%tosModalTagClose%',
        english + '</button>',
        english.replace('%privacyModalTagClose%', '%TEMP%').replace('%tosModalTagClose%', '%privacyModalTagClose%').replace('%TEMP%', '%tosModalTagClose%'),
        '%privacyModalTagClose%privacy%privacyModalTagOpen% %tosModalTagOpen%terms%tosModalTagClose%',
        '%privacyModalTagOpen%privacy %tosModalTagOpen%terms%tosModalTagClose%%privacyModalTagClose%',
    ]) assert.ok(validate(message).length, message);
});

test('rejects empty, whitespace-only and markup-only labels', () => {
    for (const label of ['', '  ', '&nbsp;', '\u200B', '<span></span>']) {
        assert.ok(validate(english.replace('privacy policy', label)).length, JSON.stringify(label));
    }
});

test('all real storefront locales satisfy the registration contract', () => {
    const { checked, failures } = checkTranslations();
    assert.ok(checked > 0);
    assert.deepEqual(failures, []);
});
