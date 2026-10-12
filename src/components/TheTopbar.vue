<template>
    <div>
        <v-app-bar app elevate-on-scroll flat :height="topbarHeight" class="topbar pa-0" clipped-left>
            <v-app-bar-nav-icon tile class="topbar-nav-icon" @click.stop="naviDrawer = !naviDrawer" />
            <router-link to="/" class="topbar-logo-link">
                <inline-svg v-if="sidebarLogo && isSvgLogo" :src="sidebarLogo" :class="logoClasses" />
                <img v-else-if="sidebarLogo" :src="sidebarLogo" :class="logoClasses" alt="Logo" />
                <mainsail-logo v-else :color="logoColor" :class="logoClasses" router to="/" :ripple="false" />
            </router-link>
            <v-toolbar-title class="topbar-title text-no-wrap ml-0 pl-2 mr-2">{{ printerName }}</v-toolbar-title>
            <printer-selector v-if="countPrinters" />
            <v-spacer />
            <input
                ref="fileUploadAndStart"
                type="file"
                :accept="gcodeInputFileAccept.join(', ')"
                style="display: none"
                @change="uploadAndStart" />
            <v-btn
                v-if="showSaveConfigButton"
                tile
                :icon="$vuetify.breakpoint.smAndDown"
                :text="$vuetify.breakpoint.mdAndUp"
                color="primary"
                class="button-min-width-auto px-2 d-none d-sm-flex save-config-button topbar-action-btn"
                :disabled="printerIsPrinting"
                :loading="loadings.includes('topbarSaveConfig')"
                @click="saveConfig">
                <v-icon class="d-md-none">{{ mdiContentSave }}</v-icon>
                <span class="d-none d-md-inline">{{ $t('App.TopBar.SAVE_CONFIG') }}</span>
            </v-btn>
            <v-btn
                v-if="boolShowUploadAndPrint"
                tile
                :icon="$vuetify.breakpoint.smAndDown"
                :text="$vuetify.breakpoint.mdAndUp"
                color="primary"
                class="button-min-width-auto px-2 d-none d-sm-flex upload-and-start-button topbar-action-btn"
                :loading="loadings.includes('btnUploadAndStart')"
                @click="btnUploadAndStart">
                <v-icon class="mr-md-2">{{ mdiFileUpload }}</v-icon>
                <span class="d-none d-md-inline">{{ $t('App.TopBar.UploadPrint') }}</span>
            </v-btn>
            <v-btn
                v-if="klippyIsConnected"
                tile
                :icon="$vuetify.breakpoint.smAndDown"
                :text="$vuetify.breakpoint.mdAndUp"
                color="error"
                class="button-min-width-auto px-2 emergency-button topbar-danger-btn"
                :loading="loadings.includes('topbarEmergencyStop')"
                @click="btnEmergencyStop">
                <v-icon class="mr-md-2">{{ mdiAlertOctagonOutline }}</v-icon>
                <span class="d-none d-md-inline">{{ $t('App.TopBar.EmergencyStop') }}</span>
            </v-btn>
            <the-notification-menu />
            <the-settings-menu />
            <the-top-corner-menu />
        </v-app-bar>
        <v-snackbar v-model="uploadSnackbar.status" :timeout="-1" fixed right bottom>
            <strong>{{ $t('App.TopBar.Uploading') }} {{ uploadSnackbar.filename }}</strong>
            <br />
            {{ Math.round(uploadSnackbar.percent) }} % @ {{ formatFilesize(Math.round(uploadSnackbar.speed)) }}/s
            <br />
            <v-progress-linear class="mt-2" :value="uploadSnackbar.percent"></v-progress-linear>
            <template #action="{ attrs }">
                <v-btn color="red" text v-bind="attrs" style="min-width: auto" @click="cancelUpload">
                    <v-icon class="0">{{ mdiClose }}</v-icon>
                </v-btn>
            </template>
        </v-snackbar>
        <emergency-stop-dialog v-model="showEmergencyStopDialog" />
    </div>
</template>

<script lang="ts">
import { Mixins, Ref } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { validGcodeExtensions } from '@/store/variables'
import Component from 'vue-class-component'
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'
import { formatFilesize } from '@/plugins/helpers'
import TheTopCornerMenu from '@/components/TheTopCornerMenu.vue'
import TheSettingsMenu from '@/components/TheSettingsMenu.vue'
import Panel from '@/components/ui/Panel.vue'
import PrinterSelector from '@/components/ui/PrinterSelector.vue'
import MainsailLogo from '@/components/ui/MainsailLogo.vue'
import TheNotificationMenu from '@/components/notifications/TheNotificationMenu.vue'
import { topbarHeight } from '@/store/variables'
import { mdiAlertOctagonOutline, mdiContentSave, mdiFileUpload, mdiClose, mdiCloseThick } from '@mdi/js'
import EmergencyStopDialog from '@/components/dialogs/EmergencyStopDialog.vue'
import InlineSvg from 'vue-inline-svg'
import ThemeMixin from '@/components/mixins/theme'

type uploadSnackbar = {
    status: boolean
    filename: string
    percent: number
    speed: number
    total: number
    cancelTokenSource: CancelTokenSource | null
}

@Component({
    components: {
        EmergencyStopDialog,
        InlineSvg,
        Panel,
        TheSettingsMenu,
        TheTopCornerMenu,
        PrinterSelector,
        MainsailLogo,
        TheNotificationMenu,
    },
})
export default class TheTopbar extends Mixins(BaseMixin, ThemeMixin) {
    mdiAlertOctagonOutline = mdiAlertOctagonOutline
    mdiContentSave = mdiContentSave
    mdiFileUpload = mdiFileUpload
    mdiClose = mdiClose
    mdiCloseThick = mdiCloseThick

    topbarHeight = topbarHeight

    showEmergencyStopDialog = false

    uploadSnackbar: uploadSnackbar = {
        status: false,
        filename: '',
        percent: 0,
        speed: 0,
        total: 0,
        cancelTokenSource: null,
    }

    formatFilesize = formatFilesize

    @Ref() readonly fileUploadAndStart!: HTMLInputElement

    get gcodeInputFileAccept() {
        if (this.isIOS) return []

        return validGcodeExtensions
    }

    get naviDrawer() {
        return this.$store.state.naviDrawer
    }

    set naviDrawer(newVal) {
        this.$store.dispatch('setNaviDrawer', newVal)
    }

    get currentPage() {
        return this.$route.fullPath
    }

    get saveConfigPending() {
        return this.$store.state.printer.configfile?.save_config_pending ?? false
    }

    get hideSaveConfigForBedMash() {
        return this.$store.state.gui.uiSettings.hideSaveConfigForBedMash ?? false
    }

    get showSaveConfigButton() {
        if (!this.klipperReadyForGui) return false
        if (!this.hideSaveConfigForBedMash) return this.saveConfigPending

        let pendingKeys = Object.keys(this.$store.state.printer.configfile?.save_config_pending_items ?? {})
        pendingKeys = pendingKeys.filter((key: string) => !key.startsWith('bed_mesh '))

        return pendingKeys.length > 0
    }

    get printerName(): string {
        if (this.$store.state.gui.general.printername.length) return this.$store.state.gui.general.printername

        return this.$store.state.printer.hostname
    }

    get countPrinters() {
        return this.$store.getters['farm/countPrinters']
    }

    get boolHideUploadAndPrintButton() {
        return this.$store.state.gui.uiSettings.boolHideUploadAndPrintButton ?? false
    }

    get isSvgLogo() {
        return this.sidebarLogo.includes('.svg?timestamp=') || this.sidebarLogo.endsWith('.svg')
    }

    get logoColor(): string {
        return this.$store.state.gui.uiSettings.logo
    }

    get logoClasses() {
        return ['nav-logo', 'ml-2', 'mr-1', 'd-none', 'd-sm-flex']
    }

    get boolShowUploadAndPrint() {
        return (
            this.klippyIsConnected &&
            this.existGcodesRootDirectory &&
            ['standby', 'complete', 'cancelled'].includes(this.printer_state) &&
            !this.boolHideUploadAndPrintButton
        )
    }

    get defaultNavigationStateSetting() {
        return this.$store.state.gui?.uiSettings?.defaultNavigationStateSetting ?? 'alwaysOpen'
    }

    mounted() {
        //this.naviDrawer = this.$vuetify.breakpoint.lgAndUp
        switch (this.defaultNavigationStateSetting) {
            case 'alwaysClosed':
                this.naviDrawer = false
                break

            case 'lastState':
                this.naviDrawer = (localStorage.getItem('naviDrawer') ?? 'true') === 'true'
                break

            default:
                this.naviDrawer = this.$vuetify.breakpoint.lgAndUp
        }
    }

    btnEmergencyStop() {
        const confirmOnEmergencyStop = this.$store.state.gui.uiSettings.confirmOnEmergencyStop
        if (confirmOnEmergencyStop) {
            this.showEmergencyStopDialog = true
            return
        }

        this.emergencyStop()
    }

    emergencyStop() {
        this.showEmergencyStopDialog = false
        this.$socket.emit('printer.emergency_stop', {}, { loading: 'topbarEmergencyStop' })
    }

    saveConfig() {
        this.$store.dispatch('server/addEvent', { message: 'SAVE_CONFIG', type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: 'SAVE_CONFIG' }, { loading: 'topbarSaveConfig' })
    }

    btnUploadAndStart() {
        this.fileUploadAndStart?.click()
    }

    async uploadAndStart() {
        if (!this.fileUploadAndStart?.files?.length) return

        await this.$store.dispatch('socket/addLoading', { name: 'btnUploadAndStart' })
        const successFiles = []
        for (const file of this.fileUploadAndStart.files) {
            const result = await this.doUploadAndStart(file)
            successFiles.push(result)
        }

        await this.$store.dispatch('socket/removeLoading', { name: 'btnUploadAndStart' })
        for (const file of successFiles) {
            const text = this.$t('App.TopBar.UploadOfFileSuccessful', { file: file }).toString()
            this.$toast.success(text)
        }

        this.fileUploadAndStart.value = ''
        if (this.currentPage !== '/') await this.$router.push('/')
    }

    doUploadAndStart(file: File) {
        const formData = new FormData()
        const filename = file.name

        this.uploadSnackbar.filename = filename
        this.uploadSnackbar.status = true
        this.uploadSnackbar.percent = 0
        this.uploadSnackbar.speed = 0

        formData.append('file', file, filename)
        formData.append('print', 'true')

        return new Promise((resolve) => {
            this.uploadSnackbar.cancelTokenSource = axios.CancelToken.source()
            axios
                .post(this.apiUrl + '/server/files/upload', formData, {
                    cancelToken: this.uploadSnackbar.cancelTokenSource.token,
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                        this.uploadSnackbar.percent = (progressEvent.progress ?? 0) * 100
                        this.uploadSnackbar.speed = progressEvent.rate ?? 0
                        this.uploadSnackbar.total = progressEvent.total ?? 0
                    },
                })
                .then((result) => {
                    this.uploadSnackbar.status = false
                    resolve(result.data.result)
                })
                .catch(() => {
                    this.uploadSnackbar.status = false
                    this.$store.dispatch('socket/removeLoading', { name: 'btnUploadAndStart' })
                    const text = this.$t('App.TopBar.CannotUploadTheFile').toString()
                    this.$toast.error(text)
                })
        })
    }

    cancelUpload(): void {
        this.uploadSnackbar.cancelTokenSource?.cancel()
        this.uploadSnackbar.status = false
    }
}
</script>

<style scoped>
/* ------------------------------------------------------------------ *
 * TOPBAR — Notion reskin (styling only, no logic/behaviour changes)
 *
 * Colors + geometry come from the --notion-* tokens declared in
 * src/assets/styles/notion.css (GLOBAL agent) so light & dark resolve
 * automatically; every token has the literal Notion value as fallback.
 *
 * Notes for the notion.css owner (global rules that do NOT belong here):
 *   - disable the Vuetify ripple (hide .v-ripple__container)
 *   - generic .v-toolbar / .v-btn / .v-menu__content / .v-dialog / .v-snackbar
 * Everything below is anchored on ".topbar", so it can never leak into the
 * dropdowns & dialogs opened from this bar (they render portalled outside).
 * ------------------------------------------------------------------ */

/* ---------- the bar itself: flat surface + hairline, never elevated ---------- */
.topbar {
    /*noinspection CssUnresolvedCustomProperty*/
    background-color: var(--notion-content-bg, #ffffff) !important;
    /*noinspection CssUnresolvedCustomProperty*/
    border-bottom: 1px solid var(--notion-border, #ededec);
    box-shadow: none !important;
}

/* safety net in case the content token is missing in dark mode.
   Dual anchor: Vuetify always puts the theme class on .v-application, while
   App.vue only writes html.className from the non-immediate mode watcher. */
html.theme--dark .topbar,
.v-application.theme--dark .topbar {
    background-color: #191919 !important;
    border-bottom-color: #2f2f2f;
}

/* Notion bars are flat: the hairline above already separates bar and
   content, so no Vuetify elevation — also not after scrolling (the app bar
   is rendered with `flat` for the same reason) */
.topbar.v-app-bar.v-toolbar,
.topbar.v-app-bar--is-scrolled {
    box-shadow: none !important;
}

/* keep the content row inside the 1px hairline (height prop stays 48) */
/*noinspection CssUnusedSymbol*/
.topbar ::v-deep .v-toolbar__content {
    height: 100% !important;
    padding: 0 8px !important;
}

/* ---------- logo + page title (breadcrumb style) ---------- */
.topbar ::v-deep .topbar-logo-link {
    display: flex;
    align-items: center;
    color: inherit;
    text-decoration: none;
}

.topbar ::v-deep .nav-logo {
    width: auto !important;
    height: 24px !important;
}

/*noinspection CssUnusedSymbol*/
.topbar-title {
    font-size: 14px !important;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: normal;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--notion-text, #37352f);
}

/* printer selector chevron next to the title */
.topbar ::v-deep .nav-arrow {
    font-size: 18px;
    height: 18px;
    width: 18px;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--notion-text-gray, #9b9a97);
}

/* ---------- buttons: small, flat, sentence case ---------- */
.topbar ::v-deep .v-btn {
    /*noinspection CssUnresolvedCustomProperty*/
    height: var(--notion-control-height, 30px) !important;
    /*noinspection CssUnresolvedCustomProperty*/
    min-height: var(--notion-control-height, 30px);
    margin: 0 1px;
    /*noinspection CssUnresolvedCustomProperty*/
    border-radius: var(--notion-radius-control, 6px) !important;
    box-shadow: none !important;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: normal;
    text-indent: 0;
    text-transform: none;
}

/* Notion hover = subtle flat tint, no sticky focus tint, no elevation */
.topbar ::v-deep .v-btn:focus::before {
    opacity: 0;
}

.topbar ::v-deep .v-btn:hover::before {
    opacity: 0.07;
}

.topbar ::v-deep .v-btn:active::before,
.topbar ::v-deep .v-btn.v-btn--active::before {
    opacity: 0.14;
}

.topbar ::v-deep .v-btn:focus-visible {
    outline: 2px solid rgba(35, 131, 226, 0.5);
    outline-offset: 1px;
}

/* icon buttons (sidebar toggle, notifications, settings, power, …) */
.topbar ::v-deep .v-btn.v-btn--icon {
    /*noinspection CssUnresolvedCustomProperty*/
    width: var(--notion-control-height, 30px) !important;
    /*noinspection CssUnresolvedCustomProperty*/
    height: var(--notion-control-height, 30px) !important;
    min-width: 0 !important;
    padding: 0 !important;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--notion-text-secondary, #787774);
}

.topbar ::v-deep .v-btn.v-btn--icon .v-icon {
    font-size: 18px;
    height: 18px;
    width: 18px;
    color: inherit;
}

/* Vuetify pulls the first/last icon button of a toolbar out of the
   indentation — not wanted inside a hairline bordered bar */
.topbar ::v-deep .v-btn.v-btn--icon:first-child,
.topbar ::v-deep .v-btn.v-btn--icon:last-child {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

.topbar ::v-deep .v-btn.v-btn--icon.topbar-nav-icon {
    margin-right: 4px !important;
}

/* text actions (save config / upload & print) — quiet accent links */
.topbar ::v-deep .v-btn.topbar-action-btn {
    background-color: transparent !important;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--notion-accent, #2383e2) !important;
    white-space: nowrap;
}

.topbar ::v-deep .v-btn.topbar-action-btn .v-icon {
    color: inherit;
    font-size: 16px;
    height: 16px;
    width: 16px;
}

/*noinspection CssUnusedSymbol*/
.topbar ::v-deep .v-btn.topbar-action-btn.v-btn--disabled {
    background-color: transparent !important;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--notion-text-disabled, #9b9a97) !important;
}

/* emergency stop — stays the one loud control in the bar */
.topbar ::v-deep .v-btn.topbar-danger-btn {
    /*noinspection CssUnresolvedCustomProperty*/
    background-color: var(--notion-error, #eb5757) !important;
    /*noinspection CssUnresolvedCustomProperty*/
    border-color: var(--notion-error, #eb5757) !important;
    color: #ffffff !important;
    font-weight: 500;
}

.topbar ::v-deep .v-btn.topbar-danger-btn .v-icon {
    color: #ffffff;
    font-size: 16px;
    height: 16px;
    width: 16px;
}

/* ---------- notification badge: small status chip ---------- */
.topbar ::v-deep .v-badge__badge {
    height: 16px;
    min-width: 16px;
    padding: 0 4px;
    /*noinspection CssUnresolvedCustomProperty*/
    border-radius: var(--notion-radius-chip, 4px);
    font-size: 10px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: normal;
}

.topbar ::v-deep .v-badge--overlap .v-badge__badge {
    top: -8px;
    right: -6px;
}

/* ------------------------------------------------------------------ *
 * original layout fixes (kept)
 * ------------------------------------------------------------------ */
.button-min-width-auto {
    min-width: auto !important;
}

/*noinspection CssUnusedSymbol*/
@media (min-width: 768px) {
    header.topbar {
        z-index: 8 !important;
    }
}
</style>
