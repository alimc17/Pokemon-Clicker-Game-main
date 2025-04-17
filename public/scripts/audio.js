const bgmFiles = [
    'assets/audio/AccumulaTown.mp3',
    'assets/audio/CasteliaCity.mp3',
    'assets/audio/IcirrusCity.mp3',
    'assets/audio/MistraltonCity.mp3',
    'assets/audio/NacreneCity.mp3',
    'assets/audio/NimbasaCity.mp3',
    'assets/audio/NuvemaTown.mp3',
    'assets/audio/OpelucidCity.mp3',
    'assets/audio/StriatonCity.mp3',
    'assets/audio/WhiteForest.mp3'
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