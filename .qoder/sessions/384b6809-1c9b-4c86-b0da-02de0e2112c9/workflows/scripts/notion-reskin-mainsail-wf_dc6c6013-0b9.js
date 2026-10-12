export const meta = {
    name: 'notion-reskin-mainsail',
    description: 'Reskin Mainsail UI to look like Notion, preserving all functionality',
    phases: [
        { title: 'Implement', detail: '5 parallel agents, disjoint file ownership' },
        { title: 'Build', detail: 'lint + vite build, fix errors' },
        { title: 'Review', detail: 'fidelity / functionality / dark-mode / coverage audits' },
        { title: 'Fix', detail: 'apply confirmed gaps, re-verify build' },
    ],
}

const ROOT = '/home/tovi/Documents/GitHub/mainsail'

const SPEC = `
## NOTION DESIGN TOKENS (single source of truth — use these exact values)

LIGHT theme (default; this is the target look — a Notion screenshot with light gray sidebar, white content, dark charcoal text):
  content bg        #ffffff
  sidebar bg        #f7f6f3
  surface (cards, menus, dialogs, popovers) #ffffff
  text primary      #37352f
  text secondary    #787774   (breadcrumbs, subtitles)
  text gray/labels  #9b9a97   (section labels, default icon color)
  hairline border   #ededec   (card borders, dividers, table row borders)
  hover bg          rgba(22,22,22,0.06)
  active/selected   #ededec
  accent blue       #2383e2   (primary buttons, links, switches, focus rings)
  error #eb5757 | warning #dfab01 | success #4dab9a | info #2383e2
  menu/dialog shadow: 0 0 0 1px rgba(15,15,15,0.05), 0 3px 6px rgba(15,15,15,0.1), 0 9px 24px rgba(15,15,15,0.2)

DARK theme (Notion dark):
  content bg #191919 | sidebar bg #202020 | surface #202020 (popovers/menus #272727)
  text #d4d4d4 | secondary #9b9b9b | labels #8f8f8f
  border #2f2f2f | hover rgba(255,255,255,0.06) | active #2f2f2f
  accent #2383e2 | error #eb5757 | warning #dfab01 | success #4dab9a

Typography: font stack: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"
  base 14px; card/panel titles 14px/600; nav items 14px/500; section labels 12px #9b9a97; big headings 700.
Geometry: cards/menus/dialogs radius 8px; buttons/inputs radius 6px; chips radius 4px; sidebar nav items radius 6px (margin 1px 8px).
Elevation: CARDS HAVE NO BOX-SHADOW — flat surface + 1px solid hairline border instead (this is the signature Notion look). Only floating menus/dialogs/tooltips get the Notion shadow above.
Buttons: text-transform none, letter-spacing normal (Vuetify defaults to uppercase — override it), font-weight 500.

## THEME MECHANICS (verified facts about this codebase)
- Vuetify 2.7-era plugin at src/plugins/vuetify.ts: theme.options.customProperties=true, dark toggled at runtime.
- App.vue sets html.className to 'theme--light' or 'theme--dark' (from gui.uiSettings.mode), and Vuetify also puts .theme--light/.theme--dark on .v-application. Scope every rule as html.theme--light ... / html.theme--dark ... (or both classes) so light+dark both work.
- App.vue watcher sets $vuetify.theme.currentTheme.primary from gui.uiSettings.primary (default from src/store/variables.ts defaultPrimaryColor).
- Initial dark/light boot mode comes from public/config.json "defaultMode" (main.ts) with fallback src/store/variables.ts defaultMode.
- Global stylesheets are @imported in App.vue's <style> block from src/assets/styles/ (fonts.css, toastr.css, page.css, sidebar.css, utils.css, updateManager.css).
- Dashboard panels all render through src/components/ui/Panel.vue (v-card.panel + v-toolbar.panel-toolbar + span.subheading title).
- Sidebar: src/components/TheSidebar.vue (v-navigation-drawer, #nav-header logo row) + src/components/ui/SidebarItem.vue (v-list-item rows). Topbar: src/components/TheTopbar.vue.

## HARD RULES (every agent)
1. STYLING ONLY. Do not change any script logic: no store/state/route/socket/i18n changes, no removing/renaming elements, props, slots, methods or events. Behavior must be byte-identical in function.
2. You own ONLY the files listed in YOUR scope. Never edit files owned by another agent. If you need a global rule, it belongs to the notion.css owner — put a comment note at the top of your file instead of editing theirs.
3. Vue 2.7 + vue-class-component decorators. TypeScript. Follow existing code style.
4. After editing, run: npx prettier --write <each file you changed>
5. Do NOT run npm run serve, npm run build, or vite build (a later phase does that). You may run grep/read freely.
6. Keep every feature visible and usable: emergency stop stays prominent (Notion red-ish is fine), status colors (printing/idle) keep meaning, temperature colors keep readability.
`

const OWNERSHIP = `
File ownership map (all agents run concurrently in the same tree — stay in your lane):
- THEME agent: src/plugins/vuetify.ts, src/store/variables.ts (color/mode defaults ONLY), public/config.json, src/assets/styles/fonts.css, public/index.html (font links only), mock/mockMoonraker.mjs (uiSettings defaults only).
- GLOBAL agent: CREATE src/assets/styles/notion.css; edit src/App.vue (add ONE @import line only); edit src/assets/styles/page.css.
- SIDEBAR agent: src/components/TheSidebar.vue, src/assets/styles/sidebar.css, src/components/ui/SidebarItem.vue.
- TOPBAR agent: src/components/TheTopbar.vue.
- PANEL agent: src/components/ui/Panel.vue.
- notion.css (GLOBAL) owns all overrides of Vuetify-internal classes (.v-navigation-drawer, .v-list-item, .v-card, .v-toolbar, .v-btn, .v-menu__content, .v-dialog, .v-input, .v-table, .v-tabs, .v-chip, .v-switch, .v-tooltip__content, scrollbars, etc.). Component agents style only their own custom classes (nav-header, nav-logo, menu-item-title, panel-toolbar, subheading, topbar custom classes) and template-level utility classes.
`

const IMPL_SCHEMA = {
    type: 'object',
    required: ['summary', 'filesChanged'],
    properties: {
        summary: { type: 'string', description: 'What was changed and why, max 120 words' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        notesForReview: { type: 'string', description: 'Anything risky or uncertain' },
    },
}

const BUILD_SCHEMA = {
    type: 'object',
    required: ['lintOk', 'buildOk', 'notes'],
    properties: {
        lintOk: { type: 'boolean' },
        buildOk: { type: 'boolean' },
        notes: { type: 'string' },
    },
}

const FINDINGS_SCHEMA = {
    type: 'object',
    required: ['findings'],
    properties: {
        findings: {
            type: 'array',
            items: {
                type: 'object',
                required: ['file', 'issue', 'severity'],
                properties: {
                    file: { type: 'string' },
                    issue: { type: 'string' },
                    severity: { enum: ['low', 'medium', 'high'] },
                    suggestion: { type: 'string' },
                },
            },
        },
    },
}

const CONTEXT = `You are one of five concurrent agents reskinning Mainsail (${ROOT}) — a Vue 2.7 + Vuetify 2 + TypeScript web UI for Klipper 3D printers — to look as close to NOTION as possible while preserving 100% of functionality. The repo has a fake moonraker (mock/mockMoonraker.mjs) so the UI runs standalone. The reference design is Notion: light-gray sidebar with flat rounded nav items, white content area, hairline-bordered flat cards with NO shadows, charcoal text #37352f, system sans font, small subtle buttons, blue #2383e2 accent.
${OWNERSHIP}
${SPEC}
`

phase('Implement')
log('Fanning out 5 implementation agents with disjoint file ownership')

const [theme, global, sidebar, topbar, panel] = await parallel([
    () =>
        agent(
            `${CONTEXT}
YOUR SCOPE: THEME FOUNDATION. You are the THEME agent.
1. src/plugins/vuetify.ts — add full light+dark theme palettes under theme.themes using the token spec (primary #2383e2, secondary, accent, error #eb5757, info, success #4dab9a, warning #dfab01, anchor; plus custom keys background, sidebar, surface, panel, toolbar, text, textsecondary, textgray, border with the light/dark token values — customProperties:true turns them into --v-theme-* CSS vars that notion.css will consume). Set theme.dark:false (light default). Keep icons/breakpoint config untouched.
2. src/store/variables.ts — defaultMode: 'light'; defaultPrimaryColor: '#2383e2'; defaultLogoColor: '#37352f'; defaultBigThumbnailBackground: '#f7f6f3'. Change NOTHING else (no panel lists, no versions).
3. public/config.json — "defaultMode": "light".
4. src/assets/styles/fonts.css — read it first. Replace the current font setup (Roboto @font-face or imports) with the Notion font stack as the app's main font. If fonts are loaded via @font-face local files, keep the file but override usage; simplest: define the stack on body/.v-application and remove Roboto-only rules that would conflict. Check public/index.html for Google-Fonts/Roboto <link> tags and remove them if present (font links only — touch nothing else in index.html).
5. mock/mockMoonraker.mjs — grep for uiSettings / mode / primary / logo defaults it serves (e.g. server.database GET responses). If the mock persists/serves gui.uiSettings with dark mode or old colors, update those DEFAULT values to light mode, primary #2383e2, logo #37352f so the demo boots Notion. If the mock serves nothing for these, leave the file untouched.
6. grep src/store/gui for uiSettings defaults (mode/primary/logo) and align them to light/#2383e2/#37352f if hardcoded there — but ONLY default values, never logic.
Return summary + filesChanged + notesForReview.`,
            { label: 'impl:theme', phase: 'Implement', schema: IMPL_SCHEMA }
        ),
    () =>
        agent(
            `${CONTEXT}
YOUR SCOPE: GLOBAL NOTION STYLESHEET. You are the GLOBAL agent.
1. CREATE src/assets/styles/notion.css — the heart of the reskin. Read src/assets/styles/page.css and utils.css first to match conventions. Write comprehensive, theme-scoped (html.theme--light / html.theme--dark) overrides implementing the token spec. MUST cover:
   - .v-application: font stack, color text primary, background content bg; body/html background.
   - .v-navigation-drawer: sidebar bg, 1px solid border-right hairline, no shadow. .v-navigation-drawer__content padding.
   - .v-list-item (nav rows): radius 6px, margin 1px 8px, min-height ~30px, font 14px/500, color text; hover bg; .v-list-item--active + router-link-active: bg active/selected, color text primary, font-weight 600. .v-list-item__icon: 18px icons, color textgray. Dense/mini variants must still look right.
   - .v-card: bg surface, border 1px solid hairline, radius 8px, box-shadow none for ALL elevation levels (.v-card, .v-card--reveal exceptions keep working). .v-card__text stays readable.
   - .v-toolbar: no shadow, transparent bg inside cards; global topbar handled by component agent — but style .v-toolbar__title/.v-toolbar__extension base typography here.
   - .v-btn: radius 6px, text-transform none, letter-spacing normal, font-weight 500, contained default height 28-32px px-3; .v-btn--icon 30px with circular hover bg; .v-btn--text color text primary; .v-btn.primary keeps accent bg; disabled state Notion-gray; .v-btn--fab → Notion doesn't use fabs: keep but radius 8px.
   - Inputs: .v-input__slot / .v-text-field .v-input__slot radius 6px, border hairline (for outlined), underline variant line color hairline + accent on focus; .v-select__slot, .v-autocomplete, .v-textarea; label color textgray, input text color text; .v-messages color textgray font 12px.
   - Menus/dialogs/popovers: .v-menu__content, .v-dialog__content > .v-dialog, .v-menu__list: radius 8px, Notion shadow, border none, bg surface. Menu item hover bg. Keep .v-overlay opacity subtle (0.4).
   - Tables: .v-table, .v-data-table: th 12px/500 color textgray uppercase? NO — Notion table headers are 12px sentence-case gray; border-bottom hairline; td border-bottom hairline; tbody tr hover bg; .v-data-footer color textgray, buttons Notion-styled; striped/hover classes respected.
   - .v-divider border-color hairline; .v-chip radius 4px font 12px; .v-tabs .v-tab text-transform none 14px/500 color textgray, active color text primary, .v-tabs-slider 2px accent; .v-tab__slider.
   - .v-switch: track rgba gray, checked track accent #2383e2, thumb white, small (Notion-style). .v-slider__track accent. .v-progress-linear thin accent.
   - .v-tooltip__content: Notion tooltip — bg #191919 (light theme) / #2f2f2f (dark), color #fff/#d4d4d4, radius 6px, font 12px, no caps.
   - .v-alert: radius 8px, border hairline, bg tinted (keep semantic colors readable in both themes). .v-snackbar: radius 8px dark surface. .v-expansion-panel: radius, border, no shadow. .v-avatar keep circular. .v-badge fine. .v-treeview rows Notion hover. .v-date-picker__header etc. basic accent theming.
   - Scrollbars: html scrollbar-color + ::-webkit-scrollbar thin Notion style (thumb rgba(15,15,15,0.3) light / rgba(255,255,255,0.2) dark, transparent track) — but page.css (also yours) already styles scrollbars; update page.css itself to Notion values instead of duplicating.
   - Console/code areas: .cm-editor background, pre/code blocks, #console-view style areas: Notion code-block feel (bg #f7f6f3 light / #202020 dark, radius 6px). Gcode viewer canvas overlays untouched.
   - Headings: .text-h1/.text-h2/.text-h3/.subheading/.v-toolbar__title inside panels: Notion weights/sizes per spec.
   Use the --v-theme-* custom properties (from customProperties:true) where the theme agent defines them (primary, background, sidebar, surface, panel, border, text, textsecondary, textgray — assume these exist; fall back to literal hex if a var is missing rather than breaking).
2. src/App.vue — add "@import './assets/styles/notion.css';" as the LAST import in the <style> block. Touch nothing else in App.vue.
3. src/assets/styles/page.css — convert hardcoded dark scrollbar/border colors to Notion tokens for both themes (keep every utility class name and rule intact — restyle, never remove).
Return summary + filesChanged + notesForReview.`,
            { label: 'impl:global-css', phase: 'Implement', schema: IMPL_SCHEMA }
        ),
    () =>
        agent(
            `${CONTEXT}
YOUR SCOPE: SIDEBAR. You are the SIDEBAR agent.
Read src/components/TheSidebar.vue, src/components/ui/SidebarItem.vue, src/assets/styles/sidebar.css, and skim src/components/mixins/navigation.ts to understand nav data (do not edit the mixin).
Goal: make the left drawer feel exactly like Notion's sidebar. notion.css (owned by another agent, being written concurrently) already handles .v-navigation-drawer background, .v-list-item hover/active/radius — do NOT duplicate those; focus on YOUR classes:
1. #nav-header (sidebar.css): Notion workspace-row feel — left-aligned, ~40px tall, padding 6px 12px, NO border-bottom (or hairline #ededec/#2f2f2f at most), logo mark 20px + printer name 14px/600 color #37352f (dark: #d4d4d4), hover bg rgba(22,22,22,0.06) radius 6px. Remove the old white-text assumptions (nav-link color: white etc.) — make nav styles theme-aware via html.theme--light/html.theme--dark. The legacy 'nav ul.navi' rules: check if any template uses them (grep); if unused, restyle them harmlessly or leave a comment, do not delete selectors other code might reference.
2. TheSidebar.vue (template/script untouched except classes): give the header row a Notion feel — keep v-img sidebarBackground slot, keep AboutDialog append slot, keep overlay scrollbars. You may add utility classes (px-1, py-2, text classes) and adjust scoped CSS only.
3. SidebarItem.vue: menu-item-title → 14px, font-weight 500 (600 when active — target via .v-list-item--active .menu-item-title in sidebar.css), icon color #9b9a97 (dark #8f8f8f), active item icon+text color #37352f (dark #d4d4d4). Keep tooltips, router behavior, mini-variant handling exactly.
Return summary + filesChanged + notesForReview.`,
            { label: 'impl:sidebar', phase: 'Implement', schema: IMPL_SCHEMA }
        ),
    () =>
        agent(
            `${CONTEXT}
YOUR SCOPE: TOPBAR. You are the TOPBAR agent.
Read src/components/TheTopbar.vue fully (349 lines: status area, power device menu, emergency stop, user/settings menus, community links, etc.).
Goal: Notion's slim flat top bar. notion.css owns generic .v-toolbar/.v-btn/.v-menu__content styling — you handle the topbar's own structure/classes:
1. The bar itself: bg #ffffff (dark #191919), 1px solid bottom border #ededec (dark #2f2f2f), NO elevation/shadow, height slim (~45px — check topbarHeight in src/store/variables.ts; do NOT change the variable, just make the visuals work with it).
2. Title/breadcrumb: printer/page name 14px/600 color #37352f (dark #d4d4d4); secondary text (state labels) 12-13px #9b9a97.
3. Icon buttons (temp sensors, webcam toggle, fullscreen, etc.): 28-30px, color #787774 (dark #9b9b9b), circular hover — if notion.css doesn't cover a topbar-specific class, add a scoped style in TheTopbar.vue's <style> block for YOUR classes only.
4. Emergency stop: stays red and prominent (Notion-style: solid #eb5757, radius 6px) — keep the confirm behavior identical.
5. Status chips/indicators (klippy state, printing progress): Notion chip feel — small radius 4px, tinted bg, sentence-case 12px.
STRICT: keep every v-btn, menu, dialog, watcher, computed and store dispatch intact — classes and scoped CSS only.
Return summary + filesChanged + notesForReview.`,
            { label: 'impl:topbar', phase: 'Implement', schema: IMPL_SCHEMA }
        ),
    () =>
        agent(
            `${CONTEXT}
YOUR SCOPE: PANEL CARD. You are the PANEL agent.
Read src/components/ui/Panel.vue (shared wrapper for every dashboard card: v-card.panel + v-toolbar.panel-toolbar + span.subheading title + collapse chevron).
Goal: Notion "inline page" card — flat white surface, 1px #ededec border (dark #2f2f2f), radius 8px, header row with 14px/600 title, hairline divider under header, no shadows.
1. v-card: add :elevation="0" (prop-only change, safe). notion.css kills shadows globally; ensure .panel doesn't reintroduce any.
2. additionalStyle getter currently hardcodes 'border-bottom: 1px solid #A8A8A8' for light mode — replace with a CSS-class-driven hairline border that works in BOTH themes (e.g. class 'panel-toolbar-divider' + scoped CSS using html.theme--light/dark, or border-color var). Keep the getter returning '' or remove it and its binding — pure styling, no logic change.
3. Title: span.subheading → 14px/600 color #37352f (dark #d4d4d4). Toolbar icon: 18px, color #9b9a97. Collapse chevron: color #9b9a97, keep rotation transition.
4. Panel toolbar buttons (slot buttons like reheat/preheat in temperature panel): they inherit .v-btn Notion styles from notion.css; make sure .panel-toolbar .v-btn height rules in this file's <style> block still look right at radius 6px — adjust the existing global rules in THIS file's second <style> block (it is yours).
5. Light/dark: everything must work in both modes.
STRICT: props, slots, expand store dispatch, v-expand-transition all unchanged.
Return summary + filesChanged + notesForReview.`,
            { label: 'impl:panel', phase: 'Implement', schema: IMPL_SCHEMA }
        ),
])

const impls = [theme, global, sidebar, topbar, panel].filter(Boolean)
log(`Implementation done: ${impls.length}/5 agents reported, ${impls.flatMap((i) => i.filesChanged).length} files touched`)

phase('Build')
const build = await agent(
    `${CONTEXT}
You are the BUILD VERIFIER. All five implementation agents finished. Their reports:
${JSON.stringify(impls, null, 2)}

In ${ROOT}:
1. Run: npx prettier --write on every file listed in filesChanged above (dedupe; skip missing).
2. Run: npm run lint — fix ALL errors (styling-safe fixes only: unused vars you introduced, type nits; never delete features).
3. Run: npx vite build (NOT npm run build — skip the zip step). Fix all compile errors.
4. Sanity-check src/assets/styles/notion.css exists and is imported in App.vue, and that html.theme--light/theme--dark scoping is used (grep). If notion.css references --v-theme-* vars, verify src/plugins/vuetify.ts actually defines those keys; add missing keys to the vuetify theme (you have cross-lane permission for THIS reconciliation only).
5. Re-run lint+build until both pass clean.
Return lintOk, buildOk, notes (what you fixed).`,
    { label: 'build:verify-fix', phase: 'Build', schema: BUILD_SCHEMA }
)

if (!build) throw new Error('Build agent failed to report')
log(`Build phase: lint=${build.lintOk} build=${build.buildOk}`)

phase('Review')
const REVIEWERS = [
    {
        key: 'fidelity',
        prompt: `You are a NOTION-FIDELITY auditor (read-only). In ${ROOT}, verify the reskin actually implements the spec below. Check src/plugins/vuetify.ts, src/assets/styles/notion.css, page.css, fonts.css, sidebar.css, TheSidebar.vue, SidebarItem.vue, TheTopbar.vue, Panel.vue, public/config.json, src/store/variables.ts.
${SPEC}
Look for: wrong hex values, cards still having shadows (grep elevation/box-shadow on v-card), buttons still uppercase (missing text-transform:none), missing font stack, sidebar bg not #f7f6f3, missing hairline borders, missing dark-theme counterparts for light rules, radius mismatches. Report ONLY concrete gaps with file+issue+severity+one-line suggestion. Do not edit anything.`,
    },
    {
        key: 'functionality',
        prompt: `You are a FUNCTIONALITY-SAFETY auditor (read-only). In ${ROOT} run: git diff --stat, then git diff, and scrutinize EVERY hunk. The task was a pure visual reskin. Flag ANY change that alters behavior: removed/renamed DOM ids or classes referenced elsewhere (grep the repo for them, e.g. #content, #page-container, panel-toolbar, v-list-item ids used by JS, data-* attrs), changed computed props returning different types, changed store dispatches, changed v-if/v-show conditions, deleted template elements, changed props defaults, i18n key edits, mock server API response changes, routes. Also check renamed classes are still targeted by notion.css. Report file+issue+severity(high if behavior changes)+suggestion. Do not edit anything.`,
    },
    {
        key: 'darkmode',
        prompt: `You are a DARK-MODE/CONTRAST auditor (read-only). In ${ROOT}, grep the changed CSS/Vue files (git diff --name-only) for hardcoded light-only colors (#fff, #f7f6f3, #37352f, rgba(22,22,22...) etc.) that lack an html.theme--dark counterpart, and vice versa. Check: console text readability, temperature panel colored text on dark bg, disabled buttons, v-messages, tooltips in dark mode, scrollbars both modes, the connecting dialog (TheConnectingDialog.vue) and select-printer dialog still styled sensibly (they render before theme classes may apply — check they don't flash broken), settings menu (TheSettingsMenu.vue) lists in dark. Report file+issue+severity+suggestion. Do not edit anything.`,
    },
    {
        key: 'coverage',
        prompt: `You are a COVERAGE auditor (read-only). The reskin added src/assets/styles/notion.css for global Vuetify overrides. In ${ROOT}, enumerate Vuetify components actually used by the app (grep '<v-' across src --include=*.vue | sort -u) and check each has adequate Notion styling in notion.css or via theme vars. Especially: v-treeview (files page), v-data-table (gcode files/history), v-date-picker, v-file-input, v-carousel, v-timeline, v-stepper, v-simple-table, v-bottom-sheet, v-system-bar, v-slider, v-scale-editor? (report what exists), v-progress-circular, v-sparkline? Also check TheEditor.vue dialog, Console.vue, TheSettingsMenu.vue and pages/Files.vue for inline styles that fight the new theme (hardcoded colors in their <style> blocks). Report the visually-broken-or-unstyled spots with file+issue+severity+suggestion. Do not edit anything.`,
    },
]

const reviews = await parallel(
    REVIEWERS.map((r) => () => agent(r.prompt, { label: `review:${r.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }))
)

const allFindings = reviews.filter(Boolean).flatMap((r) => r.findings)
const actionable = allFindings.filter((f) => f.severity !== 'low')
log(`Review: ${allFindings.length} findings, ${actionable.length} actionable (medium/high)`)

phase('Fix')
let fix = null
if (actionable.length > 0) {
    fix = await agent(
        `${CONTEXT}
You are the FIX agent with cross-lane permission over all styling files (never logic). Auditors found these issues after the reskin (JSON):
${JSON.stringify(actionable, null, 2)}

For each: verify it's real (auditors can be wrong — skip false positives with a note), then fix it. Rules: styling-only, keep both themes working, prefer editing notion.css for global concerns, run npx prettier --write on files you touch, then run npm run lint AND npx vite build — both must pass. Return summary (what fixed, what skipped+why) + filesChanged + notesForReview.`,
        { label: 'fix:apply-gaps', phase: 'Fix', schema: IMPL_SCHEMA }
    )
} else {
    log('No actionable findings — skipping fix phase')
}

return {
    implementation: impls.map((i) => i.summary),
    build,
    findings: allFindings,
    fix: fix ? { summary: fix.summary, files: fix.filesChanged, notes: fix.notesForReview } : null,
}
