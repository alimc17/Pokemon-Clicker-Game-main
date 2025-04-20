const bgmFiles = [
    'assets/audio/music/AccumulaTown.mp3',
    'assets/audio/music/CasteliaCity.mp3',
    'assets/audio/music/IcirrusCity.mp3',
    'assets/audio/music/MistraltonCity.mp3',
    'assets/audio/music/NacreneCity.mp3',
    'assets/audio/music/NimbasaCity.mp3',
    'assets/audio/music/NuvemaTown.mp3',
    'assets/audio/music/OpelucidCity.mp3',
    'assets/audio/music/StriatonCity.mp3',
    'assets/audio/music/WhiteForest.mp3',
    'assets/audio/music/PalletTown.mp3',
    'assets/audio/music/PewterCity.mp3',
    'assets/audio/music/ViridianForest.mp3',
    'assets/audio/music/CeruleanCity.mp3',
    'assets/audio/music/VermillionCity.mp3',
    'assets/audio/music/CeladonCity.mp3',
    'assets/audio/music/CinnabarIsland.mp3',
    'assets/audio/music/SeviiIslands.mp3',
    'assets/audio/music/LavenderTown.mp3',
];
  
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let gainNodes = [audioCtx.createGain(), audioCtx.createGain()];
let sources = [null, null];
let current = 0;
let nextTrackIndex = Math.floor(Math.random() * bgmFiles.length);
let playlist = [...bgmFiles];

const volume = 0.1;

gainNodes[0].gain.value = volume;
gainNodes[1].gain.value = 0;
  
gainNodes[0].connect(audioCtx.destination);
gainNodes[1].connect(audioCtx.destination);
  
function shufflePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
}
  
function getNextTrack() {
    const track = playlist[nextTrackIndex];
    nextTrackIndex = (nextTrackIndex + 1) % playlist.length;
    return track;
}
  
async function loadTrack(url, nodeIndex) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNodes[nodeIndex]);
    source.onended = () => crossfade();
    return source;
  }
  
async function crossfade() {
    const old = current;
    const next = 1 - current;
    current = next;
  
    const nextTrack = getNextTrack();
    sources[next] = await loadTrack(nextTrack, next);
    const duration = sources[next].buffer.duration;
    const fadeTime = 5;
  
    sources[next].start();
  
    gainNodes[next].gain.setValueAtTime(0, audioCtx.currentTime);
    gainNodes[next].gain.linearRampToValueAtTime(volume, audioCtx.currentTime + fadeTime);
  
    gainNodes[old].gain.setValueAtTime(1, audioCtx.currentTime);
    gainNodes[old].gain.linearRampToValueAtTime(volume, audioCtx.currentTime + fadeTime);
}
  
async function startMusic() {
    shufflePlaylist();
    sources[current] = await loadTrack(getNextTrack(), current);
    sources[current].start();
}
  
document.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    startMusic();
}, { once: true });