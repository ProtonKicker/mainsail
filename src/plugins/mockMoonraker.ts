/*
 * Mock Moonraker backend — lets Mainsail run and be explored without a real
 * Klipper + Moonraker instance. It replaces the browser `WebSocket` with a fake
 * that speaks the Moonraker JSON-RPC contract and returns realistic, seeded
 * data for the whole init sequence (server, gui, viewer, printer objects).
 *
 * It is intentionally tolerant: any RPC method it does not know is answered
 * with an empty `{}` result so the app never hangs on a pending wait.
 *
 * This is a DEVELOPMENT / DEMO helper and is only active when the app runs in
 * dev mode or when the query/hash flag `moonraker=mock` is present.
 */

export type MoonrakerRequest = {
    jsonrpc: string
    id?: number
    method: string
    params?: Record<string, unknown>
}

type SendFn = (data: string) => void

const nowS = () => Date.now() / 1000

/** Minimal-but-plausible printer state so dashboard/temperature panels populate. */
function seedStatus(): Record<string, unknown> {
    return {
        webhooks: {
            state: 'ready',
            state_message: 'Printer is ready',
            current_input: '{}',
        },
        print_stats: {
            filename: '',
            state: 'standby',
            print_duration: 0,
            total_duration: 0,
            nozzle_diameter: 0.4,
            filament_used: 0,
        },
        idle_timeout: {
            state: 'idle',
            printing_time: 167000,
        },
        display_status: {
            progress: 0,
            message: '',
        },
        toolhead: {
            current_position: [0.0, 0.0, 0.0, 0.0],
            home_position: [0.0, 0.0, 0.0, 0.0],
            max_velocity: 300,
            max_accel: 3000,
            axis_maximum: [220.0, 220.0, 250.0, 0.0],
            position: [0.0, 0.0, 0.0, 0.0],
            estimated_print_time: 0,
        },
        extruder: {
            temperature: 24.0,
            target: 0.0,
            pressure_advance: 0.045,
            smooth_time: 0.04,
        },
        heater_bed: {
            temperature: 22.0,
            target: 0.0,
        },
        'heater_generic chamber': {
            temperature: 20.0,
            target: 0.0,
        },
        'temperature_sensor electronics_temp': {
            temperature: 33.0,
        },
        'temperature_sensor raspberry_pi_temp': {
            temperature: 42.0,
        },
        'fan fan': {
            speed: 0.0,
            rpm: 0.0,
        },
        'heater_fan hotend_fan': {
            speed: 0.0,
            rpm: 0.0,
        },
        configfile: {
            settings: {
                printer: { kinematics: 'cartesian', max_velocity: 300 },
                'fan fan': {},
                extruder: {},
                'gcode_macro PAUSE': {},
                'gcode_macro RESUME': {},
                'gcode_macro CANCEL_PRINT': {},
            },
        },
        virtual_sdcard: {
            progress: 0,
            is_active: false,
            file_position: 0,
        },
        'gcode_macro M117': { result: '' },
        'gcode_macro EXCLUDE_OBJECT_START': { result: '' },
        'gcode_macro EXCLUDE_OBJECT_END': { result: '' },
        'gcode_macro TIMELAPSE_TAKE_FRAME': { is_paused: false },
        'output_pin LED': { value: 0.0 },
    }
}

function seedObjects(): string[] {
    return [
        'webhooks',
        'configfile',
        'mcu',
        'print_stats',
        'display_status',
        'idle_timeout',
        'toolhead',
        'extruder',
        'heater_bed',
        'heater_generic chamber',
        'temperature_sensor electronics_temp',
        'temperature_sensor raspberry_pi_temp',
        'fan fan',
        'heater_fan hotend_fan',
        'virtual_sdcard',
        'gcode_macro M117',
        'gcode_macro EXCLUDE_OBJECT_START',
        'gcode_macro EXCLUDE_OBJECT_END',
        'gcode_macro TIMELAPSE_TAKE_FRAME',
        'output_pin LED',
    ]
}

/** Map RPC method → response result. @param params Request params (a subset). */
export function resolveMethod(method: string, params: Record<string, unknown> | undefined): unknown {
    switch (method) {
        case 'server.connection.identify':
            return { connection_id: 424242 }

        case 'server.info':
            return {
                klippy_connected: true,
                klippy_state: 'ready',
                klippy_message: 'Printer is ready',
                hostname: 'pebble-cheese',
                api_version: [1, 0, 0],
                klipper_path: '~/klipper',
                python_path: '~/klippy-env/bin/python',
                log_file: '~/.klippy/logs/klippy.log',
                config_file: '~/printer_data/config/printer.cfg',
                source_version: 'v0.12.0-123-gabcdef12',
                cpu_info: '4 core v3 (lores) ARMv7 Processor rev 3 (v7l)',
                state: 0,
                instance_id: 'mock-instance-1',
                registered_directories: [
                    'config',
                    'config_files',
                    'gcodes',
                    'timelapse',
                    'timelapse_frames',
                    'logs',
                ],
                warnings: [],
                components: [],
                failed_components: [],
            }

        case 'server.config':
            return {
                config: {
                    spoolman: null,
                    update_manager: { enable_auto_refresh: false },
                },
            }

        case 'machine.system_info':
            return {
                system_info: {
                    system_data: { hostname: 'pebble-cheese' },
                    distribution: { name: 'Debian', version: '12' },
                    instance_ids: { instance_id: 'mock-instance-1' },
                    provider: { name: 'mock' },
                    cpu_info: {
                        cpu_count: 4,
                        bits: 32,
                        processor: 'ARMv7 Processor rev 3 (v7l)',
                        cpu_desc: 'mock cpu',
                        hardware_desc: 'mock board',
                        model: 'PebbleBoard v1',
                        total_memory: 1024 * 1024 * 1024,
                        memory_units: 'kB',
                    },
                    sd_info: { manufacturer: 'Sandisk' },
                    available_services: [],
                    virtualization: null,
                },
            }

        case 'machine.proc_stats':
            return {
                network: { wlan0: { rx_bytes: 0, tx_bytes: 0, bandwidth: 0 } },
                system_cpu_usage: { cpu: 4.2, mem: 24.0 },
                cpu_temp: 40.0,
                system_uptime: 86400,
                moonraker_stats: { moonraker_stats: [] },
            }

        case 'server.database.list':
            return { namespaces: ['mainsail', 'maintenance', 'webcams', 'timelapse'] }

        case 'server.database.get_item': {
            const namespace = params?.namespace
            if (namespace === 'maintenance') {
                return { namespace: 'maintenance', key: null, value: {} }
            }

            // mainsail namespace: return an empty-but-valid object so defaults apply
            return { namespace: 'mainsail', key: null, value: {} }
        }

        case 'server.database.post_item':
        case 'server.database.delete_item':
            return 'ok'

        case 'server.webcams.list':
            return {
                webcams: [
                    {
                        name: 'NozzleCam',
                        stream_url: '/webcam/?action=stream',
                        snapshot_url: '/webcam/?action=snapshot',
                        enabled: true,
                    },
                ],
            }

        case 'server.temperature_store':
            return { temperatures: {} }

        case 'server.gcode_store':
            return {
                gcode_store: [
                    { message: 'Klipper state: Ready', time: nowS(), type: 'command' },
                ],
            }

        case 'printer.info':
            return {
                state: 'ready',
                state_message: 'Printer is ready',
                hostname: 'pebble-cheese',
                software_version: 'v0.12.0-123-gabcdef12',
                cpu_info: '4 core v3 (lores)',
                app: 'Klipper',
            }

        case 'printer.objects.list':
            return { objects: seedObjects() }

        case 'printer.objects.subscribe':
            return { status: seedStatus(), eventtime: nowS() }

        case 'printer.objects.query':
            return { status: seedStatus(), eventtime: nowS() }

        case 'printer.gcode.script':
            return { result: 'ok' }

        case 'server.files.list':
            return {
                result: [
                    {
                        path: '/gcodes/',
                        modified: 0,
                        permissions: 'rw',
                        size: 0,
                        type: 'dir',
                        filename: 'gcodes',
                        extension: null,
                    },
                ],
            }

        case 'server.files.get_directory':
            return {
                result: {
                    dirs: [],
                    files: [],
                    name: 'gcodes',
                    path: '/gcodes/',
                    permissions: 'rw',
                    parent: null,
                },
            }

        case 'server.history.list':
            return {
                result: {
                    jobs: [],
                    job_totals: {
                        total_jobs: 0,
                        total_print_time: 0,
                        total_filament_used: 0,
                        longest_job: 0,
                        longest_print: 0,
                    },
                    totals: {},
                },
            }

        case 'server.history.totals':
            return {
                job_totals: {
                    total_jobs: 0,
                    total_print_time: 0,
                    total_filament_used: 0,
                    longest_job: 0,
                    longest_print: 0,
                },
            }

        case 'server.job_queue.status':
            return { queued_jobs: [], queue_state: 'OFF' }

        case 'server.update.status':
            return {
                busy: false,
                github_rate_limit: 0,
                github_rate_limit_resets_to: 0,
                version_info: {},
            }

        case 'server.announcements.list':
            return { entries: [], feeds: [] }

        case 'server.sensors.list':
            return { sensors: [] }

        default:
            return {}
    }
}

/**
 * Install the mock WebSocket. Returns the previous window.WebSocket so callers
 * can restore it if needed.
 */
export function installMockMoonraker(): void {
    if (typeof window === 'undefined') return

    class FakeWebSocket {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3

        readonly CONNECTING = 0
        readonly OPEN = 1
        readonly CLOSING = 2
        readonly CLOSED = 3

        readyState = FakeWebSocket.CONNECTING
        binaryType: BinaryType = 'arraybuffer'
        onopen: ((ev: Event) => unknown) | null = null
        onmessage: ((ev: MessageEvent) => unknown) | null = null
        onerror: ((ev: Event) => unknown) | null = null
        onclose: ((ev: CloseEvent) => unknown) | null = null

        private outboundListener: ((message: string) => void) | null = null
        private keepAliveTimer: number | null = null

        constructor(public url: string) {
            // Become immediately "open" after a short tick.
            setTimeout(() => {
                this.readyState = FakeWebSocket.OPEN
                this.onopen?.(new Event('open'))
                this.startKeepAlive()
            }, 30)
        }

        // Record every outgoing frame so tests can inspect traffic.
        onOutbound(listener: SendFn): void {
            this.outboundListener = listener
        }

        send(data: string): void {
            if (this.readyState !== FakeWebSocket.OPEN) return
            this.outboundListener?.(data)

            let payload: MoonrakerRequest[] | MoonrakerRequest
            try {
                payload = JSON.parse(data)
            } catch {
                return
            }

            const messages = Array.isArray(payload) ? payload : [payload]
            for (const message of messages) {
                if (typeof message.id !== 'number') continue
                const result = resolveMethod(message.method, (message.params ?? {}) as Record<string, unknown>)
                this.emitDirect({
                    jsonrpc: '2.0',
                    id: message.id,
                    result,
                })
            }
        }

        private emitDirect(payload: Record<string, unknown>): void {
            const handler = this.onmessage
            if (!handler) return
            const event = new MessageEvent('message', {
                data: JSON.stringify(payload),
            })
            handler(event)
        }

        private startKeepAlive(): void {
            if (this.keepAliveTimer !== null) return
            this.keepAliveTimer = window.setInterval(() => {
                if (this.readyState !== FakeWebSocket.OPEN) return

                this.emitDirect({
                    jsonrpc: '2.0',
                    method: 'notify_proc_stat_update',
                    params: [
                        {
                            network: { wlan0: { rx_bytes: 0, tx_bytes: 0, bandwidth: 0 } },
                            system_cpu_usage: { cpu: 4.2, mem: 24.0 },
                            cpu_temp: 40.0,
                            moonraker_stats: { moonraker_stats: [] },
                        },
                    ],
                })

                this.emitDirect({
                    jsonrpc: '2.0',
                    method: 'notify_status_update',
                    params: [seedStatus(), nowS()],
                })
            }, 3000)
        }

        private stopKeepAlive(): void {
            if (this.keepAliveTimer === null) return
            window.clearInterval(this.keepAliveTimer)
            this.keepAliveTimer = null
        }

        close(code?: number, reason?: string): void {
            if (this.readyState === FakeWebSocket.OPEN || this.readyState === FakeWebSocket.CONNECTING) {
                this.readyState = FakeWebSocket.CLOSED
                this.stopKeepAlive()
                this.onclose?.(new CloseEvent('close', { code: code ?? 1000, reason: reason ?? '' }))
            }
        }
    }

    // @ts-expect-error intentionally replacing the global constructor for demo mode
    window.WebSocket = FakeWebSocket
}
