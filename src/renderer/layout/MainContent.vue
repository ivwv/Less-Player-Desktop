<script setup>
import { useRouter } from 'vue-router';
import EventBus from '../../common/EventBus';
import { useAppCommonStore } from '../store/appCommonStore';
import { usePlatformStore } from '../store/platformStore';
import { useUserProfileStore } from '../store/userProfileStore';

const router = useRouter()
const { updateCurrentPlatformByCode } = usePlatformStore()
const { setExploreMode, setArtistExploreMode, setRadioExploreMode, setUserHomeExploreMode,
    hideAllCtxMenus, hidePlayingView, updateCommonCtxItem, setExitToHomeBtnVisible } = useAppCommonStore()
const { findCustomPlaylistIndex } = useUserProfileStore()

router.beforeResolve((to, from) => {
    console.log("[ ROUTE ] ==>>> " + to.path)
    autoSwitchExploreMode(to)
    highlightPlatform(to)
    highlightNavigationCustomPlaylist(to, from)
    hideRelativeComponents(to)
})

const highlightPlatform = (to) => {
    const path = to.path
    let code = ''
    if(path.includes('/square') || path.includes('/playlist')
         || path.includes('/artist')  || path.includes('/album')) {
        code = path.split('/')[3]
    } else if(path.includes('/local')) {
        code = 'local'
    } else if(path.includes('/userhome')) {
        const parts = path.split('/')
        // /userhome/{code}
        if(parts.length === 3) code = parts[2]
        // /userhome/customPlaylist/{id}
        if(parts.length === 4 && parts[2] === 'customPlaylist') code = 'all'
    } 
    updateCurrentPlatformByCode(code)
}

//TODO 数据量大时，可能有卡顿风险
const highlightNavigationCustomPlaylist = (to, from) => {
    const path = to.path
    let index = -1 
    if(path.includes('/customPlaylist/') 
        && !path.includes('/create') 
        && !path.includes('/edit')) {
        const id = path.split('/')[3]
        index = findCustomPlaylistIndex(id)
    }
    EventBus.emit("navigation-refreshCustomPlaylistIndex", index)
}

const autoSwitchExploreMode = (to) => {
    const path = to.path
    if(path.includes('/playlists/')) {
        setExploreMode(0)
    } else if(path.includes('/artists/')) {
        setArtistExploreMode()
    } else if(path.includes('/radios')) {
        setRadioExploreMode()
    }  else if(path.includes('/userhome')) {
        setUserHomeExploreMode()
    } else {
        //setExploreMode(0)
    }
}

const hideRelativeComponents = (to) => {
    //const path = to.path
    //TODO
    hidePlayingView()
    hideAllCtxMenus()
    updateCommonCtxItem(null)
}

const excludes = [ 'LocalMusicView', 'CustomPlaylistEditView',
    'UserInfoEditView', 'BatchActionView', 
    'DataBackupView', 'DataRestoreView' ]
</script>

<template>
    <div id="main-content">
        <router-view v-slot="{ Component }">
            <keep-alive :exclude="excludes" :max="12">
                <component :is="Component" />
            </keep-alive>
        </router-view>
    </div>  
</template>

<style>
#main-content {
    display: flex;
    flex: 1;
    overflow: auto;
    /*margin-right: 2px;*/
}
</style>