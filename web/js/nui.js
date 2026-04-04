window.addEventListener('message', function(event) {
    const data = event.data;

    switch (data.action) {
        case 'openWheel':
            radioWheel.open(data.stations, data.currentStation, data.volume);
            break;

        case 'closeWheel':
            radioWheel.close();
            break;

        case 'scrollUp':
            radioWheel.scrollUp();
            break;

        case 'scrollDown':
            radioWheel.scrollDown();
            break;

        case 'playStation':
            if (data.song && data.song.file) {
                radioAudio.play(data.song.file, data.offset || 0, data.volume || 0.7);
                radioWheel.currentStation = data.stationIndex;
                radioWheel.setCurrentSong(data.song);
            }
            if (data.spatial) radioAudio.updateSpatial(data.spatial);
            break;

        case 'stopAudio':
            radioAudio.stop();
            radioWheel.currentStation = null;
            radioWheel.currentSong = null;
            radioWheel.hideNowPlayingBar();
            radioWheel.updateNowPlaying(null);
            break;

        case 'songChanged':
            if (data.song && data.song.file) {
                radioAudio.changeSong(data.song.file, data.offset || 0);
                radioWheel.setCurrentSong(data.song);
            }
            break;

        case 'setVolume':
            radioAudio.setVolume(data.volume);
            break;

        case 'updateSpatial':
            radioAudio.updateSpatial(data.spatial);
            break;

        case 'setInVehicle':
            radioWheel.setInVehicle(!!data.inVehicle);
            break;
    }
});

document.addEventListener('contextmenu', e => e.preventDefault());
