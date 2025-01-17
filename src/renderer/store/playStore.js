import { defineStore } from 'pinia';
import { PLAY_MODE } from '../../common/Constants';
import EventBus from '../../common/EventBus';
import { Track } from '../../common/Track';
import { toMmss } from '../../common/Times';
import { Playlist } from '../../common/Playlist';

const NO_TRACK = new Track('0', '', '听你想听，爱你所爱', 
    [ { id: '0', name: '不枉青春' }], 
    { id: '0', name: '山川湖海，日月星辰' }, 
    0, 'default_cover.png')

export const usePlayStore = defineStore('play', {
    state: ()=> ({
        playing: false,
        playingIndex: -1,
        playMode: PLAY_MODE.REPEAT_ALL,
        queueTracks: [],
        //单位: ms
        currentTime: 0,
        //0.0 - 1.0
        progress: 0.0,
        //0.0 - 1.0
        volume: 0.5,
        //是否正在自动下一曲
        isAutoPlaying: false,
    }),
    getters: {
        currentTrack(state) {
            if(this.playingIndex < 0) return NO_TRACK
            return this.track(this.playingIndex)
        },
        isCurrentTrack(state) {
            return (track) => {
                return state.currentTrack.id == track.id
            }
        },
        track(state) {
            return (index) => {
                return state.queueTracks[index]
            }
        },
        noTrack() {
            return NO_TRACK
        },
        mmssCurrentTime() {
            return toMmss(this.currentTime)
        },
        queueTracksSize(state) {
            return state.queueTracks.length
        },
        hasLyric(state) {
            const track = state.currentTrack
            if(!track) return false
            const lyric = track.lyric
            if(!lyric) return false
            return lyric.data.size > 0
        }
    },
    actions: {
        setPlaying(value) {
            this.playing = value
        },
        togglePlay() {
            //FM广播
            if(Playlist.isFMRadioType(this.currentTrack)) {
                EventBus.emit('radio-togglePlay')
                return 
            }
            //播放列表为空
            if(this.queueTracksSize < 1) return
            //当前歌曲不存在或存在但缺少url
            if(!Track.hasUrl(this.currentTrack) 
                || NO_TRACK == this.currentTrack) {
                this.playNextTrack()
                return
            }
            //当前歌曲正常
            EventBus.emit('track-togglePlay')
        },
        addTrack(track) {
            //TODO 超级列表如何保证时效
            const index = this.queueTracks.findIndex((e, index) => Track.isEquals(track, e))
            if(index == -1) this.queueTracks.push(track)
        },
        addTracks(tracks) {
            //TODO 暂时不去重, 超级列表如何保证时效
            //this.queueTracks.push(...tracks)
            if(tracks.length < 1) return
            tracks.forEach(item => this.addTrack(item));
        },
        playTrackLater(track) {
            let index = this.queueTracks.findIndex((item, index) => Track.isEquals(track, item))
            if(index == -1) {
                index = this.playingIndex + 1
                this.queueTracks.splice(index, 0, track)
            } else if(index < this.playingIndex) {
                this.queueTracks.splice(this.playingIndex + 1, 0, track)
                this.queueTracks.splice(index, 1)
                --this.playingIndex
            } else if(index > this.playingIndex 
                && (index != this.playingIndex + 1)) {
                this.queueTracks.splice(this.playingIndex + 1, 0, track)
                this.queueTracks.splice(index + 1, 1)
            }
        },
        removeTrack(track) {
            const index = this.queueTracks.findIndex((item, index) => Track.isEquals(track, item))
            if(index > -1) {
                const isCurrent = (index == this.playingIndex)
                this.queueTracks.splice(index, 1)
                if(index <= this.playingIndex) {
                    --this.playingIndex
                }
                const maxSize = this.queueTracksSize
                if(maxSize < 1){
                    this.resetQueue()
                    return 
                }        
                if(isCurrent) {
                    if(this.playing) {
                        this.playNextTrack()
                    }
                } 
            }
        },
        resetQueue() {
            this.isAutoPlaying = false
            this.queueTracks.length = 0
            this.playingIndex = -1
            this.__resetPlayState()
            EventBus.emit('queue-empty')
        },
        __resetPlayState() {
            this.playing = false
            this.currentTime = 0
            this.progress = 0.0
        },
        __changeTrack(track) {
            if(Playlist.isFMRadioType(track)) {
                this.__resetPlayState()
                EventBus.emit('radio-play', track)
            } else {
                EventBus.emit('track-stop')
                EventBus.emit('track-changed', track)
                this.__resetPlayState()
            }
        },
        __validPlayingIndex() {
            const maxSize = this.queueTracksSize
            this.playingIndex = this.playingIndex > 0 ? this.playingIndex : 0
            this.playingIndex = this.playingIndex < maxSize ? this.playingIndex : (maxSize - 1)
        },
        playTrack(track) {
            //TODO
            //let index = this.queueTracks.indexOf(track)
            let index = this.queueTracks.findIndex((item, index) => Track.isEquals(track, item))
            if(index == -1) {
                index = this.playingIndex + 1
                this.queueTracks.splice(index, 0, track)
            }
            this.playingIndex = index
            //FM广播
            if(Playlist.isFMRadioType(track)) {
                EventBus.emit('radio-play', track)
                return
            }
            // 普通歌曲
            if(Track.hasUrl(track)) {
                EventBus.emit('track-play', track)
                if(!Track.hasLyric(track)) EventBus.emit('track-loadLyric', track)
            } else {
                this.__changeTrack(track)
            }
        },
        playPrevTrack() {
            //TODO
            const maxSize = this.queueTracksSize
            if(maxSize < 1) return
            switch(this.playMode) {
                case PLAY_MODE.REPEAT_ALL:
                    --this.playingIndex
                    this.playingIndex = this.playingIndex < 0 ? maxSize - 1 : this.playingIndex
                    break
                case PLAY_MODE.REPEAT_ONE:
                    break
                case PLAY_MODE.RANDOM:
                    break
            }
            this.__validPlayingIndex()
            this.__changeTrack(this.currentTrack)
        },
        playNextTrack() {
            //TODO
            if(Playlist.isNormalRadioType(this.currentTrack)) {
                EventBus.emit('radio-nextTrack', this.currentTrack)
                return 
            }
            const maxSize = this.queueTracksSize
            if(maxSize < 1) return
            switch(this.playMode) {
                case PLAY_MODE.REPEAT_ALL:
                    this.playingIndex = ++this.playingIndex % maxSize
                    break
                case PLAY_MODE.REPEAT_ONE:
                    break
                case PLAY_MODE.RANDOM:
                    this.playingIndex = Math.ceil(Math.random() * maxSize)
                    break
            }
            this.__validPlayingIndex()
            this.__changeTrack(this.currentTrack)
        },
        updateCurrentTime(secs) {
            this.currentTime = secs * 1000
            let duration = 0
            try {
                duration = this.currentTrack.duration
            } catch(error) {
                console.log(error)
            }
            this.progress = duration > 0 ? (this.currentTime / duration) : 0
        },
        updateVolume(value) {
            value = parseFloat(value)
            value = value > 0 ? value : 0
            value = value < 1 ? value : 1 
            this.volume = value
            EventBus.emit("volume-set", value)
        },
        updateVolumeByOffset(value) {
            value = parseFloat(value)
            this.updateVolume(this.volume + value)
        },
        toggleVolumeMute() {
            this.updateVolume(this.volume > 0 ? 0.0 : 1.0)
        },
        switchPlayMode() {
            this.playMode = ++this.playMode % 3
            //TODO
        },
        setAutoPlaying(value) {
            this.isAutoPlaying = value
        }
    },
    persist: {
        enabled: true,
        strategies: [
            {
                key: "player",
                storage: localStorage,
                paths: [ 'playingIndex', 'playMode', 'queueTracks', 'volume' ]
            }
        ]
    }
})