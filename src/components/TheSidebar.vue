<template>
    <v-navigation-drawer
        :key="navigationStyle"
        v-model="naviDrawer"
        :mini-variant="navigationStyle === 'iconsOnly'"
        :width="navigationWidth"
        :temporary="boolNaviTemp"
        clipped
        app
        :style="sidebarCssVars">
        <!-- Removed template #img for a clean Google Drive white look -->

        <overlay-scrollbars class="nav-scrollbar">
            <v-list class="pr-0 pt-0 ml-0">
                <!-- Google Style Hero Button -->
                <v-list-item class="px-3 pt-5 pb-4 mb-2">
                    <v-btn
                        large
                        rounded
                        elevation="0"
                        class="pc-new-button px-5"
                        color="amber darken-1"
                        @click.stop="openPrinterSelector">
                        <v-avatar size="22" class="mr-3">
                            <mainsail-logo :color="'#2a2005'" style="width: 22px; height: 22px;" />
                        </v-avatar>
                        <span class="text-subtitle-1 font-weight-medium" style="color: #2a2005; letter-spacing: 0px !important;">Pebble Cheese</span>
                    </v-btn>
                </v-list-item>

                <sidebar-item v-for="(category, index) in visibleNaviPoints" :key="index" :item="category" />
            </v-list>

            <!-- Storage-like indicator for printer status -->
            <div class="px-6 py-4 mt-auto">
                <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption grey--text text--darken-1">System Health</span>
                    <span class="text-caption grey--text text--darken-1">Stable</span>
                </div>
                <v-progress-linear
                    value="15"
                    height="4"
                    rounded
                    color="amber darken-2"
                    background-color="grey lighten-3"
                ></v-progress-linear>
                <v-btn text x-small color="primary" class="mt-4 pa-0 text-none" @click="$router.push('/machine')">
                    Manage resources
                </v-btn>
            </div>
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

    openPrinterSelector() {
        if (this.countPrinters > 1) {
            // Logic to open printer selector dialog if needed, 
            // but here we can just navigate to home or just act as a hero button
            this.$router.push('/')
        }
    }
}
</script>

<style scoped>
.no-text-decoration {
    text-decoration: none;
}

.pc-new-button {
    letter-spacing: 0.25px;
}

.nav-logo {
    height: 24px;
}

.nav-scrollbar {
    height: 100%;
}
</style>
