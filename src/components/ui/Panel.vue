<template>
    <v-card
        :class="'panel ' + cardClass + ' ' + (marginBottom ? 'mb-3 mb-md-6' : '') + ' ' + (!expand ? 'expanded' : '')"
        :loading="loading"
        :elevation="0">
        <v-toolbar
            flat
            dense
            :color="toolbarColor"
            :class="getToolbarClass"
            class="panel-toolbar panel-toolbar-divider"
            :height="panelToolbarHeight"
            :style="additionalStyle">
            <slot name="buttons-left" />
            <v-toolbar-title class="d-flex align-center">
                <slot v-if="hasIconSlot" name="icon" />
                <v-icon v-if="icon !== null && !hasIconSlot" left class="panel-icon">{{ icon }}</v-icon>
                <span v-if="title" class="subheading">{{ title }}</span>
            </v-toolbar-title>
            <slot name="buttons-title" />
            <v-spacer />
            <v-toolbar-items v-show="hasButtonsSlot || collapsible">
                <div v-if="expand || !hideButtonsOnCollapse" class="d-flex align-center">
                    <slot name="buttons" />
                </div>
                <v-btn v-if="collapsible" icon class="btn-collapsible" :ripple="true" @click="expand = !expand">
                    <v-icon :class="expand ? '' : 'icon-rotate-90'">{{ mdiChevronDown }}</v-icon>
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
import { mdiChevronDown } from '@mdi/js'
import { TranslateResult } from 'vue-i18n'

@Component
export default class Panel extends Mixins(BaseMixin) {
    mdiChevronDown = mdiChevronDown
    panelToolbarHeight = panelToolbarHeight

    @Prop({ default: null }) declare readonly icon: string | null
    @Prop({ required: true, default: '' }) declare readonly title: string | TranslateResult
    @Prop({ default: false }) declare readonly collapsible: boolean
    @Prop({ required: true }) declare readonly cardClass: string
    @Prop({ default: '' }) declare readonly toolbarColor: string
    @Prop({ default: '' }) declare readonly toolbarClass: string
    @Prop({ default: false }) declare readonly loading: boolean
    @Prop({ default: true }) declare readonly marginBottom: boolean
    @Prop({ default: false }) declare readonly hideButtonsOnCollapse: boolean

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

    /* Unchanged from the pre-reskin component: the header divider was drawn as an
       inline style here. It stays (script behaviour must not change) and
       .panel-toolbar-divider below overrides it with the Notion hairline. */
    get additionalStyle() {
        return this.$vuetify.theme.dark ? '' : 'border-bottom: 1px solid #A8A8A8'
    }
}
</script>

<style scoped>
/* a collapsed panel ends with its header, so the header closes the card shape */
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

.panel-toolbar {
    overflow-y: hidden;
}
</style>

<style>
/*
 * Panel = Notion "inline page" card: flat surface + hairline border, radius 8px,
 * no elevation, 14px/600 header, hairline divider under the header, small 6px buttons.
 *
 * This file owns the panel classes (.panel, .panel-toolbar, .panel-toolbar-divider,
 * .panel-icon, .btn-collapsible) and the panel scoped Vuetify overrides.
 * src/assets/styles/notion.css (GLOBAL agent) owns the generic .v-card / .v-toolbar /
 * .v-btn look; the panel rules below consume its --notion-* tokens (each with the
 * literal Notion value as fallback) and are prefixed so they always win over
 * Vuetify's own .theme--xx.v-* base rules and over .v-toolbar__items > .v-btn,
 * which forces full-height borderless buttons inside a toolbar.
 *
 * NO RULE HERE MAY DEPEND ON `html.theme--light|dark`: App.vue writes
 * html.className from a non-immediate @Watch('mode'), and because the store
 * already defaults to the same mode the watcher never fires on a normal boot, so
 * <html> carries no theme class. The --notion-* tokens are the thing that flips
 * (they are anchored on :root + .v-application.theme--* in notion.css), so each
 * rule is written once, ungated, and reads correctly in both themes.
 */

html .v-application .v-card.panel {
    background-color: var(--notion-panel-bg, #ffffff);
    border-width: 1px;
    border-style: solid;
    border-color: var(--notion-border, #ededec);
    border-radius: var(--notion-radius, 8px);
    color: var(--notion-text, #37352f);
    box-shadow: none !important;
    /* header ink lives here, ungated, so the consumed vars are always defined
       (an `html.theme--*` gate left them invalid-at-computed-value on boot and
       every header title/icon silently fell back to inherited ink) */
    --panel-header-text: var(--notion-text, #37352f);
    --panel-header-icon: var(--notion-text-muted, #757575);
}

/* clickable panels (history rows, farm printers) still need a hover affordance */
html .v-application .v-card.panel.v-card--link:hover {
    border-color: var(--notion-border-strong, #d3d1ce);
}

/* the header shares the card surface, toolbars ship a shadow in Vuetify */
html .v-application .v-card.panel .panel-toolbar {
    background-color: transparent;
    background-image: none;
    box-shadow: none !important;
    color: var(--panel-header-text, var(--notion-text, #37352f));
}

/* hairline divider below the header. !important because additionalStyle still
   writes an inline `border-bottom: 1px solid #A8A8A8` in light mode. */
html .v-application .v-card.panel .panel-toolbar-divider {
    border-bottom: 1px solid var(--notion-border, #ededec) !important;
}

/* collapsed panels are already closed by the card border, do not double the line */
html .v-application .v-card.panel.expanded .panel-toolbar.panel-toolbar-divider {
    border-bottom-color: transparent !important;
}

html .v-application .v-card.panel .v-toolbar__content {
    padding-right: 8px;
    color: var(--panel-header-text, var(--notion-text, #37352f));
}

html .v-application .v-card.panel .v-toolbar__content .subheading {
    user-select: none;
}

/* header title: 14px/600 */
html .v-application .v-card.panel .v-toolbar__title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: normal;
    line-height: 1.35;
    color: var(--panel-header-text, var(--notion-text, #37352f));
}

html .v-application .v-card.panel .v-toolbar__title .subheading {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: normal;
    line-height: 1.35;
    text-transform: none;
    color: var(--panel-header-text, var(--notion-text, #37352f));
}

/* leading header icon: 18px, muted ink (the 2.45:1 label gray fails the 3:1
   graphic minimum for a control the user has to read). Colored headers (config
   warnings, the active printer, emergency stop) keep Vuetify's own contrast. */
html .v-application .v-card.panel .panel-icon {
    flex: 0 0 auto;
    font-size: 18px;
    height: 18px;
    width: 18px;
}

html
    .v-application
    .v-card.panel
    .panel-toolbar:not(.error):not(.primary):not(.warning):not(.success):not(.info):not(.orange)
    .panel-icon {
    color: var(--panel-header-icon, var(--notion-text-muted, #757575));
}

/* header buttons: small flat controls instead of full-height tiles.
   .v-toolbar__content is part of the chain so these always outrank the
   notion.css base rules for the same element. */
html .v-application .v-card.panel .panel-toolbar .v-toolbar__content .v-btn {
    height: var(--notion-control-height, 30px) !important;
    max-height: var(--notion-control-height, 30px) !important;
    min-width: 0;
    margin-left: 4px;
    padding: 0 8px;
    border-radius: var(--notion-radius-control, 6px);
    align-self: center;
    box-shadow: none !important;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: normal;
    text-transform: none;
}

html .v-application .v-card.panel .panel-toolbar .v-toolbar__content .v-btn.v-btn--icon {
    width: var(--notion-control-height, 30px);
    min-width: var(--notion-control-height, 30px);
    padding: 0;
}

html .v-application .v-card.panel .panel-toolbar .v-toolbar__content .v-btn .v-icon {
    font-size: 18px;
    height: 18px;
    width: 18px;
}

/* collapse chevron: muted ink, darkens on hover, keeps its rotation transition */
html
    .v-application
    .v-card.panel
    .panel-toolbar:not(.error):not(.primary):not(.warning):not(.success):not(.info):not(.orange)
    .btn-collapsible
    .v-icon {
    color: var(--panel-header-icon, var(--notion-text-muted, #757575));
}

html
    .v-application
    .v-card.panel
    .panel-toolbar:not(.error):not(.primary):not(.warning):not(.success):not(.info):not(.orange)
    .btn-collapsible:hover
    .v-icon {
    color: var(--panel-header-text, var(--notion-text, #37352f));
}
</style>
