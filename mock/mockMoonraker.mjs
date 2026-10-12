/**
 * mockMoonraker.mjs
 * A standalone lightweight Mock Moonraker backend used ONLY for development previews
 * when no real Klipper/Moonraker printer is available. It serves:
 *   - A WebSocket JSON-RPC endpoint at  ws://<host>:<port>/websocket
 *   - A minimal HTTP API for file endpoints
 *
 * It responds to the subset of Moonraker RPC methods that Mainsail calls during
 * init so that the Dashboard and all tabs render with realistic seeded data, and
 * emits periodic heartbeat notifications to keep the socket alive.
 */

import http from 'node:http'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.MOCK_MOONRAKER_PORT ?? 7125)

let connection_id = 0

/* ---------------------------------------------------------------------------
 * Seeded printer object state (namespace on the printer.objects.subscribe reply)
 * ------------------------------------------------------------------------- */
const printerState = {
    webhooks: {
        state: 'ready',
        state_message: 'Printer is ready',
        state_reason: null,
    },
    configfile: {
        config: {},
        settings: {
            printer: {
                kinematics: 'cartesian',
                max_velocity: 300,
                max_accel: 3000,
                max_z_velocity: 15,
                max_z_accel: 100,
            },
        },
        warnings: [],
        save_config_pending: false,
    },
    gcode_macro: {
        pause: {
            description: null,
            gcode: 'PAUSE',
        },
        resume: {
            description: null,
            gcode: 'RESUME',
        },
        cancel_print: {
            description: null,
            gcode: 'CANCEL_PRINT',
        },
    },
    toolhead: {
        homed_axes: 'xyz',
        print_time: 0.0,
        estimatedPrintTime: 0.0,
        filament_detected: false,
        extruder: 'extruder',
        position: [0.0, 0.0, 0.0, 0.0],
        max_velocity: 300,
        max_accel: 3000,
        max_accel_to_decel: 3000,
        max_z_velocity: 15,
        max_z_accel: 100,
        axis_maximum: [250.0, 250.0, 250.0, 0.0],
        axis_minimum: [-10.0, -10.0, -10.0, -10.0],
        square_corner_velocity: 5.0,
        home_position: [0.0, 0.0, 0.0, 0.0],
    },
    extruder: {
        temperature: 24.4,
        target: 0.0,
        power: 0.0,
        can_extrude: false,
        pressure_advance: 0.05,
        smooth_time: 0.04,
    },
    heater_bed: {
        temperature: 26.8,
        target: 0.0,
        power: 0.0,
    },
    fan: {
        speed: 0.0,
        rpm: 0,
    },
    heater_fan: {
        speed: 0.0,
        rpm: 0,
    },
    filament_switch_sensor: {
        enabled: false,
        filament_detected: true,
        filament_present: true,
    },
    motion_report: {
        live_position: [0.0, 0.0, 0.0, 0.0],
        live_velocity: 0.0,
        live_extruder_velocity: 0.0,
        steppers: {
            stepper_x: [-1, -1, -1, 0.0],
            stepper_y: [-1, -1, -1, 0.0],
            stepper_z: [-1, -1, -1, 0.0],
            extruder: [-1, -1, -1, 0.0],
        },
        trapq: [0.0, 0.0, 0.0],
    },
    print_stats: {
        filename: '',
        total_duration: 0.0,
        print_duration: 0.0,
        message: '',
        info: {},
        filament_used: 0.0,
        state: 'standby',
        print_start_time: null,
    },
    display_status: {
        message: null,
        message_duration: 0,
        progress: 0.0,
        end_time: null,
    },
    virtual_sdcard: {
        progress: 0.0,
        is_active: false,
        file_position: 0,
        file_size: 0,
        file_path: null,
    },
    pause_resume: {
        is_paused: false,
    },
    temperature_fan: {
        controller_fan: {
            speed: 0.0,
            temperature: 31.1,
        },
    },
    chamber_sensor: {
        temperature: 28.2,
    },
    idle_timeout: {
        state: 'Idle',
        printing_time: 0.0,
    },
    gcode: {
        commands: [],
    },
    system_stats: {
        sys_load: 0.12,
        sys_name: 'c7 d4 4 10 18 21 51 23 2e 1a 02 b1 3e ee cc 17  ud false tv utf8',
    },
    'gcode_macro START_PRINT': {
        description: null,
        gcode: 'START_PRINT',
    },
}

const discoveryList = Object.keys(printerState).map((name) => name)

/* ---------------------------------------------------------------------------
 * Reply dispatcher for JSON-RPC requests
 * ------------------------------------------------------------------------- */
function handleMethod(method, params) {
    switch (method) {
        case 'server.connection.identify': {
            connection_id += 1
            return { connection_id: String(connection_id) }
        }

        case 'server.connection.id':
            return { connection_id: String(connection_id) }

        case 'server.info':
            return {
                klippy_connected: true,
                klippy_state: 'ready',
                hostname: 'mock-printer',
                source: 'mock-moonraker',
                port: String(PORT),
                instance_id: 'mock-instance-id',
                version: 'v0.8.0-1234',
                api_version: [1, 0, 0],
                cpu_info: 'mock-cpu 1GHz / 2 cores',
                software_version: 'mock-0.1.0',
                components: ['klippy_connection', 'data_store', 'file_manager', 'history', 'job_queue', 'power'],
                registered_directories: ['gcodes', 'config', 'timelapse'],
                warnings: [],
                failed_components: [],
                FailedPlugins: [],
                websocket_count: 1,
            }

        case 'server.config':
            return {
                config: {
                    hostname: '0.0.0.0',
                    port: PORT,
                    configfiles_reload: true,
                    log_path: 'mock-logs',
                },
                orig: {},
            }

        case 'machine.system_info':
            return {
                system_info: {
                    system_data: {
                        os: { distribution: { name: 'MockOS', version: '1.0' } },
                        system: {},
                        instance_ids: {},
                        available_services: [],
                        python: {},
                        cpu: {
                            cpu_count: 4,
                            bits: '64bit',
                            processor: 'mock cpu',
                            cpu_desc: 'mock cpu',
                        },
                        distro: {},
                        virtualization: {},
                        provider: {},
                        temperature: {},
                    },
                    cpu_info: {
                        cpu_count: 4,
                        bits: '64bit',
                        processor: 'mock cpu',
                        cpu_desc: 'mock cpu',
                    },
                    instance_ids: {},
                    available_services: ['klipper', 'moonraker'],
                    provider: { type: 'mock' },
                    python: { version: [3, 11, 0], version_info: '3.11.0' },
                    distribution: { name: 'MockOS', version: '1.0' },
                    virtualization: { virt_type: 'none', virt_identifier: 'none' },
                },
            }

        case 'machine.proc_stats':
            return {
                cpu_temp: 42.1,
                moonraker_stats: {
                    time: 0,
                    cpu_usage: 1.2,
                    memory: 150 * 1024 * 1024,
                    mem_units: 'bytes',
                    cpu_avg: 0.55,
                    mem_avg: 140 * 1024 * 1024,
                },
                cpu_temp: 42.1,
                cpu_freq: 1200000000,
                cpu_freq_min: 600000000,
                cpu_freq_max: 1500000000,
                cpu_usage: {},
                memory: 700 * 1024 * 1024,
                mem_units: 'bytes',
                websocket_connections: 1,
                network: { lo: {}, wlan0: { rx_bytes: 0, tx_bytes: 0 } },
                system_uptime: 3600,
                system_cpu_usage: { cpu: 3.5, mem: 8.2 },
            }

        case 'server.database.list':
            return { namespaces: ['config', 'mainsail', 'maintenance', 'reminders'] }

        case 'server.database.get_item': {
            const { namespace, key } = params ?? {}
            const data = {}
            if (namespace === 'mainsail') {
                // Provide a sensible GUI default so Mainsail stores initialise cleanly.
                data[`mainsail.${key ?? ''}`] = defaultGui(key)
            } else if (namespace === 'reminders') {
                data[`reminders.${key ?? ''}`] = []
            } else if (namespace === 'maintenance') {
                data[`maintenance.${key ?? ''}`] = []
            } else {
                data[`${namespace}.${key ?? ''}`] = {}
            }
            return { namespace, key, value: data[`${namespace}.${key ?? ''}`] }
        }

        case 'server.database.post_item': {
            const { namespace, key, value } = params ?? {}
            if (namespace === 'mainsail' && key === 'notifications.aireos' && value) {
                storeNotifications(value)
            }
            return { namespace, key, value }
        }

        case 'server.database.delete_item':
            return { namespace: params?.namespace, key: params?.key }

        case 'printer.info':
            return {
                result: {
                    state: 'ready',
                    state_message: 'Printer is ready',
                    hostname: 'mock-printer',
                    software_version: 'mock-klipper',
                    cpu_info: 'mock-cpu',
                },
            }

        case 'printer.emergency_stop':
            return { result: 'ok' }

        case 'printer.gcode.script':
            return { result: 'ok' }

        case 'printer.print.start':
            return { result: 'ok' }

        case 'printer.objects.list':
            return { objects: discoveryList }

        case 'printer.objects.query': {
            const objects = params?.objects ?? {}
            const status = {}
            for (const name of Object.keys(objects)) {
                if (name === 'gcode') {
                    status.gcode = { commands: macroCommands }
                } else if (printerState[name]) {
                    status[name] = printerState[name]
                } else {
                    status[name] = {}
                }
            }
            return { status, eventtime: nowEventtime(), result: { status } }
        }

        case 'printer.objects.subscribe': {
            setInterval(() => {}, 0)
            return {
                status: printerState,
                eventtime: nowEventtime(),
                result: { status: printerState },
            }
        }

        case 'server.gcode_store':
            return { gcode_store: gcodeStore }

        case 'server.temperature_store': {
            return {
                result: {
                    temperatures: [
                        ['extruder', 24.4, 0.0, 3.4],
                        ['heater_bed', 26.8, 0.0, 3.4],
                    ],
                },
            }
        }

        case 'server.files.get_directory': {
            const path = params?.path ?? 'gcodes'
            return directoryListing(path)
        }

        case 'server.files.roots':
            return []

        case 'server.files.metadata':
            return metadataForFile(params?.filename)

        case 'server.files.list': {
            const root = params?.root ?? 'gcodes'
            return directoryListing(root)
        }

        case 'server.history.list':
            return {
                count: jobs.length,
                jobs,
                limit: 50,
                start: 0,
            }

        case 'server.history.totals':
            return {
                job_totals: {
                    total_jobs: jobs.length,
                    total_time: 2712,
                    total_print_time: 2400,
                    total_filament_used: 18.4,
                    longest_job: 5400,
                    longest_print: 4800,
                },
            }

        case 'server.job_queue.status':
            return {
                queued_jobs: [],
                queue_state: 'ready',
            }

        case 'server.job_queue.post_job':
            return { queued_jobs: [] }

        case 'server.job_queue.delete_job':
            return { queued_jobs: [] }

        case 'server.job_queue.start':
            return { queued_jobs: [] }

        case 'server.job_queue.pause':
            return { queued_jobs: [] }

        case 'machine.device_power.devices':
            return { devices: [] }

        case 'machine.device_power.status':
            return { result: {} }

        case 'machine.update.status':
            return {
                result: {
                    busy: false,
                    github_rate_limit: 0,
                    version_info: {
                        system: {},
                        moonraker: { version: 'v0.8.0-1234', package_count: 2 },
                        klipper: { version: 'mock-klipper', branch: 'master', remote_alias: 'origin' },
                    },
                },
            }

        case 'machine.timelapse.get_settings':
            return {
                result: {
                    enabled: false,
                    mode: 'layermacro',
                    hyperlapse: 60,
                    autorender: true,
                    frame_rate: 30,
                    extraoutputparams: '',
                    storage_device: '/tmp/printer',
                    targetlength: 30,
                    variable_fps: false,
                    fw_retract: false,
                },
            }

        case 'machine.timelapse.lastframeinfo':
            return { result: {} }

        case 'machine.timelapse.post_settings':
            return { result: 'ok' }

        case 'machine.timelapse.saveframes':
            return { result: 'ok' }

        case 'server.announcements.list':
            return {
                result: {
                    entries: [],
                    feeds: [],
                    updated: 0,
                    has_updates: false,
                },
            }

        case 'server.announcements.dismiss':
            return { result: 'ok' }

        case 'server.webcams.list':
            return { webcams }

        case 'server.webcams.post_item':
            return { result: 'ok' }

        case 'server.webcams.delete_item':
            return { result: 'ok' }

        case 'server.sensors.list':
            return { result: {} }

        case 'server.spoolman.get_spool_id':
            return { result: null }

        case 'server.spoolman.post_spool_id':
            return { result: null }

        case 'machine.shutdown':
            return { result: 'ok' }

        case 'machine.reboot':
            return { result: 'ok' }

        case 'machine.services.restart':
            return { result: 'ok' }

        case 'machine.services.start':
            return { result: 'ok' }

        case 'machine.services.stop':
            return { result: 'ok' }

        case 'server.restart':
            return { result: 'ok' }

        default:
            // Unknown method: report a generic error so Mainsail marks the
            // init component failed instead of hanging.
            return undefined
    }
}

let connectedClients = 0

const gcodeStore = [
    {
        date: Date.now() / 1000 - 30,
        message: "// Klipper state: Ready",
        type: 'response',
    },
    {
        date: Date.now() / 1000 - 90,
        message: '// Starting printer connection',
        type: 'response',
    },
]

const macroCommands = [
    { name: 'START_PRINT', has_params: true, help: null },
    { name: 'END_PRINT', has_params: false, help: null },
    { name: 'CANCEL_PRINT', has_params: false, help: null },
]

const webcams = []
const jobs = []
let notifications = []

function storeNotifications(list) {
    try {
        notifications = list
    } catch {
        notifications = []
    }
}

function nowEventtime() {
    return Math.floor(Date.now() / 1000)
}

function defaultGui(key) {
    const known = {
        'view.dashboard': { visible: {}, layout: [] },
        'gui.console': {},
        'gui.gcodehistory': {},
        'gui.navigation': {},
        'gui.presets': {},
        'gui.remoteprinters': {},
    }
    if (key && known[key]) return known[key]
    return {}
}

function metadataForFile(filename) {
    const base = filename?.split('/').pop() ?? 'file.gcode'
    return {
        filename: base,
        size: 245000,
        modified: Date.now() / 1000,
        print_start_time: null,
        job_id: null,
        estimated_time: 3600,
        filament_name: null,
        first_layer_height: 0.2,
        layer_height: 0.2,
        object_height: 20.0,
        filament_total: 2.5,
        filament_weight_total: 7.5,
        nozzle_diameter: 0.4,
        slicer: 'Cura',
        slicer_version: '5.0.0',
        thumbnails: [],
        filename: base,
    }
}

function directoryListing(path) {
    const root = path.split('/')[0]

    if (root === 'config') {
        return {
            dirs: [
                { dirname: 'bed_mesh', permissions: 'r' },
                { dirname: 'screws_tilt_adjust', permissions: 'r' },
            ],
            files: [
                { filename: 'printer.cfg', permissions: 'rw', modified: Date.now() / 1000, size: 14200 },
                { filename: 'moonraker.conf', permissions: 'rw', modified: Date.now() / 1000, size: 3800 },
                { filename: 'macros.cfg', permissions: 'rw', modified: Date.now() / 1000, size: 9000 },
            ],
            root,
        }
    }

    if (root === 'timelapse') {
        return { dirs: [], files: [], root }
    }

    return {
        dirs: [
            { dirname: 'benchies', permissions: 'rw' },
        ],
        files: [
            { filename: 'benchy_55mm.gcode', permissions: 'rw', modified: Date.now() / 1000, size: 245000 },
            { filename: 'calibration_cube.gcode', permissions: 'rw', modified: Date.now() / 1000, size: 198000 },
            { filename: 'test_20min.gcode', permissions: 'rw', modified: Date.now() / 1000, size: 120000 },
        ],
        root,
    }
}

/* ---------------------------------------------------------------------------
 * Periodic heartbeat notifications
 * ------------------------------------------------------------------------- */
function startHeartbeats(ws) {
    connectedClients += 1

    const hud = setInterval(() => {
        if (ws.readyState !== ws.OPEN) {
            clearInterval(hud)
            return
        }

        const temps = {
            extruder: { temperature: 24.4 + Math.random() * 0.4, target: 0.0, can_extrude: false },
            heater_bed: { temperature: 26.8 + Math.random() * 0.3, target: 0.0 },
        }

        sendJson(ws, [
            { jsonrpc: '2.0', method: 'notify_proc_stat_update', params: [procStatsNotification()] },
            { jsonrpc: '2.0', method: 'notify_status_update', params: [temps, nowEventtime()] },
        ])
    }, 3000)

    ws.on('close', () => {
        clearInterval(hud)
        connectedClients -= 1
    })
}

function procStatsNotification() {
    return {
        cpu_temp: 42.1,
        moonraker_stats: { time: 0, cpu_usage: 1.2, memory: 150 * 1024 * 1024, mem_units: 'bytes' },
        system_cpu_usage: { cpu: 3.5, mem: 8.2 },
    }
}

function sendJson(ws, payload) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(payload))
    }
}

/* ---------------------------------------------------------------------------
 * HTTP server (also the container for the WebSocket server)
 * ------------------------------------------------------------------------- */
const httpServer = http.createServer((req, res) => {
    const url = req.url.split('?')[0]

    // Simple JSON-RPC-over-HTTP compatibility for a couple of endpoints
    if (url.endsWith('/server/info')) return httpJson(res, handleMethod('server.info'))
    if (url.endsWith('/server/config')) return httpJson(res, handleMethod('server.config'))
    if (url.match(/\/server\/files\/get_directory/)) {
        const u = new URL(req.url, `http://localhost`)
        return httpJson(res, handleMethod('server.files.get_directory', { path: u.searchParams.get('path') }))
    }

    // Webcam snapshot endpoints sometimes probed by the UI – return an empty body.
    res.writeHead(501, { 'Content-Type': 'text/plain' })
    res.end('mock: not implemented')
})

const wss = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (request, socket, head) => {
    if (request.url?.endsWith('/websocket')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
        })
    } else {
        socket.destroy()
    }
})

wss.on('connection', (ws) => {
    startHeartbeats(ws)

    ws.on('message', (raw) => {
        let messages
        try {
            messages = JSON.parse(raw.toString())
        } catch {
            return
        }
        if (!Array.isArray(messages)) messages = [messages]

        const replies = []
        for (const req of messages) {
            if (!req || typeof req !== 'object') continue

            // Notification from client (no id) - nothing to reply for now
            if (req.id === undefined || req.id === null) continue

            process.stdout.write(`[mockMoonraker] RPC ${req.method}\n`)
            let result = handleMethod(req.method, req.params)

            if (result === undefined) {
                process.stdout.write(`[mockMoonraker]   -> UNKNOWN METHOD: ${req.method}\n`)
                replies.push({
                    jsonrpc: '2.0',
                    id: req.id,
                    error: { code: -32601, message: `Method not found: ${req.method}` },
                })
            } else {
                replies.push({ jsonrpc: '2.0', id: req.id, result })
            }
        }

        if (replies.length) sendJson(ws, replies.length === 1 ? replies[0] : replies)
    })
})

function httpJson(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ result: data }))
}

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[mockMoonraker] listening on http://0.0.0.0:${PORT}`)
    console.log(`[mockMoonraker] websocket: ws://0.0.0.0:${PORT}/websocket`)
})