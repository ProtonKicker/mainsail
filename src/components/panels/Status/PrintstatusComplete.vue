<style scoped>
.stat-row {
    padding: 20px 16px 24px 16px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: rgba(60, 60, 67, 0.5);
    margin-bottom: 6px;
}

.stat-value {
    font-size: 18px;
    font-weight: 600;
    color: rgba(28, 28, 30, 0.9);
    letter-spacing: -0.02em;
    font-feature-settings: "tnum";
}
</style>

<template>
    <v-card-text class="pa-0">
        <v-container class="py-0">
            <v-row class="stat-row text-center" align="center">
                <v-col class="col-3 stat-item pa-0">
                    <span class="stat-label">{{ $t('Panels.StatusPanel.Filament') }}</span>
                    <span class="stat-value text-no-wrap">
                        {{ outputFilamentUsed }}
                    </span>
                </v-col>
                <v-col class="col-3 stat-item pa-0">
                    <span class="stat-label">{{ $t('Panels.StatusPanel.Slicer') }}</span>
                    <span class="stat-value text-no-wrap">
                        {{ 'estimated_time' in current_file ? formatTime(current_file.estimated_time) : '--' }}
                    </span>
                </v-col>
                <v-col class="col-3 stat-item pa-0">
                    <span class="stat-label">{{ $t('Panels.StatusPanel.Print') }}</span>
                    <span class="stat-value text-no-wrap">{{ print_time ? formatTime(print_time) : '--' }}</span>
                </v-col>
                <v-col class="col-3 stat-item pa-0">
                    <span class="stat-label">{{ $t('Panels.StatusPanel.Total') }}</span>
                    <span class="stat-value text-no-wrap">
                        {{ print_time_total ? formatTime(print_time_total) : '--' }}
                    </span>
                </v-col>
            </v-row>
        </v-container>
    </v-card-text>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'

@Component({
    components: {},
})
export default class StatusPanelPrintstatusComplete extends Mixins(BaseMixin) {
    get current_file() {
        return this.$store.state.printer.current_file ?? {}
    }

    get filament_used() {
        return this.$store.state.printer.print_stats?.filament_used ?? 0
    }

    get outputFilamentUsed() {
        return this.filament_used >= 1000
            ? (this.filament_used / 1000).toFixed(2) + ' m'
            : this.filament_used.toFixed(2) + ' mm'
    }

    get print_time() {
        return this.$store.state.printer.print_stats?.print_duration ?? 0
    }

    get print_time_total() {
        return this.$store.state.printer.print_stats?.total_duration ?? 0
    }

    formatTime(seconds: number) {
        const h = Math.floor(seconds / 3600)
        seconds %= 3600
        const m = ('0' + Math.floor(seconds / 60)).slice(-2)
        const s = ('0' + (seconds % 60).toFixed(0)).slice(-2)

        return h + ':' + m + ':' + s
    }
}
</script>
