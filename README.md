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

## Uploading a branch's translations to Crowdin

Translation fixes that arrive as a pull request against this repository would be overwritten by the next Crowdin download, because Crowdin is the source of truth. Instead of rejecting such a pull request and entering the strings in Crowdin by hand, run the "Crowdin Upload PR Translations" workflow manually with the name of the branch. It takes every translation file the branch changes against main (en-GB sources are skipped), reduces it to the changed strings, uploads them to Crowdin and approves them. Use the dry-run option to preview the files first.

If a pull request was merged by accident, git can no longer tell its changes apart from main. Enter its pull request number instead of a branch; the changed files are then read from the GitHub API.
