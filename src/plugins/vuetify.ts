import Vue from 'vue'
import Vuetify from 'vuetify'
import { Touch, Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
    directives: { Touch, Ripple },
})

export default new Vuetify({
    theme: {
        dark: true,
        themes: {
            dark: {
                primary: '#C9A227',
                anchor: '#D9B94E',
                secondary: '#8E9AAD',
                accent: '#F4E3A6',
                error: '#E5484D',
                info: '#5B86E5',
                success: '#3AA76D',
                warning: '#F4A340',
                surface: '#1C1F24',
                background: '#121417',
            },
            light: {
                primary: '#B5922A',
                anchor: '#B5922A',
                secondary: '#6F7A8C',
                accent: '#CBB472',
                error: '#D64545',
                info: '#4D77D9',
                success: '#2F9E5F',
                warning: '#E8922E',
                surface: '#FFFFFF',
                background: '#F4F5F7',
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
