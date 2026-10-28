# SEO skill compatibility and application

Review and installation date: 28 October 2026. All 13 requested skill sources were downloaded successfully with the built-in skill installer at verified upstream commits. Each `SKILL.md` was read. Source folders and licenses are retained under `tools/seo-skills/`.

**Installation means project-local instruction/reference packages. They are not globally registered or automatically discovered by Codex or Antigravity.** The workspace explicitly restricts writes to `.agents`/`.codex` directories; source-separated local copies avoid modifying global settings or colliding `seo`/`seo-audit` names. The portable entry point is [DELETECTIVE-WORKFLOW.md](../tools/seo-skills/DELETECTIVE-WORKFLOW.md). This workflow has been applied to research and page requirements during implementation; actual rendered checks belong in `seo-audit.md`.

## Source, version and use matrix

| # | Skill / installed source | Version / pinned commit | License | Applied project use |
| --- | --- | --- | --- | --- |
| 1 | [Corey SEO Audit](https://github.com/coreyhaines31/marketingskills/blob/0cd9b3a0ef4c411a1d690419ce843f2a1da32cce/skills/seo-audit/SKILL.md); `coreyhaines31/seo-audit` | 2.2.2; `0cd9b3a0ef4c` | MIT | Audit priority order; source/HTTP/rendered findings |
| 2 | [Corey AI SEO](https://github.com/coreyhaines31/marketingskills/blob/0cd9b3a0ef4c411a1d690419ce843f2a1da32cce/skills/ai-seo/SKILL.md); `coreyhaines31/ai-seo` | 2.11.0; `0cd9b3a0ef4c` | MIT | Public rules, clear entity definition; search/training separation |
| 3 | [Corey Programmatic SEO](https://github.com/coreyhaines31/marketingskills/blob/0cd9b3a0ef4c411a1d690419ce843f2a1da32cce/skills/programmatic-seo/SKILL.md); `coreyhaines31/programmatic-seo` | 2.1.1; `0cd9b3a0ef4c` | MIT | Distinct mode pages; reject mass synonym/location pages |
| 4 | [Addy Web Quality SEO](https://github.com/addyosmani/web-quality-skills/blob/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/seo/SKILL.md); `addyosmani/seo` | 2.0; `afa8da942115` | MIT | Metadata, semantic structure, mobile and measured audit discipline |
| 5 | [ReScience SEO GEO](https://github.com/resciencelab/opc-skills/blob/484fa3204e5f3ba400d084ed4f75ca1d722b5a6c/skills/seo-geo/SKILL.md); `resciencelab/seo-geo` | Unversioned; `484fa3204e5f` | Apache-2.0 | Basic HTML audit checklist; reject fixed citation-lift claims |
| 6 | [Ian SEO](https://github.com/iannuttall/seo/blob/69a8ea2f86909a4054ba7bc72eadd9fe86053407/skills/seo/SKILL.md); `iannuttall/seo` | Unversioned; `69a8ea2f8690` | Apache-2.0 | Postlaunch first-party data plan; data unavailable now |
| 7 | [Sanity SEO AEO](https://github.com/sanity-io/agent-toolkit/blob/3ed3a143f8d3413faa7790ac0b2274fd3a8a6320/skills/seo-aeo-best-practices/SKILL.md); `sanity-io/seo-aeo-best-practices` | Unversioned; `3ed3a143f8d3` | MIT | Canonical/OG/sitemap/JSON-LD rules adapted to static build |
| 8 | [Agrici Universal SEO](https://github.com/agricidaniel/claude-seo/blob/6be93f45064ffbadced572b5d5c95f55fd263af0/skills/seo/SKILL.md); `agricidaniel/seo` | 2.5.0; `6be93f45064f` | MIT | One severity/dependency workflow, no synthetic ranking score |
| 9 | [Anthropic SEO Audit](https://github.com/anthropics/knowledge-work-plugins/blob/2574e29377c7173d0cecffef29a6ecbd7f8ccb5d/marketing/skills/seo-audit/SKILL.md); `anthropics/seo-audit` | Unversioned; `2574e29377c7` | Apache-2.0 | Qualitative keyword and competitor-gap method |
| 10 | [Agrici Competitor Pages](https://github.com/agricidaniel/claude-seo/blob/6be93f45064ffbadced572b5d5c95f55fd263af0/skills/seo-competitor-pages/SKILL.md); `agricidaniel/seo-competitor-pages` | 2.5.0; `6be93f45064f` | MIT | Dated verified comparison criteria; defer weak public comparisons |
| 11 | [Agrici SEO Content](https://github.com/agricidaniel/claude-seo/blob/6be93f45064ffbadced572b5d5c95f55fd263af0/skills/seo-content/SKILL.md); `agricidaniel/seo-content` | 2.5.0; `6be93f45064f` | MIT | Who/How/Why and useful unique content; no word-count padding |
| 12 | [Aaron Content Writer](https://github.com/aaron-he-zhu/aaron-marketing-skills/blob/a253bd3018e7ec8199c1472723ae63db48833b64/seo-geo/implement/content-writer/SKILL.md); `aaron-he-zhu/content-writer` | 20.1.0; `a253bd3018e7` | Apache-2.0 | New-page intent and evidence checks; native claims/auditor gate inactive |
| 13 | [Agrici SEO Sitemap](https://github.com/agricidaniel/claude-seo/blob/6be93f45064ffbadced572b5d5c95f55fd263af0/skills/seo-sitemap/SKILL.md); `agricidaniel/seo-sitemap` | 2.5.0; `6be93f45064f` | MIT | Canonical public URL coverage; exclude private routes |

Full commit SHAs, repo timestamps, installer exit/output and licensing metadata are in [inventory.json](../tools/seo-skills/inventory.json). File hashes and basic format checks are in [verification evidence](research-evidence/seo-skill-verification.json). “Unversioned” means no explicit version was identified in that skill header; the commit is the version.

## Compatibility, dependencies and credentials

| Source group | Codex compatibility | Antigravity compatibility | Dependencies / credential status | Tests completed / limitations |
| --- | --- | --- | --- | --- |
| Corey (3) | Markdown instructions and bundled references manually usable | Same portable format; runtime not tested | Web research; optional Semrush/Ahrefs/GSC/GA4 unconnected | All three SKILL files read, frontmatter/hash checked, relevant guidance applied; external APIs and bundled evals not run |
| Addy (1) | Markdown and code-review checklist usable | Format-compatible; runtime not tested | Optional Lighthouse/DevTools, browser, Search Console | SKILL read and format checked; project browser/HTTP evidence reported separately; no claim of upstream Lighthouse execution |
| ReScience (1) | Core instructions usable; ten Python sources installed but inactive | Manual instructions usable; scripts not tested | Python stdlib for keyless audit; other scripts call paid DataForSEO with credentials | SKILL and keyless audit source read; all scripts enumerated; no bundled script executed or credentials requested |
| Ian (1) | Native `agents/openai.yaml` present; MCP/CLI not configured | Manual instructions usable; no native verification | `seo` npm CLI or seoskill.dev MCP; login for first-party data; DataForSEO/Ahrefs optional | SKILL/agent config inspected; no account login or MCP enabled; search volume/difficulty remain Unknown |
| Sanity (1) | Markdown and four references usable; examples translated to actual stack | Portable guidance; runtime not tested | Next/Sanity examples are illustrative, no mandatory CMS; optional schema-dts | SKILL plus technical/schema references read; no CMS, new account or unnecessary dependency added |
| Agrici (4) | Manual instruction adaptation only; Claude slash commands, named agents, launcher not active | Same limitation; runtime not tested | `${CLAUDE_PLUGIN_ROOT}/scripts/claude-seo`, isolated Python/browser setup and optional external SEO APIs not installed as a plugin runtime | All four SKILL files read and format checked; no native launcher/setup/script, SEO-score calculation or agent suite execution claimed |
| Anthropic (1) | Markdown audit guidance usable; connector placeholders mapped to available web tools | Manual guidance; runtime not tested | `~~SEO tools`, `~~product analytics` and parent CONNECTORS.md not connected/copied by skill-only install | SKILL read; qualitative research mode used; no fabricated analytics, backlinks, volume or authority scores |
| Aaron replacement (1) | New-page writing guidance usable; full external Narrative/claims registry and auditor gate unavailable | Portable draft guidance only; runtime not tested | Parent-level memory projections, registry-events.py, auditor skills, connector/index-push scripts are outside skill-only package | SKILL and two writing references read; native dependency status not verified, no publication receipt or CORE-EEAT score claimed |

The built-in installer copied skill directories and local references, not every sibling skill or parent plugin script. Broken external-relative paths therefore remain upstream references, not working local commands. The adapter explicitly bypasses unavailable orchestration without pretending it executed. No script path was rewritten to invoke arbitrary global Python.

## Writer replacement verification

The original [seo-geo-claude-skills source](https://github.com/aaron-he-zhu/seo-geo-claude-skills) currently describes itself as a signpost; its old `build/seo-content-writer/SKILL.md` says active development moved to `aaron-marketing-skills`, while the old standalone line is frozen at tag v9.9.12. The old source text is retained in [research evidence](research-evidence/aaron-original-content-writer-SKILL.md). The active repository was last pushed on 28 October 2026 when inspected; the old one on 4 September 2026. The replacement was verified at the actual current path `seo-geo/implement/content-writer`, not the stale `seo-geo/build/content-writer` pointer in the signpost. Version 20.1.0 is installed, with its Apache-2.0 license.

## Installer verification

The current skills.sh CLI help was actually executed with `npm exec --yes --package=skills -- skills add --help`; it confirms `--skill/-s`, `--agent/-a`, `--copy`, `--list` and `--json`. No agent-directory installation was performed with it. The built-in reviewed installer was used instead for explicit `--dest` and pinned `--ref`, preserving unique source folders in a writable project location. Installer exit status was zero for all eight source batches, producing 13 skill directories. No symlink or global namespace was created.

Global registration can be configured in a later owner-authorized environment, but it is not required to use the compatible instructions in this build. A project-local source copy does not become a new automatically selectable skill on the next turn. Do not claim that it does.

## Rejected or adapted guidance

- ReScience’s fixed FAQ/schema/citation “boost” percentages and bot/training conflation were not adopted. Corey’s AI-SEO statistics likewise were not generalized to this game. No causal traffic, citation or revenue forecast was made.
- [Google’s current AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) says existing SEO fundamentals apply; special AI files/markup are not needed and indexation is not guaranteed. Public rules remain useful text for people. `llms.txt` is treated as optional, not a ranking requirement.
- Claude-specific launchers, slash commands, plugins, memory registries and connector placeholders are not active tools here. Native script-only tasks are marked unavailable; compatible principles are implemented with project code and real tests.
- Upstream marketing footers, compulsory follow-up offers, fixed prose length, repeated intake questions and requests for a CMS were omitted where they conflict with the owner’s explicit autonomy, privacy and product requirements.
- Rating/review schema examples are illustrative and must never create invented ratings. Structured data describes the actual free game only. FAQ/HowTo schema is not promised to earn rich results.
- No public competitor-alternative page is justified merely by mentioning a popular name. Research must stay balanced, dated and linked; actual hands-on comparisons and search evidence are required first.

## Security and license review

Downloaded instructions/scripts were treated as untrusted source material. No bundled shell installer, Python script, account login, paid API, credential detector, index-push endpoint or auto-update hook was executed. ReScience’s keyless `seo_audit.py` was read: it performs URL requests and regular-expression HTML checks, has no JavaScript rendering and does not validate actual crawler permissions. Its presence is not evidence of a passed SEO audit. Other API wrappers remain disabled pending individual review. The `skills` CLI help execution is the sole third-party CLI invocation used for installer verification.

MIT/Apache-2.0 licenses were fetched and retained per author; Agrici per-skill license files remain intact. Source content is not included in the public game assets. Apache notices/attribution should be preserved when distributing derivative tooling. Future source updates require a fresh diff/license review and inventory hash update.

## How the 13 sources contribute without 13 redundant audits

The coordinated sequence is intake → intent map → source-backed copy → metadata/schema implementation → public crawl/HTML/rendered audit → sitemap verification → postlaunch first-party measurement. Each source has one scoped contribution in the matrix. Native runtime compatibility is never inferred from a Markdown file. Search Console/Bing/Cloudflare analytics account setup, paid keyword measurements, native Antigravity behavior and external index/citation outcomes remain unverified.
