import { defineStore } from 'pinia';
import EventBus from '../../common/EventBus';
import { useIpcRenderer } from '../../common/Utils';

const ipcRenderer = useIpcRenderer()

const THEMES = [{
    id: 'dark',
    name: '默认',
    bg: '#464646',
    dark: true
}, {
    id: 'light',
    name: '白色',
    bg: '#fafafa',
    dark: false
}, {
    id: 'pink',
    name: '粉色',
    //bg: '#e667af',
    bg: '#fc589c',
    dark: false
}, {
    id: 'red',
    name: '粉红',
    //bg: '#ef5350',
    bg: '#fc7688',
    dark: false
}, {
    id: 'green',
    name: '绿色',
    //bg: '#1ca388',
    bg: '#28c83f',
    dark: false
}, {
    id: 'blue',
    name: '蓝色',
    bg: '#56ccf2',
    dark: false
}, {
    id: 'yellow',
    name: '黄色',
    bg: '#ffb300',
    dark: false
}, {
    id: 'purple',
    name: '紫色',
    bg: '#9c27b0',
    dark: true
}]   

const QUALITIES = [{
    id: 'NQ',
    name: '普通'
}, {
    id: 'HQ',
    name: '高'
}, {
    id: 'SQ',
    name: '无损'
}]

//TODO 或许可能大概会实现吧......
export const useSettingStore = defineStore('setting', {
    state: ()=> ({
        /* 主题 */
        theme: {
            index: 0,
        },
        /* 播放歌曲 */
        track: {
            //音质级别：NQ(普通)、HQ（高音质）、SQ（超高、无损）
            quality: {
                index: 0,
            },  
            //VIP收费歌曲，是否自动切换到免费歌曲（可能来自不同平台），默认暂停播放
            vipTransfer: false,  
            //歌单分类栏随机显示
            categoryBarRandom: false, 
            //播放歌曲时，防止系统睡眠
            playingWithoutSleeping: false, 
        },
        /* 快捷键 */
        keys: {
            global: false, //是否全局（系统平台级别）快捷键
            data: [{
                id: 'togglePlayMode',
                name: '切换播放模式',
                binding: '',
                gBinding: ''
            }, {
                id: 'togglePlay',
                name: '播放/暂停',
                binding: 'Space',
                gBinding: ''
            }, {
                id: 'playPrev',
                name: '上一曲',
                binding: '',
                gBinding: ''
            }, {
                id: 'playNext',
                name: '下一曲',
                binding: '',
                gBinding: ''
            }, {
                id: 'toggleSearch',
                name: '打开/关闭搜索',
                binding: '',
                gBinding: ''
            }, {
                id: 'toggleSetting',
                name: '打开/关闭设置',
                binding: '',
                gBinding: ''
            }, {
                id: 'toggleCategory',
                name: '打开/关闭分类列表',
                binding: '',
                gBinding: ''
            }, {
                id: 'togglePlaybackQueue',
                name: '打开/关闭当前播放',
                binding: '',
                gBinding: ''
            }, {
                id: 'volumeUp',
                name: '增加音量',
                binding: '',
                gBinding: ''
            }, {
                id: 'volumeDown',
                name: '减小音量',
                binding: '',
                gBinding: ''
            }, {
                id: 'volumeMax',
                name: '最大音量',
                binding: '',
                gBinding: ''
            }, {
                id: 'volumeMute',
                name: '静音',
                binding: '',
                gBinding: ''
            }]
        },
        /* 菜单栏、系统托盘 */
        tray: {
            showMenu: false, //是否在系统托盘显示
        },
        /* 对话框 */
        dialog: {
            clearQueue: true,
            batchAdd: false,
            batchMove: true,
            batchDelete: true,
            restore: true,
            reset: true,
            quit: false,
        },
        /* 缓存 */
        cache: {
            storePlayState: true,  //退出后保存播放状态：包括当前歌曲、播放列表等
            storeLocalMusic: false, //退出后记录已经添加的本地歌曲
        },
        /* 其他 */
        other: { //TODO
            blockHole: null,
        },
    }),
    getters: {
        isPlaylistCategoryBarRandom(state) {
            return this.track.categoryBarRandom
        }
    },
    actions: {
        setThemeIndex(index) {
            this.theme.index = index
            const themeId = THEMES[index].id
            EventBus.emit("switchTheme", themeId)
        },
        getCurrentThemeId() {
            let index = this.theme.index
            index = index > 0 ? index : 0
            return THEMES[index].id
        },
        setTrackQualityIndex(index) {
            this.track.quality.index = index
        },
        toggleVipTransfer() {
            this.track.vipTransfer = !this.track.vipTransfer
        },
        toggleCategoryBarRandom() {
            this.track.categoryBarRandom = !this.track.categoryBarRandom
        },
        togglePlayingWithoutSleeping() {
            this.track.playingWithoutSleeping = !this.track.playingWithoutSleeping
            setupAppSuspension()
        },
        toggleTrayMenu() {
            this.tray.showMenu = !this.tray.showMenu
        },
        toggleKeysGlobal() {
            this.keys.global = !this.keys.global
        },
        toggleStorePlayState() {
            this.cache.storePlayState = !this.cache.storePlayState
        },
        toggleStoreLocalMusic() {
            this.cache.storeLocalMusic = !this.cache.storeLocalMusic
        },
        resetKeys() {
            
        },
        setupAppSuspension() {
            if(ipcRenderer) ipcRenderer.send("app-suspension", this.track.playingWithoutSleeping)
        },
        updateBlackHole(value) {
            this.other.blockHole = value
        },
        allThemes () {
            return THEMES
        },
        allQualities() {
            return QUALITIES
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                //key: 'setting',
                storage: localStorage,
                paths: [ 'theme', 'track', 'dialog', 'keys', 'tray', 'cache' ]
            },
        ],
    },
})