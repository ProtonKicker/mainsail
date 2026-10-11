import type { Plugin } from 'vite'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebSocket = any

/**
 * In-memory key/value store to emulate moonraker's database API
 * for the fake server.
 */
const dbStore: Record<string, Record<string, any>> = {}

function dbGet(namespace: string, key: string): any {
    return dbStore[namespace]?.[key] ?? null
}

function dbPost(namespace: string, key: string, value: any): void {
    if (!dbStore[namespace]) dbStore[namespace] = {}
    dbStore[namespace][key] = value
}

function dbDelete(namespace: string, key: string): void {
    if (dbStore[namespace]) {
        delete dbStore[namespace][key]
    }
}

/**
 * Fake Moonraker WebSocket server for development preview.
 * Intercepts /websocket connections and provides realistic mock data
 * so the full Mainsail interface can be browsed without a real printer.
 */

// ─── Simulated State ────────────────────────────────────────────────────────

let connectionId = 1
let printProgress = 0
let isPrinting = false
let printElapsed = 0

const heaterTimeout_12099: { 'B': number; 'T': number } = {
    'B': 25.1,
    'T': 24.8,
}

function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min)
}

function getTemperature(base: number, ambient: number, noise: number) {
    return parseFloat((base + randomInRange(-noise, noise)).toFixed(1))
}

// ─── Response Builders ──────────────────────────────────────────────────────

function buildServerInfo() {
    return {
        klippy_connected: true,
        klippy_state: 'ready',
        components: [
            'server',
            'file_manager',
            'machine',
            'database',
            'data_store',
            'proc_stats',
            'job_queue',
            'history',
            'update_manager',
            'power',
            'announcements',
            'webcam',
            'extensions',
            'authorization',
            'octoprint_compat',
            'temperature_store',
            'gcode',
            'display_status',
        ],
        failed_components: [],
        warnings: [],
        websocket_count: 1,
        moonraker_version: 'v0.9.3',
        missing_klipper_items: [],
        api_version: [1, 0, 0],
        api_version_string: '1.0.0',
        registeredd_directories: ['config', 'gcodes', 'config_examples', 'logs'],
    }
}

function buildServerConfig() {
    return {
        config: {
            authorization: { login_required: false },
            server: {
                host: '0.0.0.0',
                port: 8080,
                ssl_port: 7130,
                enable_debug_logging: false,
                default_klippy_restart: true,
                enable_software_power_options: true,
                enabled_components: [],
                cors_domains: [],
                ip_ban_enabled: true,
                trusted_clients: [],
                extensions: [],
                octoprint_compat: true,
                upload_path_provider: 'path_provider',
            },
            webcam: {},
        },
        config_warnings: [],
        invalid_config: false,
        deprecated_config: false,
    }
}

function buildSystemInfo() {
    return {
        system_info: {
            cpu_info: {
                cpu_count: 4,
                bits: '64bit',
                processor: 'armv7l',
                cpu_desc: 'ARM Cortex-A72',
                serial_number: '',
                hardware_desc: 'Raspberry Pi 4 Model B',
                model: 'Raspberry Pi 4 Model B Rev 1.4',
                memory: 4096000,
                total_memory: 8109,
                memory_units: 'kB',
            },
            sd_info: {
                capacity: '123.88 GB',
                manufacturer: 'SA',
                manufacturer_date: '',
                product: 'SDW128',
                serial: '0x000005b3',
                system: '2293.5 MiB',
                usage: '13%',
            },
            distribution: {
                name: 'Debian',
                id: 'debian',
                version: '12',
                version_id: '12',
                version_codename: 'bookworm',
                pretty_name: 'Debian GNU/Linux 12 (bookworm)',
                pretty_version: 'Debian GNU/Linux 12 (bookworm)',
                variant: '',
                variant_id: '',
            },
            virtualization_type: 'none',
            python: {
                version: [3, 11, 2, 'final', 0],
                version_string: '3.11.2 (main,  Nov 30 2023, 21:39:42) [GCC 12.2.0]',
            },
            available_services: ['klipper', 'moonraker', 'webcamd'],
            instance_ids: { klipper: 'klipper', moonraker: 'moonraker' },
            service_state: {
                klipper: { active_state: 'active', sub_state: 'running' },
                moonraker: { active_state: 'active', sub_state: 'running' },
            },
            uptime: 432000,
            raw_klipper_path: '/home/pi/klipper',
        },
    }
}

function getPrinterObjectsList() {
    return {
        objects: [
            'bed_mesh',
            'configfile',
            'display_status',
            'extruder',
            'fan',
            'gcode',
            'gcode_move',
            'heater_bed',
            'heater_generic chamber',
            'idle_timeout',
            'manual_probe',
            'motion_report',
            'pause_resume',
            'print_stats',
            'query_endstops',
            'system_stats',
            'temperature_fan nevermore',
            'temperature_fan part_fan',
            'temperature_sensor ambient',
            'toolhead',
            'virtual_sdcard',
            'webhooks',
        ],
    }
}

function getPrinterStatus() {
    const bedTarget = heaterTimeout_12099.B
    const bedActual = getTemperature(24.9, 23, 0.3)
    const extruderTarget = 0
    const extruderActual = getTemperature(23.5, 22, 0.4)

    return {
        webhooks: {
            state: 'ready',
            state_message: 'Printer is ready',
        },
        bed_mesh: {
           profile_name: 'default',
            mesh_min: [-50, -50],
            mesh_max: [250, 250],
            probed_matrix: [],
            mesh_matrix: [
                [0.0, 0.01, 0.015, 0.01, 0.0],
                [0.005, 0.008, 0.012, 0.008, 0.005],
                [0.008, 0.01, 0.015, 0.01, 0.008],
                [0.005, 0.008, 0.012, 0.008, 0.005],
                [0.0, 0.01, 0.015, 0.01, 0.0],
            ],
            profiles: {
                default: {
                    points: [
                        [-0.05, -0.03, 0.01, -0.02, 0.0],
                        [-0.04, -0.02, 0.0, -0.01, 0.01],
                        [-0.03, -0.01, 0.0, -0.01, 0.0],
                        [-0.04, -0.02, -0.01, -0.02, -0.01],
                        [-0.05, -0.03, -0.01, -0.03, -0.02],
                    ],
                    mesh_params: {
                        min_x: 30,
                        max_x: 220,
                        min_y: 30,
                        max_y: 220,
                        x_count: 5,
                        y_count: 5,
                        mesh_x_pps: 2,
                        mesh_y_pps: 2,
                        algo: 'bicubic',
                        tension: 0.2,
                    },
                },
            },
        },
        gcode_move: {
            speed_factor: 1,
            speed: 150,
            extrude_factor: 1,
            absolute_coordinates: true,
            absolute_extrude: true,
            gcode_position: [100, 100, 5, 0],
            homed_axes: 'xyz',
            position: [100, 100, 5, 0],
        },
        toolhead: {
            print_time: 0,
            estimated_print_time: 1800,
            extruder: 'extruder',
            position: [100, 100, 5, 0],
            max_velocity: 300,
            max_accel: 3000,
            max_accel_to_decel: 1500,
            square_corner_velocity: 8,
            homed_axes: 'xyz',
        },
        extruder: {
            temperature: extruderActual,
            target: extruderTarget,
            power: 0,
            can_extrude: true,
            pressure_advance: 0.04,
            smooth_time: 0.04,
        },
        heater_bed: {
            temperature: bedActual,
            target: bedTarget,
            power: 0.1,
        },
        heater_generic: {
            temperature: 22.3,
            target: 0,
            power: 0,
        },
        heater_generic_chamber: {
            temperature: 28.5,
            target: 0,
            power: 0,
        },
        fan: {
            speed: 0,
            rpm: null,
        },
        'temperature_fan part_fan': {
            temperature: 23.1,
            target: 0,
            speed: 0.0,
        },
        'temperature_fan nevermore': {
            temperature: 24.0,
            target: 50,
            speed: 0.0,
        },
        'temperature_sensor ambient': {
            temperature: 22.8,
        },
        print_stats: {
            filename: 'benchy.gcode',
            total_duration: printElapsed,
            print_duration: Math.max(0, printElapsed - 120),
            filiment_name: 'Generic PLA',
            state: isPrinting ? 'printing' : 'complete',
            message: '',
            info: {
                current_layer: isPrinting ? Math.ceil(printProgress * 158 / 100) : 158,
                total_layer: 158,
            },
        },
        display_status: {
            progress: printProgress / 100,
            message: isPrinting ? 'Printing...' : null,
        },
        virtual_sdcard: {
            progress: printProgress / 100,
            is_active: isPrinting,
            file_position: Math.floor(printProgress * 54321 / 100),
            file_path: isPrinting || printProgress > 0 ? '/local/benchy.gcode' : null,
        },
        pause_resume: {
            is_paused: false,
        },
        idle_timeout: {
            state: 'Ready',
            printing_time: 3600,
        },
        query_endstops: {
            homed_axes: 'xyz',
        },
        gcode: {},
        motion_report: {
            live_position: [100, 100, 5, 0],
            live_velocity: 0,
            live_extruder_velocity: 0,
            steppers: ['stepper_x', 'stepper_y', 'stepper_z', 'extruder'],
            trapq: ['extruder', 'toolhead'],
        },
        configfile: {
            config: {
                extruder: {
                    nozzle_diameter: 0.4,
                    filament_diameter: 1.75,
                    max_extrude_only_distance: 50,
                    instantaneous_corner_velocity: 1,
                    max_extrude_cross_section: 50,
                    pressure_advance: 0.04,
                    pressure_advance_smooth_time: 0.04,
                },
                heater_bed: {
                    min_temp: 0,
                    max_temp: 120,
                },
                fan: {
                    pin: 'HOSTIO',
                },
                virtual_sdcard: {},
                pause_resume: {},
                gcode_macro_PAUSE: { rename_existing: 'BASE_PAUSE' },
                gcode_macro_RESUME: { rename_existing: 'BASE_RESUME' },
                gcode_macro_CANCEL_PRINT: { rename_existing: 'BASE_CANCEL_PRINT' },
            },
            warnings: [],
            save_config_pending: false,
            save_config_pending_items: {},
        },
        system_stats: {
            cips: 0,
        },
    }
}

function getTemperatureStore() {
    return {
        extruder: {
            temperatures: [getTemperature(3.1, 22, 0.3)],
            targets: [0],
            powers: [0],
        },
        heater_bed: {
            temperatures: [getTemperature(24.8, 22, 0.3)],
            targets: [heaterTimeout_12099.B],
            powers: [0.05],
        },
        'temperature_fan nevermore': {
            temperatures: [getTemperature(24.0, 22, 0.5)],
            targets: [50],
            speeds: [0],
        },
        'temperature_sensor ambient': {
            temperatures: [getTemperature(22.5, 22, 0.3)],
        },
    }
}

function getPrintHistory() {
    return {
        count: 5,
        jobs: [
            {
                job_id: '000001',
                exists: true,
                end_time: 1698000000,
                filament_used: 12.5,
                filename: 'benchy.gcode',
                metadata: {
                    size: 12345678,
                    modified: 1697000000,
                    slicer: 'OrcaSlicer',
                    slicer_version: '1.8.0',
                    gcode_start_byte: 1234,
                    gcode_end_byte: 11234567,
                    object_height: 48.0,
                    first_layer_height: 0.2,
                    layer_height: 0.2,
                    first_layer_bed_temp: 60,
                    first_layer_extruder_temp: 210,
                    chamber_temp: 0,
                    filament_name: 'Generic PLA',
                    filament_type: 'PLA',
                    filament_total: 12.4,
                    filament_weight_total: 36.8,
                    nozzle_diameter: 0.4,
                    print_time: 1836,
                },
                print_duration: 1836,
                status: 'completed',
                total_duration: 1920,
            },
            {
                job_id: '000002',
                exists: true,
                end_time: 1699000000,
                filament_used: 25.1,
                filename: 'vase_mode.gcode',
                metadata: {
                    size: 8765432,
                    modified: 1698000000,
                    slicer: 'Cura',
                    slicer_version: '5.5.0',
                    gcode_start_byte: 1500,
                    gcode_end_byte: 8500000,
                    object_height: 120.0,
                    first_layer_height: 0.28,
                    layer_height: 0.28,
                    first_layer_bed_temp: 60,
                    first_layer_extruder_temp: 200,
                    filament_name: 'Sunlu PLA+',
                    filament_type: 'PLA+',
                    filament_total: 25.1,
                    print_time: 4320,
                },
                print_duration: 4320,
                status: 'completed',
                total_duration: 4500,
            },
            {
                job_id: '000003',
                exists: true,
                end_time: 1700000000,
                filament_used: 0,
                filename: 'failed_print.gcode',
                metadata: {
                    size: 5678901,
                    modified: 1699500000,
                    slicer: 'PrusaSlicer',
                    slicer_version: '2.7.0',
                },
                print_duration: 420,
                status: 'cancelled',
                total_duration: 450,
            },
            {
                job_id: '000004',
                exists: true,
                end_time: 1701000000,
                filament_used: 8.3,
                filename: 'calibration_cube.gcode',
                metadata: {
                    size: 3456789,
                    modified: 1700500000,
                    slicer: 'OrcaSlicer',
                    slicer_version: '1.8.1',
                    object_height: 20.0,
                    layer_height: 0.2,
                    filament_type: 'PETG',
                    print_time: 720,
                },
                print_duration: 720,
                status: 'completed',
                total_duration: 780,
            },
            {
                job_id: '000005',
                exists: true,
                end_time: 1701500000,
                filament_used: 45.7,
                filename: 'large_model.gcode',
                metadata: {
                    size: 34567890,
                    modified: 1701400000,
                    slicer: 'OrcaSlicer',
                    slicer_version: '1.9.0',
                    object_height: 180.0,
                    layer_height: 0.2,
                    filament_type: 'ABS',
                    first_layer_bed_temp: 100,
                    first_layer_extruder_temp: 250,
                    chamber_temp: 50,
                    print_time: 12600,
                },
                print_duration: 12600,
                status: 'completed',
                total_duration: 12900,
            },
        ],
    }
}

function getFileList() {
    return [
        {
            filename: 'benchy.gcode',
            modified: 1698000000,
            size: 12345678,
            permissions: 'rw',
            path: 'benchy.gcode',
            type: 'file',
        },
        {
            filename: 'vase_mode.gcode',
            modified: 1699000000,
            size: 8765432,
            permissions: 'rw',
            path: 'vase_mode.gcode',
            type: 'file',
        },
        {
            filename: 'calibration_cube.gcode',
            modified: 1701000000,
            size: 3456789,
            permissions: 'rw',
            path: 'calibration_cube.gcode',
            type: 'file',
        },
        {
            filename: 'large_model.gcode',
            modified: 1701500000,
            size: 34567890,
            permissions: 'rw',
            path: 'large_model.gcode',
            type: 'file',
        },
        {
            filename: 'project_stand.gcode',
            modified: 1702000000,
            size: 5678901,
            permissions: 'rw',
            path: 'project_stand.gcode',
            type: 'file',
        },
    ]
}

// ─── WebSocket Handler ──────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, data: string) {
    let messages: Array<{ jsonrpc: string; method: string; params: any; id: number }>

    try {
        const parsed = JSON.parse(data)
        messages = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return
    }

    for (const msg of messages) {
        handleSingleMessage(ws, msg)
    }
}

function handleSingleMessage(ws: WebSocket, msg: { method: string; params?: any; id: number }) {
    const { method, params = {}, id } = msg

    const send = (result: any) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ jsonrpc: '2.0', result, id }))
        }
    }

    switch (method) {
        case 'server.connection.identify':
            send({ connection_id: connectionId++ })
            break

        case 'server.info':
            send(buildServerInfo())
            break

        case 'server.config':
            send(buildServerConfig())
            break

        case 'machine.system_info':
            send(buildSystemInfo())
            break

        case 'machine.proc_stats': {
            send({
                throttled_state: { bits: 0 },
                system_uptime: 432000 + Math.floor(Math.random() * 10),
                moonraker_stats: {
                    time: Date.now() / 1000,
                    cpu_usage: randomInRange(2, 15),
                    memory: 85 + Math.floor(randomInRange(0, 10)),
                    mem_units: 'MB',
                },
                network: {
                    lo: { rx_bytes: randomInRange(1000, 5000), tx_bytes: randomInRange(1000, 5000) },
                    wlan0: { rx_bytes: randomInRange(10000, 50000), tx_bytes: randomInRange(10000, 50000) },
                },
                system_cpu_usage: {
                    cpu: randomInRange(5, 25),
                    cpu0: randomInRange(3, 20),
                    cpu1: randomInRange(5, 30),
                    cpu2: randomInRange(4, 22),
                    cpu3: randomInRange(6, 28),
                },
                cpu_temp: getTemperature(42, 40, 2),
            })
            break
        }

        case 'server.database.list':
            send({ namespaces: ['mainsail', 'maintenance'] })
            break

        case 'server.database.get_item': {
            const key = params.key ?? params.item
            // If no specific key, return the entire namespace object
            if (!key) {
                send({
                    namespace: params.namespace ?? params.root,
                    value: dbStore[params.namespace ?? params.root] ?? {},
                })
            } else {
                send({
                    namespace: params.namespace ?? params.root,
                    key,
                    value: dbStore[params.namespace ?? params.root]?.[key] ?? {},
                })
            }
            break
        }

        case 'server.database.post_item':
            dbPost(params.namespace, params.key, params.value)
            send('ok')
            break

        case 'server.database.delete_item':
            dbDelete(params.namespace, params.key)
            send('ok')
            break

        case 'printer.info': {
            const status = getPrinterStatus()
            send({
                state: status.webhooks.state,
                state_message: status.webhooks.state_message,
                hostname: 'mainsail-demo',
                software_version: 'v0.12.0-123',
                cpu_info: 'ARM Cortex-A72',
                ...status,
            })
            break
        }

        case 'printer.objects.list':
            send(getPrinterObjectsList())
            break

        case 'printer.objects.subscribe': {
            const status = getPrinterStatus()
            send({ status, eventtime: Date.now() / 1000 })
            break
        }

        case 'printer.objects.query': {
            const status = getPrinterStatus()
            send({ status, eventtime: Date.now() / 1000 })
            break
        }

        case 'printer.gcode.script':
            if (params?.script) {
                const script = params.script.toUpperCase()
                if (script.startsWith('M104') || script.startsWith('M109')) {
                    const temp = parseFloat(script.replace(/[^\d.]/g, '')) || 0
                    if (script.includes('S')) {
                        // Update extruder target
                    }
                }
            }
            send('ok')
            break

        case 'printer.emergency_stop':
            send('ok')
            break

        case 'printer.print.start':
            isPrinting = true
            printProgress = 0
            printElapsed = 0
            send('ok')
            break

        case 'printer.print.pause':
            isPrinting = false
            send('ok')
            break

        case 'printer.print.resume':
            isPrinting = true
            send('ok')
            break

        case 'printer.print.cancel':
            isPrinting = false
            printProgress = 0
            printElapsed = 0
            send('ok')
            break

        case 'server.gcode_store': {
            const msgs = [
                { type: 'command', time: Date.now() / 1000 - 60, message: 'G28' },
                { type: 'command', time: Date.now() / 1000 - 55, message: 'G29' },
                { type: 'command', time: Date.now() / 1000 - 50, message: 'M109 S200' },
                { type: 'response', time: Date.now() / 1000 - 48, message: 'ok' },
                { type: 'command', time: Date.now() / 1000 - 45, message: 'G1 X100 Y100 F3000' },
                { type: 'response', time: Date.now() / 1000 - 45, message: 'ok' },
                { type: 'response', time: Date.now() / 1000 - 10, message: '// action:notification Print complete' },
            ]
            send({ gcode_store: msgs })
            break
        }

        case 'server.temperature_store':
            send(getTemperatureStore())
            break

        case 'server.history.list':
            send(getPrintHistory())
            break

        case 'server.history.get_job':
            send(getPrintHistory().jobs[0])
            break

        case 'server.history.total_jobs':
            send({ total_jobs: 5 })
            break

        case 'server.job_queue.status':
            send({ queue_state: 'ready', queued_jobs: [] })
            break

        case 'machine.update.status':
            send({
                version_info: {
                    mainsail: { channel: 'stable', version: '2.19.0', remote_version: '2.19.0' },
                    klipper: { channel: 'stable', version: 'v0.12.0-123', remote_version: 'v0.12.0-123' },
                    moonraker: { channel: 'stable', version: 'v0.9.3', remote_version: 'v0.9.3' },
                    'system': { package_count: 5 },
                },
                github_rate_limit: 60,
                github_requests_remaining: 58,
                github_limit_reset_time: Math.floor(Date.now() / 1000) + 3600,
            })
            break

        case 'machine.update.full':
            send({
                version_info: {},
                github_rate_limit: 60,
                github_requests_remaining: 58,
                github_limit_reset_time: Math.floor(Date.now() / 1000) + 3600,
            })
            break

        case 'machine.update.mainsail':
        case 'machine.update.klipper':
        case 'machine.update.moonraker':
        case 'machine.update.system':
            send({ version_info: {} })
            break

        case 'machine.device_power.devices':
            send({
                devices: [
                    { device: 'printer', status: 'on', type: 'gpio', locked_while_printing: false },
                    { device: 'lights', status: 'off', type: 'gpio', locked_while_printing: false },
                    { device: 'relay1', status: 'off', type: 'tplink_smartplug', locked_while_printing: false },
                ],
            })
            break

        case 'machine.device_power.get_device':
            send({ device: params.device, status: 'off', type: 'gpio' })
            break

        case 'machine.device_power.post_device':
            send('ok')
            break

        case 'server.webcams.list':
            send({
                webcams: [
                    {
                        name: 'Nozzle Cam',
                        location: 'printer',
                        service: 'mjpegstreamer',
                        enabled: true,
                        icon: 'mdiWebcam',
                        target_fps: 15,
                        target_fps_idle: 5,
                        stream_url: '/webcam/?action=stream',
                        snapshot_url: '/webcam/?action=snapshot',
                        aspect_ratio: '4:3',
                        flip_horizontal: false,
                        flip_vertical: false,
                        rotation: 0,
                    },
                ],
            })
            break

        case 'server.sensors.list':
            send({
                sensors: {
                    'rpi_temperature': { id: 'rpi_temperature', temperature: getTemperature(42, 40, 2), type: 'temperature_host' },
                    'bme280': { id: 'bme280', temperature: getTemperature(23, 22, 0.3), humidity: 45.2, pressure: 1013.25, type: 'temperature_sensor' },
                },
            })
            break

        case 'server.sensors.get_sensors':
            send({ ok: true })
            break

        case 'server.files.list': {
            send(getFileList())
            break
        }

        case 'server.files.get_directory':
            send({ files: getFileList(), dirs: [] })
            break

        case 'server.files.metadata':
            send({
                size: 12345678,
                modified: 1698000000,
                slicer: 'OrcaSlicer',
                slicer_version: '1.8.0',
                gcode_start_byte: 1234,
                gcode_end_byte: 11234567,
                object_height: 48.0,
                first_layer_height: 0.2,
                layer_height: 0.2,
                first_layer_bed_temp: 60,
                first_layer_extruder_temp: 210,
                chamber_temp: 0,
                filament_name: 'Generic PLA',
                filament_type: 'PLA',
                filament_total: 12.4,
                filament_weight_total: 36.8,
                nozzle_diameter: 0.4,
                estimated_time: 1836,
            })
            break

        case 'server.files.delete_file':
        case 'server.files.move':
        case 'server.files.copy':
        case 'server.files.mkdir':
        case 'server.files.rmdir':
        case 'server.files.post_file':
            send('ok' as any)
            break

        case 'server.announcements.list':
            send({ entries: [], feeds: ['mainsail'] })
            break

        case 'server.spoolman.spool_id':
            send({ spool_id: 1 })
            break

        case 'server.spoolman.get_spool_id':
            send({ spool_id: 1 })
            break

        case 'server.spoolman.proactive_spool':
            send(true)
            break

        case 'server.timelapse.list': {
            const renders = [
                {
                    name: 'benchy.avi',
                    file_size: 5678900,
                    modified: 1698000000,
                    success: true,
                    print_duration: 1836,
                    film_status: 'success',
                },
                {
                    name: 'vase_mode.aiv',
                    file_size: 12345000,
                    modified: 1699000000,
                    success: true,
                    print_duration: 4320,
                    film_status: 'success',
                },
            ]
            return send({
                count: renders.length,
                job_id: null,
                printfile: null,
                settings: {
                    enabled: true,
                    fps: 15,
                    mode: 'layermacro',
                    camera: 'Nozzle Cam',
                    duplicate_frames: false,
                    update_fps: false,
                    prime_height: 0.0,
                    prime_length: 10.0,
                    min_layer_height: 0.0,
                    park_enable: false,
                    park_pos: 'center',
                    park_custom_pos: 'center',
                    park_custom_pos_x: 0.0,
                    park_custom_pos_y: 0.0,
                    park_travel_speed: 100,
                    park_retract_distance: 1.5,
                    park_extrude_amount: 2.0,
                    retraction_enable: true,
                    retractions: 0.0,
                    retraction_distance: 2.0,
                    retraction_speed: 15,
                    retraction_extrusion_distance: 2.0,
                    park_z_axis_relative: false,
                    stream_delay_compensation: 0.06,
                    variable_fps: false,
                    variable_fps_max: 50,
                    variable_fps_min: 5,
                },
                snapshots: [
                    {
                        name: 'benchy.gcode/thumbnails/small.png',
                        path: '/.thumbs/benchy.png',
                        data: null,
                        success: true,
                    },
                ],
                main_prefix: '',
                prints: [
                    { name: 'benchy.gcode', start_time: 1698000000, end_time: 1698001836, ended: true },
                ],
                hyperlapse: false,
                metadata: { print_duration: 1836, layer_count: 158 },
                formatted_date: '2023-10-22 16:00:00',
                full_path: '/timelapse',
                message: '',
                success: true,
            })
        }

        case 'server.configfile.printcfg':
        case 'server.configfile':
            send({ ok: true })
            break

        case 'machine.system_info':
            send(buildSystemInfo())
            break

        case 'server.database.item':
            send(null)
            break

        case 'server.info':
            send(buildServerInfo())
            break

        case 'printer.objects.query':
            send({ status: getPrinterStatus(), eventtime: Date.now() / 1000 })
            break

        default:
            // Unknown method — respond so the frontend doesn't hang
            send('ok')
            break
    }
}

// ─── Vite Plugin ────────────────────────────────────────────────────────────

export function fakeMoonraker(): Plugin {
    return {
        name: 'fake-moonraker',
        apply: 'serve',
        configureServer(server) {
            // Vite handles its own HMR WebSocket internally.
            // We listen on the 'upgrade' event on the underlying HTTP server
            // to intercept connections to /websocket before Vite processes them.
            const httpServer = (server as any).httpServer
            if (!httpServer) return

            // Dynamically import 'ws' since Vite is ESM
            import('ws').then(({ WebSocketServer }) => {
                const fakeWss = new WebSocketServer({ noServer: true })

                httpServer.on('upgrade', (req: any, socket: any, head: any) => {
                    const { url } = req
                    if (!url?.startsWith('/websocket')) return

                    fakeWss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
                        fakeWss.emit('connection', ws, req)
                    })
                })

                fakeWss.on('connection', (ws: WebSocket) => {
                    // Send initial connection success event
                    ws.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'notify_klippy_ready',
                            params: [],
                        })
                    )

                    ws.on('message', (raw: { toString(): string }) => {
                        const data = raw.toString()
                        handleMessage(ws, data)
                    })

                    // Simulate live temperature updates
                    const tempInterval = setInterval(() => {
                        if (ws.readyState !== ws.OPEN) {
                            clearInterval(tempInterval)
                            return
                        }

                        const status = getPrinterStatus()
                        ws.send(
                            JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'notify_status_update',
                                params: [status, Date.now() / 1000],
                            })
                        )
                    }, 1500)

                    // Also simulate proc_stats
                    const procInterval = setInterval(() => {
                        if (ws.readyState !== ws.OPEN) {
                            clearInterval(procInterval)
                            return
                        }

                        ws.send(
                            JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'notify_proc_stat_update',
                                params: [
                                    {
                                        moonraker_stats: {
                                            time: Date.now() / 1000,
                                            cpu_usage: randomInRange(2, 15),
                                            memory: 85 + Math.floor(randomInRange(0, 10)),
                                            mem_units: 'MB',
                                        },
                                        network: {
                                            lo: { rx_bytes: randomInRange(1000, 5000), tx_bytes: randomInRange(1000, 5000) },
                                        },
                                        system_cpu_usage: {
                                            cpu: randomInRange(5, 25),
                                            cpu0: randomInRange(3, 20),
                                            cpu1: randomInRange(5, 30),
                                            cpu2: randomInRange(4, 22),
                                            cpu3: randomInRange(6, 28),
                                        },
                                        cpu_temp: getTemperature(42, 40, 2),
                                    },
                                    Date.now() / 1000,
                                ],
                            })
                        )
                    }, 3000)

                    // Simulate print progress if printing
                    const progressInterval = setInterval(() => {
                        if (ws.readyState !== ws.OPEN) {
                            clearInterval(progressInterval)
                            return
                        }

                        if (isPrinting) {
                            printElapsed += 5
                            printProgress = Math.min(100, printProgress + randomInRange(0.1, 0.3))

                            if (printProgress >= 100) {
                                isPrinting = false
                                printProgress = 100
                            }
                        }
                    }, 5000)

                    ws.on('close', () => {
                        clearInterval(tempInterval)
                        clearInterval(procInterval)
                        clearInterval(progressInterval)
                    })
                })
            })

            // ─── REST API Middleware ────────────────────────────────────────────
            // Mainsail also talks to Moonraker's HTTP API (database, files, etc).
            // Intercept those calls here.

            server.middlewares.use('/server/database/item', async (req, res) => {
                const url = new URL(req.url ?? '', `http://localhost`)
                const namespace = url.searchParams.get('namespace') ?? ''
                const key = url.searchParams.get('key') ?? ''

                if (req.method === 'GET') {
                    const value = dbStore[namespace]?.[key] ?? null
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ namespace, key, value }))
                } else if (req.method === 'POST') {
                    const body = await new Promise<string>((resolve) => {
                        let data = ''
                        req.on('data', (chunk) => (data += chunk))
                        req.on('end', () => resolve(data))
                    })
                    try {
                        const json = JSON.parse(body)
                        dbPost(json.namespace, json.key, json.value)
                    } catch {
                        /* ignore bad JSON */
                    }
                    res.setHeader('Content-Type', 'application/json')
                    res.end('"ok"')
                } else if (req.method === 'DELETE') {
                    dbDelete(namespace, key)
                    res.setHeader('Content-Type', 'application/json')
                    res.end('"ok"')
                } else {
                    res.statusCode = 405
                    res.end()
                }
            })

            // Serve theme default config (for initDb path)
            server.middlewares.use('/server/files/config', async (req, res) => {
                const filePath = req.url ?? ''
                if (filePath.includes('default.json')) {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({}))
                    return
                }
                res.statusCode = 404
                res.end()
            })

            // Generic gcode/files list endpoint
            server.middlewares.use('/server/files/list', async (req, res) => {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ result: getFileList() }))
            })
        },
    }
}
