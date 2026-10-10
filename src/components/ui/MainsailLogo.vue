<template>
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 64 64"
        xml:space="preserve"
        aria-label="Pebble Cheese logo">
        <!-- Rounded block (wedge) of cheese with Swiss-style holes -->
        <rect x="4" y="10" width="56" height="44" rx="14" :fill="color" />
        <!-- Soft bottom thickness for a blocky look -->
        <rect x="4" y="44" width="56" height="8" rx="4" fill="rgba(0,0,0,0.18)" />
        <!-- Cheese holes -->
        <circle cx="20" cy="34" r="7" fill="rgba(0,0,0,0.22)" />
        <circle cx="42" cy="26" r="5" fill="rgba(0,0,0,0.22)" />
        <circle cx="44" cy="44" r="4" fill="rgba(0,0,0,0.22)" />
        <circle cx="26" cy="22" r="3.5" fill="rgba(0,0,0,0.22)" />
    </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '../mixins/base'
import { defaultLogoColor } from '@/store/variables'

@Component
export default class MainsailLogo extends Mixins(BaseMixin) {
    private internalColor = defaultLogoColor

    @Prop({ required: false, default: '' })
    declare readonly color: string

    @Watch('color')
    colorChanged(newVal: string) {
        this.internalColor = newVal !== '' ? newVal : defaultLogoColor
    }

    created() {
        if (this.color !== '') this.internalColor = this.color
    }
}
</script>
