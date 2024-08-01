# Shopware 6 Translations

Contains all translation files, automatically extracted from [crowdin](https://translate.shopware.com/) for [Shopware 6](https://github.com/shopware/shopware).

## Schedule

The translations are updated automatically via a defined schedule containing multiple workflows. The schedule is defined as follows:
| Workflow                                     | Frequency              |
|:---------------------------------------------|:-----------------------|
| Collect translations and push new snippets   | Every day at 18:00 CET |
| Upload files to Crowdin                      | Every day at 20:00 CET |
| Download translations from Crowdin           | Every day at 22:00 CET |
| Pull supported languages to SwagLanguagePack | Every day at 00:00 CET |

## Crowdin-generated pull requests

As shown above, every day at 22:00 CET, the translations are downloaded from Crowdin and pushed to this repository. This is done by a GitHub action, which creates a pull request with the changes. The pull request is then reviewed and merged by a maintainer.

Important things to know, when reviewing the pull request:
- Inspect snippets containing HTML. Crowdin tends to pull content of an HTML block out of the block, which can lead to a broken state in the software. Especially right-to-left languages like arabic tend to have this issue.
- Inspect `de-DE` and `en-GB` changes. Since those are the base of the crowdin translations, normally some action is required if those languages appear in the merge request. You have to check crowdin and accept the correct snippet suggest for that key, since it will probably mean that a snippet was changed but not approved, which has to be done manually.

With those two steps in mind, it's okay for maintainers to merge the pull request without a review by others.
