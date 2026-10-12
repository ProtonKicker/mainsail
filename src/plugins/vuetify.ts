import Vue from 'vue'
import Vuetify from 'vuetify'
import { Touch, Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
    directives: { Touch, Ripple },
})

/**
 * NOTION DESIGN TOKENS
 * -----------------------------------------------------------------------------
 * `options.customProperties: true` turns every key below into a CSS custom
 * property named `--v-<key>-base` (plus `-lighten1..5` / `-darken1..4`
 * variations), e.g. `--v-notionsidebar-base`, `--v-notiontextgray-base`.
 * NOTE for the notion.css owner: Vuetify 2.7 emits `--v-<key>-base`,
 * NOT `--v-theme-<key>`. The `:root` block is regenerated on every
 * light/dark switch, so the vars always describe the active theme.
 *
 * IMPORTANT: for every key Vuetify also generates a color utility class
 * `.v-application .<key> { background-color + border-color: ... !important }`.
 * Short palette names therefore collide with real class names in this app
 * (`panel` is on every dashboard card, `toolbar` is used as a bare class in
 * TheSelectPrinterDialog, and `text`/`border`/`surface`/`sidebar` are plausible
 * utility tokens). That is why every non-standard key below carries the
 * `notion` prefix: they can never be emitted as a stray class. Style consumers
 * read them through the `--notion-*` tokens in src/assets/styles/notion.css.
 *
 * `anchor` is used by Vuetify for `.v-application a`.
 * Only hex colors are allowed here (they are parsed into int/LAB variations),
 * so rgba hover states stay in CSS, not in this palette.
 *
 * Caveat for `primary`: App.vue has `@Watch('primaryColor')` (not immediate)
 * which writes the persisted `uiSettings.primary` into `currentTheme.primary`,
 * so a user accent customisation replaces the values below after the websocket
 * delivers it. Users who never touched the accent keep the per-theme defaults.
 */
export default new Vuetify({
    theme: {
        dark: false,
        options: { customProperties: true },
        themes: {
            /* The light theme cannot reuse the dark palette byte for byte: these
               keys are consumed as *ink* (`error--text` console `!! ` lines,
               `primary--text` buttons/links, `v-messages`, AFC + maintenance
               readouts) and as the fill behind a white button label. The bright
               Notion set (primary #2383e2, error #eb5757, warning #dfab01,
               success #4dab9a) only reaches 2.1-3.9:1 on #ffffff, so each one is
               stepped down for the light canvas only; dark keeps the bright set
               because it reads correctly on #191919/#202020. notion.css tokens
               read these through `--v-*-base`, so they follow automatically.
               Ratios against #ffffff / #f7f6f3 (code + sidebar surface):
               primary #1a73d1 4.75/4.4, error #c53737 5.28/4.89,
               warning #9c6f00 4.48/4.15 (icons and fills), success #2f7f6f
               4.79/4.43. */
            light: {
                primary: '#1a73d1',
                secondary: '#787774',
                accent: '#1a73d1',
                error: '#c53737',
                info: '#1a73d1',
                success: '#2f7f6f',
                warning: '#9c6f00',
                anchor: '#1a73d1',
                notionbackground: '#ffffff',
                notionsidebar: '#f7f6f3',
                notionsurface: '#ffffff',
                notionpanel: '#ffffff',
                notiontoolbar: '#ffffff',
                notiontext: '#37352f',
                notiontextsecondary: '#787774',
                notiontextgray: '#9b9a97',
                notionborder: '#ededec',
                /* Document scrollbar thumb. Only hex is allowed here, so these
                   are the flattened composites of the Notion rgba thumbs
                   (light rgba(15,15,15,.35)/.5 over #ffffff,
                   dark rgba(255,255,255,.28)/.42 over #191919). They live in the
                   palette because Vuetify regenerates `:root` on every theme
                   change, which is the only channel that reaches <html> — the
                   window gutter thumb would otherwise keep the light value on a
                   dark boot, since `<html>` never inherits from .v-application
                   and App.vue's mode watcher is not immediate. */
                notionscrollbarthumb: '#ababab',
                notionscrollbarthumbhover: '#878787',
            },
            dark: {
                primary: '#2383e2',
                secondary: '#9b9b9b',
                accent: '#2383e2',
                error: '#eb5757',
                info: '#2383e2',
                success: '#4dab9a',
                warning: '#dfab01',
                anchor: '#2383e2',
                notionbackground: '#191919',
                notionsidebar: '#202020',
                notionsurface: '#202020',
                notionpanel: '#202020',
                notiontoolbar: '#272727',
                notiontext: '#d4d4d4',
                notiontextsecondary: '#9b9b9b',
                notiontextgray: '#8f8f8f',
                notionborder: '#2f2f2f',
                /* flattened composites of rgba(255,255,255,.28) / .42 over
                   #191919 — see the light palette for why the document gutter
                   thumb has to live in the palette instead of in CSS only */
                notionscrollbarthumb: '#595959',
                notionscrollbarthumbhover: '#7a7a7a',
            },
        },
    },
    icons: {
        iconfont: 'mdiSvg',
    },
    breakpoint: {
        mobileBreakpoint: 768,
    },
})
