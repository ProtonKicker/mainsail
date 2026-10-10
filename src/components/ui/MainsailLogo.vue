<template>
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 64 64"
        xml:space="preserve">
        <!--
            Minimal "Cupertino" mark — a rounded app-icon tile with a single
            streamed print line, rendered in the active accent color. Clean,
            monochrome and deliberately quiet, echoing Apple's app-icon language.
        -->
        <g>
            <!-- Rounded app tile -->
            <rect x="4" y="4" width="56" height="56" rx="14" :fill="color + '1A'" />
            <!-- Print bed -->
            <rect x="18" y="36" width="28" height="6" rx="3" :fill="color" />
            <!-- Extruder head / nozzle -->
            <path
                :fill="color"
                d="M32 16 a5 5 0 0 1 5 5 c0 2.1 -1.3 3.9 -3 4.7 v5.3 h-4 v-5.3 c-1.7 -0.8 -3 -2.6 -3 -4.7 a5 5 0 0 1 5 -5 z" />
            <!-- Droplet of filament deposited on the bed -->
            <circle cx="32" cy="39" r="2.4" fill="#ffffff" />
        </g>
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