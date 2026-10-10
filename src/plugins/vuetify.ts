import Vue from 'vue'
import Vuetify from 'vuetify'
import { Touch, Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
    directives: { Touch, Ripple },
})

/*
 * Cupertino theme — Apple's iOS system palette (SwiftUI / HIG).
 * Forced to light mode by the app (App.vue) so the UI reads as a native
 * Apple application: pure white grouped surfaces, frosted materials and
 * the Apple system accent colors.
 */
export default new Vuetify({
    theme: {
        dark: false,
        themes: {
            light: {
                // Apple system colors (light mode)
                primary: '#007AFF', // systemBlue
                anchor: '#007AFF',
                secondary: '#8E8E93', // systemGray
                accent: '#FF9500', // systemOrange
                error: '#FF3B30', // systemRed
                info: '#5856D6', // systemIndigo
                success: '#34C759', // systemGreen
                warning: '#FF9500', // systemOrange
                surface: '#FFFFFF',
                background: '#F2F2F7', // iOS systemGroupedBackground
            },
            dark: {
                primary: '#0A84FF',
                anchor: '#0A84FF',
                secondary: '#98989D',
                accent: '#FF9F0A',
                error: '#FF453A',
                info: '#5E5CE6',
                success: '#30D158',
                warning: '#FF9F0A',
                surface: '#1C1C1E',
                background: '#000000',
            },
        },
        options: { customProperties: true },
    },
    icons: {
        iconfont: 'mdiSvg',
    },
    breakpoint: {
        mobileBreakpoint: 768,
    },
})