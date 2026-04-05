class RadioWheel {
    constructor() {
        this.stations = [];
        this.selectedIndex = 0;
        this.currentStation = null;
        this.isOpen = false;
        this.inVehicle = false;
        this.wheelEl = document.getElementById('radio-wheel');
        this.stationsRing = document.getElementById('stations-ring');
        this.npTitle = document.getElementById('np-title');
        this.npArtist = document.getElementById('np-artist');
        this.nowPlaying = document.getElementById('now-playing');
        this.npBar = document.getElementById('now-playing-bar');
        this.npbTitle = document.getElementById('npb-title');
        this.npbArtist = document.getElementById('npb-artist');
        this.npbLogo = document.getElementById('npb-logo');
        this.npbStation = document.getElementById('npb-station');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');

        this.setupEvents();
    }

    setupEvents() {
        this.volumeSlider.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value);
            this.volumeValue.textContent = vol + '%';
            fetch('https://ob_radio_2/setVolume', {
                method: 'POST',
                body: JSON.stringify({ volume: vol / 100 })
            });
        });
    }

    get offSlotIndex() { return this.stations.length; }
    isOffSelected() { return this.selectedIndex === this.offSlotIndex; }
    get totalSlots() { return this.stations.length + 1; }

    open(stations, currentStation, volume) {
        this.stations = stations || [];
        this.currentStation = currentStation;
        this.selectedIndex = currentStation ? currentStation - 1 : this.offSlotIndex;
        this.isOpen = true;

        this.volumeSlider.value = Math.round((volume || 0.7) * 100);
        this.volumeValue.textContent = this.volumeSlider.value + '%';

        this.renderStations();
        this.wheelEl.classList.remove('hidden');
        this.hideNowPlayingBar();
    }

    close() {
        this.isOpen = false;
        this.wheelEl.classList.add('hidden');

        if (this.isOffSelected()) {
            if (this.currentStation !== null) {
                fetch('https://ob_radio_2/turnOff', { method: 'POST', body: '{}' });
                this.currentStation = null;
                this.hideNowPlayingBar();
                this.updateNowPlaying(null);
            }
        } else {
            const newStationIndex = this.selectedIndex + 1;
            if (this.stations[this.selectedIndex] && newStationIndex !== this.currentStation) {
                fetch('https://ob_radio_2/selectStation', {
                    method: 'POST',
                    body: JSON.stringify({ stationIndex: newStationIndex })
                });
            }
            if (this.currentStation || this.stations[this.selectedIndex]) {
                this.showNowPlayingBar();
            }
        }
    }

    renderStations() {
        this.stationsRing.innerHTML = '';
        this.stationsRing.style.transform = 'none';
        const total = this.totalSlots;
        const step = 360 / total;
        const radius = 300;
        const offIdx = this.offSlotIndex;

        const placeItem = (i, content, extraClasses, onClick) => {
            const angleDeg = 180 - (offIdx - i) * step;
            const el = document.createElement('div');
            el.className = 'station-item' + (extraClasses ? ' ' + extraClasses : '');
            el.dataset.index = i;
            el.dataset.angle = angleDeg;
            el.style.transform = `rotate(${angleDeg}deg) translateY(-${radius}px) rotate(${-angleDeg}deg)`;

            const inner = document.createElement('div');
            inner.className = 'icon-inner';
            if (content instanceof Node) {
                inner.appendChild(content);
            } else {
                inner.textContent = content;
            }
            el.appendChild(inner);

            el.addEventListener('click', onClick);
            this.stationsRing.appendChild(el);
        };

        this.stations.forEach((station, i) => {
            const extra = (this.currentStation === i + 1) ? 'active' : '';
            let content;
            if (station.logo) {
                content = document.createElement('img');
                content.src = 'img/' + station.logo;
                content.alt = station.label || '';
                content.onerror = () => { content.replaceWith(document.createTextNode('📻')); };
            } else {
                content = '📻';
            }
            placeItem(i, content, extra, () => { this.selectedIndex = i; this.updateSelection(); });
        });

        const offExtra = 'off-slot' + (this.currentStation === null ? ' active' : '');
        placeItem(offIdx, '⏻', offExtra, () => { this.selectedIndex = offIdx; this.updateSelection(); });

        this.updateSelection();
    }

    updateSelection() {
        const items = this.stationsRing.querySelectorAll('.station-item');

        items.forEach((el, i) => {
            const isSel = i === this.selectedIndex;
            el.classList.toggle('selected', isSel);
            const base = parseFloat(el.dataset.angle);
            const scale = isSel ? 1.7 : 1;
            el.style.transform = `rotate(${base}deg) translateY(-300px) rotate(${-base}deg) scale(${scale})`;
        });

        const centerLabel = document.getElementById('center-label');
        if (this.isOffSelected()) {
            centerLabel.textContent = 'Radio Off';
            this.nowPlaying.classList.add('hidden');
        } else {
            const station = this.stations[this.selectedIndex];
            if (station) {
                centerLabel.textContent = station.label;
                if (this.currentStation === this.selectedIndex + 1 && this.currentSong) {
                    this.npTitle.textContent = this.currentSong.title || '';
                    this.npArtist.textContent = this.currentSong.artist || '';
                    this.nowPlaying.classList.remove('hidden');
                } else {
                    this.nowPlaying.classList.add('hidden');
                }
            }
        }
    }

    scrollUp() {
        if (!this.isOpen) return;
        this.selectedIndex = (this.selectedIndex - 1 + this.totalSlots) % this.totalSlots;
        this.updateSelection();
    }

    scrollDown() {
        if (!this.isOpen) return;
        this.selectedIndex = (this.selectedIndex + 1) % this.totalSlots;
        this.updateSelection();
    }

    updateNowPlaying(song) {
        if (!song) {
            this.nowPlaying.classList.add('hidden');
            return;
        }
        this.npTitle.textContent = song.title || '';
        this.npArtist.textContent = song.artist || '';
        this.nowPlaying.classList.remove('hidden');
    }

    showNowPlayingBar() {
        if (!this.currentSong || !this.inVehicle) return;
        const { title = '', artist = '' } = this.currentSong;
        this.npbTitle.textContent = title;
        this.npbArtist.textContent = artist;
        this.npbStation.textContent = this.currentStationName || '';
        if (this.currentStationLogo) {
            this.npbLogo.src = 'img/' + this.currentStationLogo;
            this.npbLogo.style.display = '';
        } else {
            this.npbLogo.style.display = 'none';
        }
        this.npBar.classList.remove('hidden');
    }

    hideNowPlayingBar() {
        this.npBar.classList.add('hidden');
    }

    setInVehicle(inVehicle) {
        this.inVehicle = inVehicle;
        if (inVehicle && !this.isOpen && this.currentSong) this.showNowPlayingBar();
        else if (!inVehicle) this.hideNowPlayingBar();
    }

    setCurrentSong(song, station) {
        this.currentSong = song;
        if (station) {
            if (station.logo) this.currentStationLogo = station.logo;
            if (station.label) this.currentStationName = station.label;
        }
        this.updateNowPlaying(song);
        if (!this.isOpen) this.showNowPlayingBar();
    }
}

const radioWheel = new RadioWheel();
