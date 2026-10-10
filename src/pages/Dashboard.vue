<template>
    <div>
        <v-row class="pc-dashboard-hero gutter-2 mb-3">
            <v-col cols="6" sm="3">
                <v-card class="pc-hero-tile pc-hero-files" :to="'/files'" router>
                    <v-card-text class="pc-hero-tile__body">
                        <div class="pc-hero-tile__icon">
                            <v-icon>{{ mdiFileDocumentMultipleOutline }}</v-icon>
                        </div>
                        <div class="pc-hero-tile__title">{{ $t('Router.G-Code Files') }}</div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="6" sm="3">
                <v-card class="pc-hero-tile pc-hero-console" :to="'/console'" router>
                    <v-card-text class="pc-hero-tile__body">
                        <div class="pc-hero-tile__icon">
                            <v-icon>{{ mdiConsoleLine }}</v-icon>
                        </div>
                        <div class="pc-hero-tile__title">{{ $t('Router.Console') }}</div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="6" sm="3">
                <v-card class="pc-hero-tile pc-hero-machine" :to="'/config'" router>
                    <v-card-text class="pc-hero-tile__body">
                        <div class="pc-hero-tile__icon">
                            <v-icon>{{ mdiWrench }}</v-icon>
                        </div>
                        <div class="pc-hero-tile__title">{{ $t('Router.Machine') }}</div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="6" sm="3">
                <v-card class="pc-hero-tile pc-hero-webcam" :to="'/cam'" router>
                    <v-card-text class="pc-hero-tile__body">
                        <div class="pc-hero-tile__icon">
                            <v-icon>{{ mdiWebcam }}</v-icon>
                        </div>
                        <div class="pc-hero-tile__title">{{ $t('Router.Webcam') }}</div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row v-if="isMobile">
            <v-col>
                <status-panel />
                <template v-for="component in mobileLayout">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-mobileLayout-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
        </v-row>
        <v-row v-else-if="isTablet">
            <v-col class="col-6">
                <status-panel />
                <template v-for="component in tabletLayout1">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-tabletLayout1-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
            <v-col class="col-6">
                <template v-for="component in tabletLayout2">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-tabletLayout2-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
        </v-row>
        <v-row v-else-if="isDesktop">
            <v-col class="col-5">
                <status-panel />
                <template v-for="component in desktopLayout1">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-desktopLayout1-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
            <v-col class="col-7">
                <template v-for="component in desktopLayout2">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-desktopLayout2-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
        </v-row>
        <v-row v-else-if="isWidescreen">
            <v-col class="col-3">
                <status-panel />
                <template v-for="component in widescreenLayout1">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-desktopLayout1-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
            <v-col class="col-5">
                <template v-for="component in widescreenLayout2">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-desktopLayout2-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
            <v-col class="col-4">
                <template v-for="component in widescreenLayout3">
                    <component
                        :is="extractPanelName(component.name)"
                        :key="'dashboard-desktopLayout3-' + component.name"
                        :panel-id="extractPanelId(component.name)"></component>
                </template>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import { mdiConsoleLine, mdiFileDocumentMultipleOutline, mdiWrench, mdiWebcam } from '@mdi/js'
import AfcPanel from '@/components/panels/AfcPanel.vue'
import ExtruderControlPanel from '@/components/panels/ExtruderControlPanel.vue'
import DashboardMixin from '@/components/mixins/dashboard'
import KlippyStatePanel from '@/components/panels/KlippyStatePanel.vue'
import LedEffectsPanel from '@/components/panels/LedEffectsPanel.vue'
import MachineSettingsPanel from '@/components/panels/MachineSettingsPanel.vue'
import MacrogroupPanel from '@/components/panels/MacrogroupPanel.vue'
import MacrosPanel from '@/components/panels/MacrosPanel.vue'
import MiniconsolePanel from '@/components/panels/MiniconsolePanel.vue'
import MinSettingsPanel from '@/components/panels/MinSettingsPanel.vue'
import MiscellaneousPanel from '@/components/panels/MiscellaneousPanel.vue'
import SpoolmanPanel from '@/components/panels/SpoolmanPanel.vue'
import MmuPanel from '@/components/panels/MmuPanel.vue'
import StatusPanel from '@/components/panels/StatusPanel.vue'
import ToolheadControlPanel from '@/components/panels/ToolheadControlPanel.vue'
import TemperaturePanel from '@/components/panels/TemperaturePanel.vue'
import WebcamPanel from '@/components/panels/WebcamPanel.vue'

@Component({
    components: {
        AfcPanel,
        ExtruderControlPanel,
        KlippyStatePanel,
        LedEffectsPanel,
        MachineSettingsPanel,
        MacrogroupPanel,
        MacrosPanel,
        MiniconsolePanel,
        MinSettingsPanel,
        MiscellaneousPanel,
        SpoolmanPanel,
        MmuPanel,
        StatusPanel,
        ToolheadControlPanel,
        TemperaturePanel,
        WebcamPanel,
    },
})
export default class PageDashboard extends Mixins(DashboardMixin) {
    mdiConsoleLine = mdiConsoleLine
    mdiFileDocumentMultipleOutline = mdiFileDocumentMultipleOutline
    mdiWrench = mdiWrench
    mdiWebcam = mdiWebcam

    get mobileLayout() {
        return this.$store.getters['gui/getPanels']('mobile', 0, true)
    }

    get tabletLayout1() {
        return this.$store.getters['gui/getPanels']('tablet', 1, true)
    }

    get tabletLayout2() {
        return this.$store.getters['gui/getPanels']('tablet', 2, true)
    }

    get desktopLayout1() {
        return this.$store.getters['gui/getPanels']('desktop', 1, true)
    }

    get desktopLayout2() {
        return this.$store.getters['gui/getPanels']('desktop', 2, true)
    }

    get widescreenLayout1() {
        return this.$store.getters['gui/getPanels']('widescreen', 1, true)
    }

    get widescreenLayout2() {
        return this.$store.getters['gui/getPanels']('widescreen', 2, true)
    }

    get widescreenLayout3() {
        return this.$store.getters['gui/getPanels']('widescreen', 3, true)
    }

    extractPanelName(name: string) {
        return name.split('_')[0] + '-panel'
    }

    extractPanelId(name: string) {
        return name.split('_')[1] ?? null
    }
}
</script>
