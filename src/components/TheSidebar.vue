<template>
    <v-navigation-drawer
        :key="navigationStyle"
        v-model="naviDrawer"
        :mini-variant="navigationStyle === 'iconsOnly'"
        :width="navigationWidth"
        :temporary="boolNaviTemp"
        clipped
        app
        class="sidebar-drawer"
        :style="sidebarCssVars">
        <template #img>
            <v-img :src="sidebarBackground" height="100%" />
        </template>

        <overlay-scrollbars class="nav-scrollbar">
            <v-list class="pr-0 pt-0 ml-0">
                <v-list-item
                    v-if="isMobile"
                    router
                    to="/"
                    :class="mobileLogoClass"
                    :style="`height: ${topbarHeight}px`"
                    :ripple="false">
                    <img v-if="sidebarLogo" :src="sidebarLogo" :style="logoCssVars" class="nav-logo" alt="Logo" />
                    <mainsail-logo v-else :color="logoColor" :style="logoCssVars" class="nav-logo" :ripple="false" />
                    <span
                        v-if="navigationStyle !== 'iconsOnly'"
                        class="text-h6 font-weight-regular text-truncate nav-printer-name">
                        {{ printerName }}
                    </span>
                </v-list-item>
                <sidebar-item v-for="(category, index) in visibleNaviPoints" :key="index" :item="category" />
            </v-list>
        </overlay-scrollbars>
        <template #append>
            <v-list-item class="small-list-item mb-2">
                <v-list-item-icon class="menu-item-icon">
                    <about-dialog />
                </v-list-item-icon>
            </v-list-item>
        </template>
    </v-navigation-drawer>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import TheSelectPrinterDialog from '@/components/TheSelectPrinterDialog.vue'
import AboutDialog from '@/components/dialogs/AboutDialog.vue'
import { navigationWidth, topbarHeight } from '@/store/variables'
import MainsailLogo from '@/components/ui/MainsailLogo.vue'
import SidebarItem from '@/components/ui/SidebarItem.vue'
import NavigationMixin from '@/components/mixins/navigation'
import ThemeMixin from '@/components/mixins/theme'

@Component({
    components: {
        SidebarItem,
        TheSelectPrinterDialog,
        AboutDialog,
        MainsailLogo,
    },
})
export default class TheSidebar extends Mixins(NavigationMixin, BaseMixin, ThemeMixin) {
    navigationWidth = navigationWidth
    topbarHeight = topbarHeight

    get naviDrawer(): boolean {
        return this.$store.state.naviDrawer
    }

    set naviDrawer(newVal) {
        this.$store.dispatch('setNaviDrawer', newVal)
    }

    get navigationStyle() {
        return this.$store.state.gui.uiSettings.navigationStyle
    }

    get sidebarBackground(): string {
        return this.$store.getters['files/getCustomSidebarBackground'] ?? this.sidebarBgImage
    }

    get boolNaviTemp(): boolean {
        return !this.isMobile && this.$vuetify.breakpoint.mdAndDown
    }

    get sidebarCssVars(): Record<string, string> {
        if (!this.boolNaviTemp) return {}

        return {
            top: `${topbarHeight}px !important`,
            'padding-bottom': `${topbarHeight}px`,
        }
    }

    get sidebarLogo(): string {
        return this.$store.getters['files/getSidebarLogo']
    }

    get logoColor(): string {
        return this.$store.state.gui.uiSettings.logo
    }

    get printerName(): string {
        if (this.$store.state.gui.general.printername.length) return this.$store.state.gui.general.printername

        return this.$store.state.printer.hostname
    }

    get logoCssVars() {
        if (this.navigationStyle === 'iconsOnly') return {}

        return { 'margin-right': '16px' }
    }

    get mobileLogoClass() {
        return {
            'sidebar-logo': true,
            'no-text-decoration': true,
            'no-background': true,
            'no-border': true,
            'pa-0': this.navigationStyle === 'iconsOnly',
            'justify-center': this.navigationStyle === 'iconsOnly',
        }
    }
}
</script>

<style scoped>
/**
 * Workspace row + local gutters only.
 * The drawer surface, the row size/radius/hover fill and the generic label
 * typography belong to notion.css; the sidebar marks, ink, selected state and
 * the legacy `nav ul.navi` markup live in src/assets/styles/sidebar.css.
 */
.no-text-decoration {
    text-decoration: none;
    background-color: transparent;
}

.no-background:before {
    background-color: rgba(255, 255, 255, 0) !important;
}

.no-border {
    border: 0 !important;
}

/* workspace row: left aligned, no separator (its height is bound inline to the
 * topbar height by mobileLogoClass/sidebarCssVars logic, so it is not touched) */
.sidebar-drawer .v-list-item.sidebar-logo {
    padding-left: 10px;
    padding-right: 10px;
}

.nav-logo {
    height: 20px;
}

/* 8px between mark and printer name (beats the inline logoCssVars margin) */
.sidebar-logo .nav-logo {
    margin-right: 8px !important;
}

.v-navigation-drawer--mini-variant .sidebar-logo .nav-logo {
    margin-right: 0 !important;
}

/* printer name = Notion workspace title (Vuetify helpers are !important) */
.sidebar-drawer .nav-printer-name {
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: normal !important;
    line-height: 20px !important;
}

/* About entry at the bottom of the drawer: only its local gutter lives here,
 * the mark, ink and row fill come from sidebar.css / notion.css. */
.menu-item-icon {
    margin: 0 !important;
}

.nav-scrollbar {
    height: 100%;
}
</style>
