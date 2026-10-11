<template>
    <v-card
        :class="'panel ' + cardClass + ' ' + (marginBottom ? 'mb-3 mb-md-6' : '') + ' ' + (!expand ? 'expanded' : '')"
        :loading="loading">
        <v-toolbar
            flat
            dense
            :color="toolbarColor"
            :class="getToolbarClass"
            :height="panelToolbarHeight"
            class="panel-toolbar"
            :style="additionalStyle">
            <slot name="buttons-left" />
            <v-toolbar-title class="d-flex align-center panel-title">
                <slot v-if="hasIconSlot" name="icon" />
                <span v-if="icon !== null && !hasIconSlot && isEmoji(icon)" class="panel-emoji-icon">{{ icon }}</span>
                <v-icon v-else-if="icon !== null && !hasIconSlot" left class="panel-icon">{{ icon }}</v-icon>
                <span v-if="title" class="subheading">{{ title }}</span>
            </v-toolbar-title>
            <slot name="buttons-title" />
            <v-spacer />
            <v-toolbar-items v-show="hasButtonsSlot || collapsible">
                <div v-if="expand || !hideButtonsOnCollapse" class="d-flex align-center">
                    <slot name="buttons" />
                </div>
                <v-btn v-if="collapsible" icon class="btn-collapsible" :ripple="true" @click="expand = !expand">
                    <span class="panel-chevron" :class="expand ? '' : 'icon-rotate-90'">▼</span>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <v-expand-transition>
            <div v-show="expand || !collapsible">
                <slot />
            </div>
        </v-expand-transition>
    </v-card>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { panelToolbarHeight } from '@/store/variables'
import { TranslateResult } from 'vue-i18n'

function isEmoji(str: string): boolean {
    if (!str) return false
    // MDI icons start with 'mdi' or are SVG paths
    if (str.startsWith('mdi')) return false
    if (str.startsWith('<svg')) return false
    if (str.startsWith('/')) return false
    // Check if it's an emoji - simple check: length <= 4 chars and not a word
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F004}\u{1F0CF}\u{23F0}\u{23F3}\u{23E9}-\u{23F3}\u{231A}\u{231B}\u{3030}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2934}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{303D}\u{3297}\u{3299}]/u
    return emojiRegex.test(str) || (str.length <= 4 && !/^[a-zA-Z-]+$/.test(str))
}

@Component
export default class Panel extends Mixins(BaseMixin) {
    panelToolbarHeight = panelToolbarHeight

    @Prop({ default: null }) declare readonly icon: string | null
    @Prop({ required: true, default: '' }) declare readonly title: string | TranslateResult
    @Prop({ default: false }) declare readonly collapsible: boolean
    @Prop({ required: true }) declare readonly cardClass: string
    @Prop({ default: '' }) declare readonly toolbarColor: string
    @Prop({ default: '' }) declare readonly toolbarClass: string
    @Prop({ default: false }) declare readonly loading: boolean
    @Prop({ default: true }) declare readonly marginBottom: boolean
    @Prop({ required: false, default: false }) declare readonly hideButtonsOnCollapse: boolean

    isEmoji(str: string): boolean {
        return isEmoji(str)
    }

    get expand() {
        return this.$store.getters['gui/getPanelExpand'](this.cardClass, this.viewport)
    }

    set expand(newVal) {
        this.$store.dispatch('gui/saveExpandPanel', { name: this.cardClass, value: newVal, viewport: this.viewport })
    }

    get hasIconSlot() {
        return !!this.$slots.icon
    }

    get hasButtonsSlot() {
        return !!this.$slots.buttons
    }

    get getToolbarClass() {
        let output = this.toolbarClass

        if (this.collapsible) output += ' collapsible'

        return output
    }

    get additionalStyle() {
        return this.$vuetify.theme.dark ? '' : 'border-bottom: 0.5px solid rgba(0, 0, 0, 0.06)'
    }
}
</script>

<style scoped>
.expanded header.v-toolbar {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}

.btn-collapsible > * {
    will-change: transform;
    transition: transform 500ms;
}
.icon-rotate-90 {
    transform: rotate(90deg);
}

.panel-chevron {
    font-size: 10px;
    opacity: 0.6;
    display: inline-block;
    line-height: 1;
}

.panel-toolbar {
    overflow-y: hidden;
}

.panel-title {
    font-weight: 600;
}

.panel-icon {
    font-size: 20px !important;
}

.panel-emoji-icon {
    font-size: 17px;
    line-height: 1;
    display: inline-block;
    margin-right: 6px;
}

::v-deep .panel-toolbar .v-btn {
    height: 100% !important;
    max-height: none;
    border-radius: 6px !important;
}
</style>

<style>
.v-card.panel .v-toolbar__content {
    padding-right: 0;
}
.v-card.panel .v-toolbar__content .subheading {
    user-select: none;
    font-size: 13px !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
}
.panel-toolbar .v-btn.v-btn--icon {
    width: var(--panel-toolbar-icon-btn-width) !important;
}
</style>
