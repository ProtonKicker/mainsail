<template>
    <div>
        <v-tooltip right :open-delay="500" :disabled="navigationStyle !== 'iconsOnly'">
            <template #activator="{ on, attrs }">
                <v-list-item
                    :router="to !== undefined"
                    :to="to"
                    :href="href"
                    :target="target"
                    :class="itemClass"
                    v-bind="attrs"
                    v-on="on">
                    <v-list-item-icon class="my-3 mr-3 menu-item-icon">
                        <v-icon>{{ icon }}</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title tile class="menu-item-title">
                            {{ title }}
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </template>
            <span>{{ title }}</span>
        </v-tooltip>
        <v-divider v-if="borderBottom" class="my-1" />
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { NaviPoint } from '@/components/mixins/navigation'

@Component
export default class SidebarItem extends Mixins(BaseMixin) {
    @Prop({ type: Object, required: true }) item!: NaviPoint

    get navigationStyle() {
        return this.$store.state.gui.uiSettings.navigationStyle
    }

    get icon() {
        return this.item.icon
    }

    get title() {
        return this.item.title
    }

    get to() {
        return this.item.to ?? undefined
    }

    get href() {
        return this.item.href ?? undefined
    }

    get target() {
        return this.item.target ?? undefined
    }

    get borderBottom() {
        return this.item.to === '/allPrinters'
    }

    get isActive(): boolean {
        if (this.item.target === '_blank' || !this.item.to) return false

        return this.$route.path === this.item.to
    }

    get itemClass() {
        return {
            'small-list-item': true,
            'active-nav-item': this.isActive,
        }
    }
}
</script>

<style scoped>
/**
 * Intentionally tiny.
 * Row size, radius, hover/selected fills and the 14px/500 label are shared with
 * every other list in the app and therefore belong to notion.css; the sidebar
 * specifics (16px marks, ink, `.active-nav-item` selected state, icons-only
 * rail, legacy `nav ul.navi`) live in src/assets/styles/sidebar.css, which also
 * styles the rows TheSidebar.vue renders and can out-specify both Vuetify and
 * notion.css from a single place.
 *
 * Only the local gutter of this component's own markup is kept here: the
 * template ships the `my-3` / `mr-3` utilities, which are !important.
 */
.active-nav-item {
    /* selected row = flat fill + heavier label, not the old 4px primary bar */
    border-right: 0;
}

.v-list-item__icon.menu-item-icon {
    margin: 0 8px 0 0 !important;
}
</style>
