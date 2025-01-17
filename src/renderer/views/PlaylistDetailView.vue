<!--
<script>
//定义名称，方便用于<keep-alive>
export default {
    name: 'PlaylistDetailView'
}
</script>
-->

<script setup>
import { onMounted, onActivated, reactive, ref, watch } from 'vue';
import PlayAddAllBtn from '../components/PlayAddAllBtn.vue';
import { usePlatformStore } from '../store/platformStore'
import { usePlayStore } from '../store/playStore';
import SongListControl from '../components/SongListControl.vue';
import Back2TopBtn from '../components/Back2TopBtn.vue';
import { useAppCommonStore } from '../store/appCommonStore';
import FavoriteShareBtn from '../components/FavoriteShareBtn.vue';
import { useUserProfileStore } from '../store/userProfileStore';
import EventBus from '../../common/EventBus';

const { getVender } = usePlatformStore()
const { addTracks, resetQueue, playNextTrack } = usePlayStore()
const { showToast, hideAllCtxMenus } = useAppCommonStore()
const { addRecentPlaylist } = useUserProfileStore()

const props = defineProps({
    platform: String,
    id: String
})

const detail = reactive({})
const listSizeText = ref("0")
const playlistDetailRef = ref(null)
const back2TopBtnRef = ref(null)
let offset = 0, page = 1, limit = 1000
let markScrollTop = 0
const isLoading = ref(true)

const setLoading = (value) => {
    isLoading.value = value
}

const updateListSizeText = () => {
    const total = detail.total
    const length = detail.data.length
    const text = total > length ? `${length} / ${total}` : length
    listSizeText.value = text
}

const resetView = () => {
    Object.assign(detail, { cover: 'default_cover.png', title: '', about: '',data: [] })
    offset = 0
    page = 1
    detail.total = 0
    updateListSizeText()
}

const nextPage = () =>  {
    if(detail.data.length >= detail.total) return false
    //const totalPage = Math.ceil(detail.total * 1.0 / limit)
    //if(page == totalPage) return false
    offset = page * limit
    page = page + 1
    return true
}

const loadContent = (noLoadingMask) => {
    if(!noLoadingMask) setLoading(true)
    checkFavorite()
    
    const vender = getVender(props.platform)
    if(!vender) return 
    vender.playlistDetail(props.id, offset, limit, page)
        .then(result => {
        if(!result.data || result.data.length < 1) {
            page = page - 1
            offset = page * limit
            return 
        }
        if(page > 1) result.data.unshift(...detail.data)
        if(!result.total) detail.total = 0
        Object.assign(detail, result)
        updateListSizeText()
        setLoading(false)
    })
}

const loadMoreContent = () => {
    if(nextPage()) {
        loadContent(true)
    }
}

//目前以加入当前播放列表为参考标准
const traceRecentPlay = () => {
    const { id, platform, title, cover, type } = detail
    addRecentPlaylist(id, platform, title, cover, type)
}

const playAll = () => {
    resetQueue()
    addAll("即将为您播放全部！")
    playNextTrack()
}

const addAll = (text) => {
    addTracks(detail.data)
    showToast(text || "歌曲已全部添加！")
    traceRecentPlay()
}

//TODO
const { addFavoritePlaylist, removeFavoritePlaylist, isFavoritePlaylist } = useUserProfileStore()
const favorited = ref(false)
const toggleFavorite = () => {
    favorited.value = !favorited.value
    let text = "歌单收藏成功！"
    if(favorited.value) {
        const { title, cover } = detail
        addFavoritePlaylist(props.id, props.platform, title, cover)
    } else {
        removeFavoritePlaylist(props.id, props.platform)
        text = "歌单已取消收藏！"
    }
    showToast(text)
}

const checkFavorite = () => {
    favorited.value = isFavoritePlaylist(props.id, props.platform)
}

const markScrollState = () => {
    markScrollTop = playlistDetailRef.value.scrollTop
}

const resetScrollState = () => {
    markScrollTop = 0
    playlistDetailRef.value.scrollTop = markScrollTop
}

const restoreScrollState = () => {
    if(markScrollTop < 1) return 
    playlistDetailRef.value.scrollTop = markScrollTop
    checkFavorite()
}

const scrollToLoad = () => {
    if(isLoading.value) return
    const scrollTop = playlistDetailRef.value.scrollTop
    const scrollHeight = playlistDetailRef.value.scrollHeight
    const clientHeight = playlistDetailRef.value.clientHeight
    markScrollState()
    if((scrollTop + clientHeight) >= scrollHeight) {
       loadMoreContent()
    }
}

//TODO
const onScroll = () => {
    hideAllCtxMenus()
    scrollToLoad()
}

const resetBack2TopBtn = () => {
    back2TopBtnRef.value.setScrollTarget(playlistDetailRef.value)
}

onActivated(() => restoreScrollState())

watch(() => props.id, () => {
    resetView()
    resetScrollState()
    resetBack2TopBtn()
    loadContent()
})

onMounted(() => {
    resetView()
    resetBack2TopBtn()
    loadContent()
})

EventBus.on("refresh-favorite", checkFavorite)
</script>

<template>
    <div id="playlist-detail" ref="playlistDetailRef" @scroll="onScroll">
        <div class="header">
            <div>
                <img class="cover" v-lazy="detail.cover" />
            </div>
            <div class="right" v-show="!isLoading">
                <div class="title" v-html="detail.title"></div>
                <div class="about" v-html="detail.about"></div>
                <div class="action">
                    <PlayAddAllBtn :leftAction="playAll"  :rightAction="() => addAll()" class="btn-spacing">
                    </PlayAddAllBtn>
                    <FavoriteShareBtn :favorited="favorited" :leftAction="toggleFavorite">
                    </FavoriteShareBtn>
                </div>
            </div>
            <div class="right" v-show="isLoading">
                <div class="title">
                    <div class="loading-mask" style="width: 66%; height: 39px; display: inline-block;"></div>
                </div>
                <div class="about">
                    <div class="loading-mask" v-for="i in 3" style="width: 95%; height: 23px; display: inline-block;"></div>
                </div>
                <div class="action">
                    <div class="loading-mask btn-spacing" v-for="i in 2" style="width: 168px; height: 36px; display: inline-block;"></div>
                </div>
            </div>
        </div>
        <div class="center">
            <div class="list-title">
                <div class="size-text" v-show="!isLoading">列表({{ listSizeText }})</div>
                <div class="loading-mask" v-show="isLoading" style="text-align: left;width: 150px; height: 28px; display: inline-block;"></div>
            </div>
            <SongListControl :data="detail.data" 
                :artistVisitable="true" 
                :albumVisitable="true" 
                :loading="isLoading" >
            </SongListControl>
        </div>
        <Back2TopBtn ref="back2TopBtnRef"></Back2TopBtn>
    </div>
</template>

<style>
#playlist-detail {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 28px 33px 10px 33px;
    overflow: auto;
}

#playlist-detail .header {
    display: flex;
    flex-direction: row;
    margin-bottom: 25px;
}

#playlist-detail .header .right {
    flex: 1;
    margin-left: 25px;
}

#playlist-detail .header .title, 
#playlist-detail .header .about {
    text-align: left;
    margin-bottom: 10px;
}

#playlist-detail .header .title {
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 3px;

    overflow: hidden;
    word-wrap: break-all;
    white-space: pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

#playlist-detail .header .about {
    height: 139px;
    line-height: 23px;
    color: var(--text-sub-color);

    overflow: hidden;
    word-wrap: break-all;
    white-space:pre-wrap;
    line-break: anywhere;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
}

#playlist-detail .header .cover {
    width: 233px;
    height: 233px;
    border-radius: 6px;
    box-shadow: 0px 0px 10px #161616;
}

#playlist-detail .action {
    display: flex;
    flex-direction: row;
}

#playlist-detail .btn-spacing {
    margin-right: 20px;
}

#playlist-detail .list-title {
    margin-bottom: 3px;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
    background: var(--hl-text-bg);
    -webkit-background-clip: text;
    color: transparent;
}

#playlist-detail .list-title .size-text {
    margin-left: 3px;
}
</style>