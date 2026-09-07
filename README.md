# Shopware 6 Translations

Contains all translation files, automatically extracted from [crowdin](https://translate.shopware.com/) for [Shopware 6](https://github.com/shopware/shopware).

## Schedule

The translations are updated automatically via a defined schedule containing multiple workflows. The schedule is defined as follows:
| Workflow                                                     | Frequency                 |
|:-------------------------------------------------------------|:--------------------------|
| Collect translations and push new snippets                   | Every day at 18:00 CET    |
| Upload files to Crowdin                                      | Every day at 20:00 CET    |
| Download translations from Crowdin                           | Every day at 22:00 CET    |
| Pull supported languages to SwagLanguagePack                 | Every day at 00:00 CET    |
| Release new SwagLanguagePack version, if it contains changes | Every Friday at 08:30 CET |

## Crowdin-generated pull requests

As shown above, every day at 22:00 CET, the translations are downloaded from Crowdin and pushed to this repository. This is done by a GitHub action, which creates a pull request with the changes. The pull request is then reviewed and merged by a maintainer.

Important things to know, when reviewing the pull request:
- Inspect snippets containing HTML. Crowdin tends to pull content of an HTML block out of the block, which can lead to a broken state in the software. Especially right-to-left languages like arabic tend to have this issue.
- Inspect `de-DE` and `en-GB` changes. Since those are the base of the crowdin translations, normally some action is required if those languages appear in the merge request. You have to check crowdin and accept the correct snippet suggest for that key, since it will probably mean that a snippet was changed but not approved, which has to be done manually.

With those two steps in mind, it's okay for maintainers to merge the pull request without a review by others.

## Registration translation checks

Run the focused checks with Node.js 22 or newer (no dependencies to install):

```sh
node --test tests/registration-translations.test.mjs
node scripts/validate-registration-translations.mjs
```

These check `general.privacyNoticeTextModal` in each available Platform Storefront
file, excluding Crowdin's `ach-UG` pseudo-locale. The contract comes from
[Shopware 6.7.13.1's privacy notice component](https://github.com/shopware/shopware/blob/v6.7.13.1/src/Storefront/Resources/views/storefront/component/privacy-notice.html.twig):
`%privacyModalTagOpen%`, `%privacyModalTagClose%`, `%tosModalTagOpen%` and
`%tosModalTagClose%` must each occur exactly once, with matched, non-nested pairs.
Substitution is case-sensitive. Each resulting button must contain text; the
known single-letter `d`/`g` artifacts are rejected as well. Either link order is
allowed. Structural checks cannot establish linguistic correctness: have native
speakers review wording and link boundaries, especially when reusing phrases
from `general.privacyNoticeTextPage`, which may itself contain misplaced links.

The checks run on contribution PRs and in the Crowdin download workflow before
metadata is updated. Running them in the download workflow also covers exports
whose PRs are created with `GITHUB_TOKEN` and do not trigger PR workflows. A failed
export check requires correcting the source translations; it does not repair or
upload strings automatically.

Crowdin owns the translated values of `Platform/Storefront/storefront.json`.
Corrections made here must also be applied and approved for the same key in
[Crowdin](https://translate.shopware.com/) to survive subsequent exports. The
scheduled upload sends sources and en-GB/de-DE/en-US translations, not every
locale. A maintainer can edit the affected strings in Crowdin or use the existing
**Crowdin Upload Single Language** workflow, then review/approve the imported
suggestions. Download again and review both the translations and the regenerated
`crowdin-metadata.json` before merging the export. The valid en-GB source tokens
and their Shopware template contract should not be renamed to match typos.
