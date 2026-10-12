<template>
    <v-row :class="entryStyle">
        <v-col class="col-auto pr-0 text--disabled console-time">{{ entryFormatTime }}</v-col>
        <v-col
            v-if="!rawOutput"
            :class="messageClass"
            style="min-width: 0"
            @click.capture="commandClick"
            v-html="event.formatMessage" />
        <v-col v-else :class="messageClass" style="min-width: 0" @click.capture="commandClick" v-text="event.message" />
    </v-row>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop } from 'vue-property-decorator'
import { ServerStateEvent } from '@/store/server/types'
import BaseMixin from '@/components/mixins/base'

@Component
export default class ConsoleTableEntry extends Mixins(BaseMixin) {
    @Prop({ required: true }) readonly event!: ServerStateEvent

    get entryStyle() {
        const classes = ['ma-0', 'flex-nowrap']
        classes.push(this.$store.state.gui.console.entryStyle ?? 'default')
        if (['action', 'debug'].includes(this.event.type)) classes.push('text--disabled')

        return classes
    }

    get entryFormatTime() {
        return this.formatTime(this.event.date.getTime(), true)
    }

    get messageClass() {
        const classes = ['console-message']

        if (['action', 'debug'].includes(this.event.type)) classes.push('text--disabled')
        else if (this.event.message.startsWith('!! ')) classes.push('error--text')
        else classes.push('text--primary')

        return classes
    }

    get rawOutput() {
        return this.$store.state.gui.console.rawOutput ?? false
    }

    commandClick(event: Event) {
        const eventTarget = event.target as Element
        if (eventTarget.localName === 'a' && eventTarget.className.indexOf('command') !== -1) {
            const command = eventTarget.innerHTML.replace(/<br>/g, '\n')

            this.$emit('command-click', command)
        }
    }
}
</script>

<style scoped>
.consoleTableRow {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.95em;
    white-space: pre-wrap;
    content-visibility: auto;
    contain-intrinsic-size: auto 36px;

    &.default {
        .col {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
        }

        & + .consoleTableRow .col {
            /* token, not rgba(255,255,255,.12): the console sits on the light
               --notion-code-bg surface now, where a white hairline is invisible,
               and the old light-mode fix was gated on an html theme class that
               never exists on a default boot */
            border-top: 1px solid var(--notion-border-strong, rgba(0, 0, 0, 0.12));
        }
    }

    &.compact {
        .col {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
        }
    }
}

/*
 * Quiet console ink on the light code surface.
 *
 * The timestamp column and the action/debug entries ship Vuetify's
 * `text--disabled` helper, whose Material ink (rgba(0,0,0,.38), ~2.7:1 on the new
 * #f7f6f3 console) is far too weak for text a user has to read. notion.css now
 * remaps the helper globally (`html .v-application.theme--light .text--disabled`,
 * 0,3,1, which finally outranks Vuetify's own 0,3,0 theme rule), so the rules
 * below are the local belt-and-braces for the columns that carry the ink class
 * directly — they keep the same `--notion-text-muted` token and stay correct even
 * if this row is rendered outside the app shell.
 *
 * `!! ` error lines keep `error--text`; its light value was darkened to #c53737
 * (5.3:1) in src/plugins/vuetify.ts, which is what Vuetify writes into
 * `--v-error-base`, so nothing has to be overridden here.
 */
.v-application .consoleTableRow .console-time,
.v-application .consoleTableRow .console-time.text--disabled,
.v-application .consoleTableRow.text--disabled,
.v-application .consoleTableRow .console-message.text--disabled {
    color: var(--notion-text-muted, #757575) !important;
}
</style>
