// Cache bucket name — bump if you ever need to invalidate every client's
// persisted audio at once (e.g. after re-encoding the library).
const AUDIO_CACHE_NAME = 'ob_radio_2_v1';

class RadioAudio {
    constructor() {
        this.ctx = null;
        this.gainNode = null;
        this.filterNode = null;
        this.buffers = {};
        this.loading = {};
        this.source = null;
        this.currentFile = null;
        this.startOffset = 0;
        this.startCtxTime = 0;
        this.currentVolume = 0.7;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.ctx.createGain();
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 22000;
        this.filterNode.Q.value = 0.7;
        this.gainNode.connect(this.filterNode);
        this.filterNode.connect(this.ctx.destination);
    }

    async _loadBuffer(songFile) {
        if (!songFile || songFile === '.ogg') return null;
        if (this.buffers[songFile]) return this.buffers[songFile];
        if (this.loading[songFile]) return this.loading[songFile];

        // Absolute URLs → CDN; relative → local asset server under ./songs/.
        // Don't pre-encode: fetch() normalises fine and the FiveM asset server
        // matches globs after decoding, so a manual encode would double-decode.
        const isAbsolute = /^https?:\/\//i.test(songFile);
        const url = isAbsolute ? songFile : ('../songs/' + songFile);

        this.loading[songFile] = (async () => {
            try {
                // Two-tier cache:
                //   1. this.buffers — decoded AudioBuffers in RAM (fastest, lost on NUI reload)
                //   2. Cache API  — raw bytes persisted by CEF to disk for next session
                let arrayBuf = null;
                let cache = null;
                try {
                    cache = await caches.open(AUDIO_CACHE_NAME);
                    const cached = await cache.match(url);
                    if (cached) {
                        arrayBuf = await cached.arrayBuffer();
                    }
                } catch (_) { /* Cache API unavailable — fall through to network */ }

                if (!arrayBuf) {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    // Clone before reading: one copy for us, one for the cache.
                    if (cache) {
                        try { await cache.put(url, res.clone()); } catch (_) {}
                    }
                    arrayBuf = await res.arrayBuffer();
                }

                const buffer = await this.ctx.decodeAudioData(arrayBuf);
                this.buffers[songFile] = buffer;
                return buffer;
            } catch (e) {
                console.error('[ob_radio_2] failed to load ' + songFile + ' → ' + url + ': ' + e.message);
                return null;
            } finally {
                delete this.loading[songFile];
            }
        })();
        return this.loading[songFile];
    }

    // Admin-facing: wipe both cache tiers (useful after swapping CDN URLs or
    // re-encoding the library).
    async clearCache() {
        this.buffers = {};
        try {
            await caches.delete(AUDIO_CACHE_NAME);
            console.log('[ob_radio_2] audio cache cleared');
        } catch (e) {
            console.warn('[ob_radio_2] cache clear failed:', e);
        }
    }

    _stopCurrentSource() {
        if (this.source) {
            try { this.source.stop(); } catch (e) {}
            try { this.source.disconnect(); } catch (e) {}
            this.source = null;
        }
    }

    async play(songFile, offset, volume) {
        this.init();
        this.currentVolume = volume || 0.7;
        if (this.gainNode) this.gainNode.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.03);

        const buffer = await this._loadBuffer(songFile);
        if (!buffer) return;

        // Same song + small drift? Don't re-seek.
        if (this.currentFile === songFile && this.source) {
            const elapsed = this.ctx.currentTime - this.startCtxTime;
            const currentPos = (this.startOffset + elapsed) % buffer.duration;
            const drift = Math.abs(currentPos - (offset || 0));
            if (drift <= 3) return;
        }

        this._stopCurrentSource();

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = false;
        source.connect(this.gainNode);

        const startAt = (offset || 0) % buffer.duration;
        source.start(0, startAt);

        this.source = source;
        this.currentFile = songFile;
        this.startOffset = startAt;
        this.startCtxTime = this.ctx.currentTime;
    }

    stop() {
        this._stopCurrentSource();
        this.currentFile = null;
    }

    setVolume(vol) {
        this.currentVolume = Math.max(0, Math.min(1, vol));
        if (this.gainNode) {
            // Longer time constant = smoother transitions (env changes, car entry/exit)
            this.gainNode.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.18);
        }
    }

    setFilter(frequency) {
        if (this.filterNode) {
            this.filterNode.frequency.setTargetAtTime(
                Math.max(200, Math.min(22000, frequency)),
                this.ctx.currentTime,
                0.22
            );
        }
    }

    updateSpatial(spatial) {
        if (!spatial) return;
        this.setVolume(spatial.volume);
        this.setFilter(spatial.filterFreq);
    }

    changeSong(songFile, offset) {
        this.play(songFile, offset, this.currentVolume);
    }
}

const radioAudio = new RadioAudio();
