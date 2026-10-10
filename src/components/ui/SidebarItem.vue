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
.menu-item-icon {
    transition: color 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-item-title {
    font-size: 14px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0.2px;
}
</style>
