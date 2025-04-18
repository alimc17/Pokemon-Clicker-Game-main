window.pTotal = 0;
window.ppc = 1;
window.pps = 0;
window.prestigeLevel = 0;
window.upgrades = [];
window.rewardMultiplier = 1;

let pTotalElement = document.querySelector('.p-total');
window.pTotal = parseFloat(pTotalElement.innerHTML) || 0;
let ppcText = document.querySelector('.ppc-text');
let ppsText = document.querySelector('.pps-text');

window.ppc = 1;
window.pps = 0;

let pokeball = document.querySelector('.pokeball');

let pokemon = [];
let pokemonOfType = [];
let upgrades = [];

const clickSFX = new Audio('assets/audio/click.wav');
clickSFX.volume = 0.2;

let prestigeLevel = 0;
let rewardMultiplier = calculateRewardMultiplier(prestigeLevel);
const maxPrestige = 5;

const regionData = [
    { name: "Kanto", startId: 1, bg: "assets/videos/kanto.mp4" },
    { name: "Johto", startId: 152, bg: "assets/videos/johto.mp4" },
    { name: "Hoenn", startId: 252, bg: "assets/videos/hoenn.mp4" },
    { name: "Sinnoh", startId: 387, bg: "assets/videos/sinnoh.mp4" },
    { name: "Unova", startId: 495, bg: "assets/videos/unova.mp4" },
];

const prestigeButton = document.getElementById('prestige-button');
const regionNameEl = document.getElementById('region-name');
const prestigeLevelEl = document.getElementById('prestige-level');

const prestigeModal = document.getElementById('prestige-modal');
const closePrestigeModal = document.getElementById('close-prestige-modal');
const cancelPrestige = document.getElementById('cancel-prestige');
const confirmPrestige = document.getElementById('confirm-prestige');

const currentRegionEl = document.getElementById('prestige-current-region');
const nextRegionEl = document.getElementById('prestige-next-region');
const currentMultiplierEl = document.getElementById('prestige-current-multiplier');
const nextMultiplierEl = document.getElementById('prestige-next-multiplier');
const requiredPrestigeEl = document.getElementById('prestige-required');
const currentPrestigeEl = document.getElementById('prestige-current');
const progressBarEl = document.getElementById('prestige-progress-bar'); 

const PRESTIGE_REQUIREMENT = 100;

document.getElementById('prestige-button').addEventListener('click', openPrestigeModal);

closePrestigeModal.addEventListener('click', closeModal);
cancelPrestige.addEventListener('click', closeModal);
confirmPrestige.addEventListener('click', handlePrestigeConfirmation);

function calculateRewardMultiplier(level) {
    if (level === 0) return 1.0;
    return parseFloat((1.2 * level).toFixed(2));
}

function updatePrestigeModal() {
    currentRegionEl.textContent = regionData[prestigeLevel].name;
    nextRegionEl.textContent = prestigeLevel < maxPrestige - 1 ? 
                             regionData[prestigeLevel + 1].name : 
                             'Max Level Reached';

    const currentMult = calculateRewardMultiplier(prestigeLevel);
    const nextMult = calculateRewardMultiplier(prestigeLevel + 1);
    currentMultiplierEl.textContent = currentMult.toFixed(2);
    nextMultiplierEl.textContent = nextMult.toFixed(2);

    currentPrestigeEl.textContent = Math.round(window.pTotal);
    requiredPrestigeEl.textContent = PRESTIGE_REQUIREMENT;

    const progressPercentage = Math.min(100, (window.pTotal / PRESTIGE_REQUIREMENT) * 100);
    progressBarEl.style.width = `${progressPercentage}%`;

    if (window.pTotal >= PRESTIGE_REQUIREMENT && prestigeLevel < maxPrestige) {
        confirmPrestige.disabled = false;
    } else {
        confirmPrestige.disabled = true;
    }
}

function openPrestigeModal() {
    updatePrestigeModal();
    prestigeModal.style.display = 'flex';
}

function closeModal() {
    prestigeModal.style.display = 'none';
}

function handlePrestigeConfirmation() {
    if (window.pTotal >= PRESTIGE_REQUIREMENT && window.prestigeLevel < maxPrestige) {
        window.pTotal = 0;
        pTotalElement.innerHTML = window.pTotal;
        window.ppc = 1;
        window.pps = 0;
        window.upgrades = [];

        window.prestigeLevel++;
        window.rewardMultiplier = calculateRewardMultiplier(window.prestigeLevel);

        regionNameEl.innerText = regionData[window.prestigeLevel].name;
        prestigeLevelEl.innerText = window.prestigeLevel;
        ppcText.innerHTML = window.ppc;
        ppsText.innerHTML = window.pps;
        prestigeButton.disabled = window.prestigeLevel >= maxPrestige;

        if (currentMultiplierEl && nextMultiplierEl) {
            currentMultiplierEl.textContent = window.rewardMultiplier.toFixed(2);
            nextMultiplierEl.textContent = calculateRewardMultiplier(window.prestigeLevel + 1).toFixed(2);
        }

        const videoElement = document.querySelector('.bg-video');
        videoElement.querySelector('source').src = regionData[window.prestigeLevel].bg;
        videoElement.load();

        try {
            const prestigeSFX = new Audio('assets/audio/prestige.wav');
            prestigeSFX.volume = 0.3;
            prestigeSFX.play();
        } catch (error) {
            console.log("Prestige sound effect not found");
        }

        getPokemon(regionData[window.prestigeLevel].startId);
        
        closeModal();
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createSparkles(
                    Math.random() * window.innerWidth, 
                    Math.random() * window.innerHeight, 
                    30
                );
            }, i * 300);
        }
        
        // Save to Firebase/localStorage
        updateGameProgress({});
    }
}

function handlePrestige() {
    openPrestigeModal();
}

async function getPokemon(startId) {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${startId - 1}&limit=15`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        pokemon = data.results;
        generateUpgrades(pokemon);
    } catch (error) {
        console.error("Error fetching Pokémon for region:", error);
    }
}

function getPokemonIdFromUrl(url) {
    const match = url.match(/\/pokemon\/(\d+)\//);
    return match ? match[1] : "1";
}

function generateUpgrades(pokemonList) {
    const upgradeContainer = document.querySelector('.upgrades-container');
    upgradeContainer.innerHTML = '';

    const baseCost = prestigeLevel === 0 ? 25 : 25 * rewardMultiplier;
    const baseIncrease = 1;
    const costMultiplier = 1.55;
    const powerMultiplier = 1.25;

    upgrades.length = 0;

    for (let i = 0; i < 15; i++) {
        const poke = pokemonList[i];
        const cost = Math.round((baseCost * Math.pow(costMultiplier, i)));
        const increase = parseFloat((baseIncrease * Math.pow(powerMultiplier, i)).toFixed(2));

        const upgrade = {
            name: poke.name,
            cost: cost,
            increase: increase,
            level: 0,
            costMult: costMultiplier,
            type: i === 0 ? 'click' : 'second',
            visible: i === 0
        };

        upgrades.push(upgrade);
    }

    renderVisibleUpgrades();
}

function renderVisibleUpgrades() {
    const upgradeContainer = document.querySelector('.upgrades-container');
    upgradeContainer.innerHTML = '';
    
    upgrades.forEach((upgrade, index) => {
        if (!upgrade.visible) return;
        
        const effectiveMultiplier = prestigeLevel === 0 ? 1 : rewardMultiplier;
        
        let displayedIncome;
        if (upgrade.level > 0) {
            const nextLevelMultiplier = Math.pow(1.2, upgrade.level);
            displayedIncome = parseFloat((upgrade.increase * effectiveMultiplier * nextLevelMultiplier).toFixed(2));
        } else {
            displayedIncome = prestigeLevel === 0 ? 
                upgrade.increase : parseFloat((upgrade.increase * effectiveMultiplier).toFixed(2));
        }
        
        const upgradeDiv = document.createElement('div');
        upgradeDiv.classList.add('upgrade');
        upgradeDiv.setAttribute('data-index', index);
        upgradeDiv.onclick = () => buyGeneratedUpgrade(index);

        const pokeId = getPokemonIdFromUrl(pokemon[index].url);
        
        upgradeDiv.innerHTML = `
            <div class="left-upg">
                <img class="upg-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png" alt="${upgrade.name}" draggable="false"/>
            </div>
            <div class="mid-upg">
                <h4>${upgrade.name.charAt(0).toUpperCase() + upgrade.name.slice(1)}</h4>
                <div class="cost-info">
                    <img class="p-upg-img" src="assets/images/pokedollar.png" alt="P" draggable="false"/>
                    <span class="upg-cost">${upgrade.cost}</span>
                </div>
            </div>
            <div class="right-upg">
                <p>Level <span class="upg-level">${upgrade.level}</span></p>
            </div>
            <div class="next-upg-info">
                <p>
                    +
                    <img class="p-upg-img" src="assets/images/pokedollar.png" alt="P" draggable="false"/>
                    <span class="upg-increase">${displayedIncome}</span>
                    per ${upgrade.type === 'click' ? 'click' : 'second'}
                </p>
            </div>
        `;

        upgradeContainer.appendChild(upgradeDiv);
    });
}

function buyGeneratedUpgrade(index) {
    const upgrade = upgrades[index];
    if (window.pTotal >= upgrade.cost) {
        window.pTotal -= upgrade.cost;
        pTotalElement.innerHTML = Math.round(window.pTotal);

        upgrade.level++;
        upgrade.cost = Math.round(upgrade.cost * upgrade.costMult);

        if (upgrade.level === 1 && index + 1 < upgrades.length) {
            upgrades[index + 1].visible = true;
            renderVisibleUpgrades();
        }

        const effectiveMultiplier = window.prestigeLevel === 0 ? 1 : window.rewardMultiplier;
        
        const levelMultiplier = Math.pow(1.2, upgrade.level - 1);
        const currentIncome = parseFloat((upgrade.increase * effectiveMultiplier * levelMultiplier).toFixed(2));
        
        const nextLevelMultiplier = Math.pow(1.2, upgrade.level);
        const nextIncome = parseFloat((upgrade.increase * effectiveMultiplier * nextLevelMultiplier).toFixed(2));

        if (upgrade.type === 'click') {
            if (upgrade.level > 1) {
                const prevLevelMultiplier = Math.pow(1.2, upgrade.level - 2);
                const prevIncome = upgrade.increase * effectiveMultiplier * prevLevelMultiplier;
                window.ppc = window.ppc - prevIncome + currentIncome;
            } else {
                window.ppc += currentIncome;
            }
        } else {
            if (upgrade.level > 1) {
                const prevLevelMultiplier = Math.pow(1.2, upgrade.level - 2);
                const prevIncome = upgrade.increase * effectiveMultiplier * prevLevelMultiplier;
                window.pps = window.pps - prevIncome + currentIncome;
            } else {
                window.pps += currentIncome;
            }
        }

        if (upgrade.level > 1) {
            const upgradeDiv = document.querySelector(`.upgrade[data-index="${index}"]`);
            if (upgradeDiv) {
                upgradeDiv.querySelector('.upg-cost').innerHTML = upgrade.cost;
                upgradeDiv.querySelector('.upg-level').innerHTML = upgrade.level;
                upgradeDiv.querySelector('.upg-increase').innerHTML = nextIncome.toFixed(2);
            }
        }

        const pokeId = getPokemonIdFromUrl(pokemon[index].url);
        const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokeId}.ogg`;
        const cryAudio = new Audio(cryUrl);
        cryAudio.volume = 0.2;
        try {
            cryAudio.play();
        } catch (error) {
            console.log("Error playing Pokemon cry:", error);
        }
        
        ppcText.innerHTML = Math.round(window.ppc);
        ppsText.innerHTML = Math.round(window.pps);
        
        // Save after buying upgrade
        updateGameProgress({});
    }
}

function incrementP(event) {
    clickSFX.playbackRate = 0.8 + Math.random() * 0.4;
    clickSFX.play();

    window.pTotal += window.ppc;
    pTotalElement.innerHTML = Math.round(window.pTotal);

    let x = event.clientX;
    let y = event.clientY;
    createSparkles(x, y);

    x = event.offsetX;
    y = event.offsetY;
    const div = document.createElement('div');
    div.innerHTML = `+${Math.round(window.ppc)}`;
    div.style.cssText = `
        color: white;
        position: absolute;
        left: ${Math.random() * 50 + x}px;
        top: ${Math.random() * -50 + y}px;
        font-size: 20px;
        text-shadow: 1px 1px 5px black;
        pointer-events: none;
        user-select: none;
        draggable: false;
        transform: translate(-50%, -50%) rotate(${Math.random() * 10 - 5}deg);
    `;
    pokeball.appendChild(div);
    div.classList.add('fade-up');
    setTimeout(() => div.remove(), 800);
    updateGameProgress({});
}

function createSparkles(x, y, amount = 10) {
    for (let i = 0; i < amount; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        const dx = (Math.random() - 0.5) * 100 + 'px';
        const dy = (Math.random() - 1) * 100 + 'px';
        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.setProperty('--dx', dx);
        sparkle.style.setProperty('--dy', dy);
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 800);
    }
}

setInterval(() => {
    window.pTotal += window.pps / 10;
    pTotal.innerHTML = Math.round(window.pTotal);
    ppcText.innerHTML = Math.round(window.ppc);
    ppsText.innerHTML = Math.round(window.pps);
}, 100);

(async () => {
    getPokemon(regionData[prestigeLevel].startId);
    generateUpgrades(pokemon);
})();




function loadFromLocalStorage() {
    try {
        const savedProgress = localStorage.getItem('guestProgress');
        if (savedProgress) {
            const gameState = JSON.parse(savedProgress);
            applyGameState(gameState);
            console.log("Progress loaded from localStorage");
        }
    } catch (error) {
        console.error("Error loading local progress:", error);
    }
}
