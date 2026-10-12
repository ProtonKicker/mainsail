export const meta = {
    name: 'notion-reskin-fix-complete',
    description: 'Apply remaining audit fixes from the Notion reskin, then gate with lint+build',
    phases: [
        { title: 'Fix', detail: '3 parallel fixers, disjoint file ownership' },
        { title: 'Gate', detail: 'lint + vite build must pass clean' },
    ],
}

const ROOT = '/home/tovi/Documents/GitHub/mainsail'

const CTX = `
## CONTEXT
Mainsail (${ROOT}) — Vue 2.7 + Vuetify 2 + TypeScript Klipper UI — was just reskinned to look like Notion. A first fix agent applied some audit fixes but died mid-run (turn limit). Your job: pick up exactly where it left off.

## ALREADY FIXED (do not redo, but verify your own files):
- src/store/variables.ts: defaultLogoColor reverted to '#D41216' with comment (brand red is mode-independent).
- src/components/ui/Panel.vue: additionalStyle getter + :style binding restored (pure-logic-change violation was reverted); panel rules re-anchored.
- src/assets/styles/notion.css: MOSTLY converted to the dual-anchor strategy below (only 1 'html.theme--light' left, likely in a comment).

## DUAL-ANCHOR RULE (the strategy the previous agent established — follow it):
The app does NOT reliably put theme--light/theme--dark on <html> (App.vue writes html.className but only after socket connect + watcher fires; index.html may set a body background inline). Vuetify ALWAYS puts .theme--light / .theme--dark on the .v-application element. Therefore every theme-gated rule must be anchored on '.v-application.theme--light' / '.v-application.theme--dark' (or 'html .v-application.theme--light' where html-level is needed for specificity) — NEVER on 'html.theme--light' alone. Where a previous rule already uses both anchors, that's fine. Check how already-fixed sections of notion.css do it and match that convention exactly.

## NOTION TOKENS (for reference when fixing):
light: bg #ffffff, sidebar #f7f6f3, surface #ffffff, text #37352f, secondary #787774, labels #9b9a97, border #ededec, hover rgba(22,22,22,0.06), active #ededec, accent #2383e2; dark: bg #191919, sidebar #202020, surface #202020, popover #272727, text #d4d4d4, secondary #9b9b9b, border #2f2f2f. Cards: flat + 1px hairline border, NO shadows. Buttons: sentence-case, radius 6px. Font stack: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif.

## HARD RULES
1. STYLING ONLY — never change script logic, store access, props, computed semantics, routes, sockets, i18n. Exception: reverting logic changes that a previous agent wrongly introduced IS allowed (see Panel additionalStyle precedent).
2. Findings live in /tmp/notion-review-findings.json (31 entries, fields: file, issue, severity, suggestion). Read it, filter to YOUR files.
3. AUDITORS CAN BE WRONG: for each of your findings, verify against the CURRENT tree first (the dead fixer may have already applied it). Skip already-applied ones and say so.
4. Only edit files in YOUR ownership list. If a finding truly requires touching someone else's file, put it in notesForReview instead.
5. Be efficient: batch your greps, don't re-read whole huge files repeatedly. notion.css is ~1900 lines — use grep with context.
6. After edits: npx prettier --write <files>. Do NOT run vite build or npm run lint (a gate agent does that).
`

const SCHEMA = {
    type: 'object',
    required: ['summary', 'filesChanged', 'fixed', 'skipped'],
    properties: {
        summary: { type: 'string', description: 'max 100 words' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        fixed: { type: 'array', items: { type: 'string' }, description: 'finding file+short issue you actually fixed' },
        skipped: { type: 'array', items: { type: 'string' }, description: 'finding + why skipped (already applied / false positive / out of scope)' },
        notesForReview: { type: 'string', description: 'cross-file needs you could not apply' },
    },
}

phase('Fix')
const [cssCore, cssLayout, components] = await parallel([
    () =>
        agent(
            `${CTX}
YOU ARE FIXER-A. Ownership: src/assets/styles/notion.css ONLY.
Your findings: every entry in /tmp/notion-review-findings.json whose file ends with notion.css. Expect roughly: v-timeline + v-btn-toggle coverage gaps, selection-controls ripple display:none regression, text-gray/disabled contrast issues (labels on content text, .text--disabled contrast), dialog/popover bg, html font-size 14px base, text-uppercase utility beating button sentence-case, over-specific :not() chain beating later rules, router-link-active vs exact-active for selected rows, toast layer targeting wrong library (.vue-notification vs vue-toast-notification), and any leftover html.theme-- single anchors.
Fix them all inside notion.css (add/adjust rules; you may restructure selectors but keep the dual-anchor convention). For contrast findings, pick Notion-plausible values that pass (e.g. labels stay #9b9a97 for chrome/section-labels, but body/content text must be >= #787774; disabled text light >= #9b9a97, dark >= #8f8f8f).`,
            { label: 'fix:notion.css', phase: 'Fix', schema: SCHEMA }
        ),
    () =>
        agent(
            `${CTX}
YOU ARE FIXER-B. Ownership: src/assets/styles/page.css, src/assets/styles/sidebar.css, src/assets/styles/toastr.css, src/assets/styles/utils.css, src/assets/styles/fonts.css, public/index.html.
Your findings: entries whose file matches those. Expect roughly: page.css body/html background losing to inline style on <body> in index.html (fix: dual-anchor + beat specificity, or set the background on .v-application and neutralize the inline via index.html — index.html IS yours, editing the inline style attribute there is allowed), scrollbar thumb contrast both modes, sidebar.css still using 22 single html.theme--light anchors (convert to the dual-anchor convention), toastr.css Roboto font-family reference. Also grep your files for any remaining 'html.theme--light'/'html.theme--dark' SINGLE anchors and fix them.`,
            { label: 'fix:layout-css', phase: 'Fix', schema: SCHEMA }
        ),
    () =>
        agent(
            `${CTX}
YOU ARE FIXER-C. Ownership: everything under src/components/, src/store/, src/plugins/, src/pages/, src/App.vue, public/config.json — EXCEPT files owned by fixers A and B.
Your findings: entries whose file matches. Expect roughly: TheSelectPrinterDialog.vue color="white" buttons on light bg (swap to theme-aware color prop or class — template class/color changes are styling, allowed), TheConnectingDialog.vue dark-era colors before any theme class exists, ConsoleTableEntry.vue timestamp/disabled-text contrast on light code surface, TemperaturePanelPresets.vue #1e1e1e transparency hack, TheSettingsMenu.vue dark-first divider, WebcamForm.vue rgba(255,255,255,.25) menu-button borders, mixins/theme.ts ?? 'dark' fallback, variables.ts defaultBigThumbnailBackground equality-comparison risk (check how it is used in src/components/settings and src/store/gui; if it is compared against persisted values, revert to '#1e1e1e' — reverting a previous agent's constant change is allowed), vuetify.ts custom theme-key serialization concern (verify Vuetify 2 handles custom keys with customProperties — it does; only restructure if you can demonstrate a real breakage), config.json defaultMode triple-source-of-truth note (verify precedence: main.ts uses config.json defaultMode ?? variables defaultMode — a light default in BOTH is consistent, not a bug; skip if so).
Component-scoped rules must also follow the dual-anchor convention when they use global (non-scoped) <style> blocks; scoped styles with ::v-deep are fine as-is if they don't depend on html classes.`,
            { label: 'fix:components', phase: 'Fix', schema: SCHEMA }
        ),
])

const fixers = [cssCore, cssLayout, components].filter(Boolean)
log(`Fixers done: ${fixers.flatMap((f) => f.fixed).length} fixed, ${fixers.flatMap((f) => f.skipped).length} skipped`)

phase('Gate')
const crossNotes = fixers.map((f) => f.notesForReview).filter(Boolean).join('\n---\n')
const gate = await agent(
    `${CTX}
YOU ARE THE GATE AGENT with cross-lane authority. Three fixers just finished. Their unresolved cross-file needs:
${crossNotes || '(none reported)'}

1. Apply any of the above cross-file needs that are real and styling-safe (you may edit any file).
2. Run: npx prettier --write on all files the fixers changed: ${JSON.stringify([...new Set(fixers.flatMap((f) => f.filesChanged))])}
3. Run: npm run lint — fix all errors.
4. Run: npx vite build — fix all errors. Repeat until both pass.
5. Quick sanity grep: no remaining SINGLE-anchor 'html.theme--light'/'html.theme--dark' rules in src/assets/styles/*.css (allowing dual anchors and comments); notion.css still imported in App.vue; git diff --stat looks sane (no deletions of components).
Return summary + filesChanged + fixed + skipped + notesForReview.`,
    { label: 'gate:build', phase: 'Gate', schema: SCHEMA }
)

return {
    fixers: fixers.map((f) => ({ summary: f.summary, fixed: f.fixed.length, skipped: f.skipped.length })),
    gate,
}
