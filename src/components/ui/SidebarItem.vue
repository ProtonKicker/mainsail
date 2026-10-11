<template>
    <div class="sidebar-item-mac">
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
                    <v-list-item-icon class="my-2 mr-3 menu-item-icon">
                        <span class="emoji-icon">{{ icon }}</span>
                    </v-list-item-icon>
                    <v-list-item-content class="py-1">
                        <v-list-item-title class="menu-item-title">
                            {{ title }}
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </template>
            <span>{{ title }}</span>
        </v-tooltip>
        <v-divider v-if="borderBottom" class="my-1 mx-2" />
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
            'active-nav-item-mac': this.isActive,
        }
    }
}
</script>

<style scoped>
.small-list-item {
    height: var(--sidebar-menu-item-height, 32px) !important;
    min-height: 32px !important;
}

.menu-item-icon {
    opacity: 0.9;
    transition: opacity 0.12s ease;
    min-width: 24px;
    justify-content: center;
}

.emoji-icon {
    font-size: 17px;
    line-height: 1;
    display: inline-block;
}

.active-nav-item-mac .menu-item-icon {
    opacity: 1;
}

.menu-item-title {
    line-height: 18px;
    font-size: 13px;
    font-weight: 400;
    text-transform: none;
    opacity: 1;
    letter-spacing: -0.01em;
}

.active-nav-item-mac .menu-item-title {
    font-weight: 500;
}
</style>
