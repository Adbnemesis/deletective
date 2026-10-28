# Deletective's portable SEO workflow

This is the project adaptation for Codex/Antigravity. Load this file explicitly when working on SEO. Upstream packages live in source-separated subfolders and are preserved verbatim; their commands, agents, placeholders, promotional footers and experimental claims do not override the owner's brief. The application's build never imports these files.

## Intake and evidence

Read `docs/game-design.md`, `docs/seo-strategy.md` and the current implementation. The original brief authorizes page drafting, routine copy/heading edits, local audits and documentation. It does not authorize accounts, publishing, paid APIs, false reviews or external messages. Use source-backed claims; distinguish measured, calculated, qualitative and unknown. No login is necessary to build or play.

## One coordinated cycle

1. **Prioritize:** use [Corey SEO Audit](coreyhaines31/seo-audit/SKILL.md) for crawl/index, technical, on-page, content and authority order; [Anthropic audit](anthropics/seo-audit/SKILL.md) for keyword/competitor gap structure; [Agrici hub](agricidaniel/seo/SKILL.md) for a unified severity and dependency report. Report observations and reproducible checks; no invented SEO health score.
2. **Map intent:** follow [Programmatic SEO](coreyhaines31/programmatic-seo/SKILL.md): one owning page per genuine use case. Reject synonym-only, city-swap and private answer pages. Use [Competitor Pages](agricidaniel/seo-competitor-pages/SKILL.md) to require linked, dated evidence and balanced comparisons; defer public comparison pages until hands-on research exists.
3. **Draft:** [Content Writer](aaron-he-zhu/content-writer/SKILL.md) mode `new` supplies intent, useful structure and evidence checks. The user's approved product brief is the writing canon for this authorized exploratory build; no external Narrative/claims service is configured. Mark native registry/auditor dependencies unavailable rather than pretending they ran. [Agrici Content](agricidaniel/seo-content/SKILL.md) reviews Who/How/Why, direct answers, originality and practical use. Exact word-count floors, keyword placement quotas and external-link counts are advisory, never reasons to pad a game page.
4. **Implement:** [Sanity AEO](sanity-io/seo-aeo-best-practices/SKILL.md) and [Addy SEO](addyosmani/seo/SKILL.md) guide static metadata, semantic HTML, viewport, accessible controls, canonical and public structured-data consistency. Translate Next/Sanity samples to this actual stack; don't add a CMS for a sample.
5. **Discoverability:** [Corey AI SEO](coreyhaines31/ai-seo/SKILL.md) and [ReScience SEO GEO](resciencelab/seo-geo/SKILL.md) contribute readable product definitions, questions, links and extractable public rules. Prefer official crawler/Google documentation over old bot lists or fixed citation-lift claims. Training policy is separate from search discovery. No AI-only copy, compulsory llms.txt or guarantee of citations.
6. **Sitemap:** [Agrici Sitemap](agricidaniel/seo-sitemap/SKILL.md) checks canonical public HTTP-200 URLs, valid XML, exclusion of rooms/results/API, and meaningful `lastmod` only when a true change date is known. Generate URLs from `PUBLIC_SITE_URL`; do not hardcode an unowned domain.
7. **Audit and fix:** use local build/HTTP checks plus actual browser-rendered evidence. Inspect JSON-LD in rendered output; static regex tools cannot prove absence of JS-injected markup. Record checks in `docs/seo-audit.md`, fix source, rerun. Lighthouse is useful when available but never a ranking forecast. Measure LCP/CLS/INP with the appropriate lab/field distinction.
8. **After authorized launch:** [Ian SEO](iannuttall/seo/SKILL.md) provides the route to first-party GSC/Bing/analytics and optional Ahrefs/DataForSEO research. No connection currently exists. Do not execute `seo login`, authorize accounts, or buy data without owner action. Review canonical/index coverage, errors, queries, room starts and rematches after real usage; retain dated comparisons.

## Runtime boundaries

- `${CLAUDE_PLUGIN_ROOT}`, `/seo`, `~~SEO tools`, named Claude agents and external claims registries are not active in this runtime.
- No upstream Python/install shell script was executed. ReScience's ten Python files are present as source only; its keyless audit script was read. API helpers require separate review and credentials, and may incur cost.
- Prefer project-owned checks over patching upstream installers or globally installing Python packages. Preserve source identity, SHA and license when updating.
- Do not echo secrets, room codes, tokens or player text into SEO analytics. Crawl public pages only. Index-control directives are not access controls; room data still requires authentication.
- Record unknown search volumes, difficulty, DA, traffic, country splits and rankings explicitly. Web results are qualitative discovery, not a paid keyword dataset.

## Update procedure

Before updating, resolve an upstream commit, review the diff and license, reinstall to a new temporary project-local folder using the built-in installer, then replace intentionally. Keep all 13 source identities unique. Rerun the inventory checks and update `docs/seo-skills.md`. Global automatic skill discovery remains unconfigured; this file is the explicit portable entry point.
