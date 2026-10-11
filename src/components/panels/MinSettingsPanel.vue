<template>
    <panel
        v-if="klipperState === 'ready' && existsPrinterConfig && missingConfigs.length"
        icon="⚙️"
        :title="$t('Panels.MinSettingsPanel.MissingConfiguration')"
        :collapsible="true"
        card-class="min-settings-panel">
        <v-card-text class="pt-2 pb-3">
            <ul class="missing-config-list">
                <li v-for="module in missingConfigs" :key="module">
                    <code>{{ module }}</code>
                    {{ $t('Panels.MinSettingsPanel.IsNotDefinedInConfig') }}
                </li>
            </ul>
        </v-card-text>
        <template v-if="mainsailCfgExists">
            <v-divider class="mx-4"></v-divider>
            <v-card-text class="py-2">
                <p class="mb-0 text-body-2 text--secondary">{{ $t('Panels.MinSettingsPanel.IncludeMainsailCfg') }}</p>
            </v-card-text>
        </template>
        <v-card-actions class="justify-start px-4 pb-3 pt-0">
            <v-btn text small color="primary" href="https://docs.mainsail.xyz/setup/configuration" target="_blank">
                {{ $t('Panels.MinSettingsPanel.MoreInformation') }}
            </v-btn>
        </v-card-actions>
    </panel>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import Panel from '@/components/ui/Panel.vue'
import { mdiInformation } from '@mdi/js'
@Component({
    components: { Panel },
})
export default class MinSettingsPanel extends Mixins(BaseMixin) {
    mdiInformation = mdiInformation

    get existsPrinterConfig() {
        return this.$store.getters['printer/existPrinterConfig'] ?? false
    }

    get missingConfigs() {
        return this.$store.getters['printer/checkNecessaryConfig'] ?? []
    }

    get mainsailCfgExists() {
        return this.$store.getters['files/checkConfigFile']('mainsail.cfg') ?? false
    }
}
</script>

<style scoped>
.missing-config-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.missing-config-list li {
    font-size: 12px;
    color: rgba(60, 60, 67, 0.8);
    padding: 3px 0;
}

.missing-config-list code {
    background: rgba(0, 0, 0, 0.05);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-family: 'SF Mono', 'Menlo', monospace;
    color: rgba(60, 60, 67, 0.9);
}

.min-settings-panel {
    border-left: 2px solid rgba(255, 152, 0, 0.3) !important;
}

.content span,
.content strong {
    padding-left: 8px;
    padding-right: 8px;
    white-space: pre-wrap;
}
</style>
