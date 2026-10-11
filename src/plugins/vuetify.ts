import Vue from 'vue'
import Vuetify from 'vuetify'
import { Touch, Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
    directives: { Touch, Ripple },
})

export default new Vuetify({
    theme: {
        dark: false,
        options: { customProperties: true },
        themes: {
            dark: {
                primary: '#007AFF',
                accent: '#5AC8FA',
                secondary: '#5856D6',
                success: '#30D158',
                warning: '#FF9F0A',
                error: '#FF453A',
                info: '#64D2FF',
                background: '#1C1C1E',
                surface: '#2C2C2E',
                'surface-variant': '#3A3A3C',
                'on-surface': '#FFFFFF',
                'surface-light': '#48484A',
                'primary-container': '#0A84FF',
                toolbar: '#2C2C2EE6',
                sidebar: '#1C1C1EE6',
                card: '#2C2C2E',
            },
            light: {
                primary: '#007AFF',
                accent: '#007AFF',
                secondary: '#5856D6',
                success: '#34C759',
                warning: '#FF9500',
                error: '#FF3B30',
                info: '#5AC8FA',
                background: '#F5F5F7',
                surface: '#FFFFFF',
                'surface-variant': '#E5E5EA',
                'on-surface': '#1C1C1E',
                'surface-light': '#F2F2F7',
                'primary-container': '#E8F4FD',
                toolbar: '#FFFFFF',
                sidebar: '#F5F5F7F2',
                card: '#FFFFFF',
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
