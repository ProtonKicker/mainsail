import Dashboard from '../pages/Dashboard.vue'
import Webcam from '../pages/Webcam.vue'
import Farm from '../pages/Farm.vue'
import Console from '../pages/Console.vue'
import Files from '../pages/Files.vue'
import History from '../pages/History.vue'
import Timelapse from '../pages/Timelapse.vue'
import Machine from '../pages/Machine.vue'
import { AsyncComponent, Component } from 'vue'

const routes: AppRoute[] = [
    {
        name: 'dashboard',
        title: 'Dashboard',
        path: '/',
        icon: '📊',
        component: Dashboard,
        alwaysShow: true,
        showInNavi: true,
        position: 10,
    },
    {
        name: 'farm',
        title: 'Printers',
        path: '/allPrinters',
        component: Farm,
        alwaysShow: false,
        showInNavi: false,
    },
    {
        name: 'webcam',
        title: 'Webcam',
        path: '/cam',
        icon: '📷',
        component: Webcam,
        alwaysShow: true,
        showInNavi: true,
        position: 20,
        fullscreen: true,
    },
    {
        name: 'console',
        title: 'Console',
        path: '/console',
        icon: '⌨️',
        component: Console,
        alwaysShow: true,
        showInNavi: true,
        klipperIsConnected: true,
        position: 30,
    },
    {
        name: 'heightmap',
        title: 'Heightmap',
        path: '/heightmap',
        icon: '🗺️',
        component: () => import('../pages/Heightmap.vue'),
        alwaysShow: false,
        showInNavi: true,
        klipperComponent: 'bed_mesh',
        position: 40,
    },
    {
        name: 'gcodefiles',
        title: 'G-Code Files',
        path: '/files',
        icon: '📁',
        component: Files,
        alwaysShow: true,
        showInNavi: true,
        registeredDirectory: 'gcodes',
        position: 50,
        fullscreen: true,
    },
    {
        name: 'gcodeviewer',
        title: 'G-Code Viewer',
        path: '/viewer',
        icon: '🎬',
        component: () => import('../pages/Viewer.vue'),
        alwaysShow: true,
        showInNavi: true,
        position: 60,
        fullscreen: true,
    },
    {
        name: 'history',
        title: 'History',
        path: '/history',
        icon: '📜',
        component: History,
        alwaysShow: true,
        showInNavi: true,
        moonrakerComponent: 'history',
        position: 70,
    },
    {
        name: 'timelapse',
        title: 'Timelapse',
        path: '/timelapse',
        icon: '🎞️',
        component: Timelapse,
        alwaysShow: true,
        showInNavi: true,
        moonrakerComponent: 'timelapse',
        position: 80,
    },
    {
        name: 'machine',
        title: 'Machine',
        path: '/config',
        icon: '⚙️',
        component: Machine,
        alwaysShow: true,
        showInNavi: true,
        position: 90,
    },
    {
        title: null,
        component: null,
        alwaysShow: false,
        showInNavi: false,
        path: '/settings/machine',
        redirect: '/config',
    },
]

export default routes

export interface AppRoute {
    name?: string
    title: string | null
    path: string
    redirect?: string
    icon?: string
    component: Component | AsyncComponent | null
    alwaysShow: boolean
    showInNavi: boolean
    registeredDirectory?: string
    moonrakerComponent?: string
    klipperComponent?: string
    klipperIsConnected?: boolean
    children?: AppRoute[]
    position?: number
    fullscreen?: boolean
}
