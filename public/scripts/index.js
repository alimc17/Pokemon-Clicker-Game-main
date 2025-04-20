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

const clickSFX = new Audio('assets/audio/sfx/click.wav');
clickSFX.volume = 0.2;

let rewardMultiplier = calculateRewardMultiplier(window.prestigeLevel);
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
const progressButtonEl = document.getElementById('prestige-button-progress'); 

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
    currentRegionEl.textContent = regionData[window.prestigeLevel].name;
    nextRegionEl.textContent = window.prestigeLevel < maxPrestige - 1 ? 
                             regionData[window.prestigeLevel + 1].name : 
                             'Max Level Reached';

    const currentMult = calculateRewardMultiplier(window.prestigeLevel);
    const nextMult = calculateRewardMultiplier(window.prestigeLevel + 1);
    currentMultiplierEl.textContent = currentMult.toFixed(2);
    nextMultiplierEl.textContent = nextMult.toFixed(2);

    currentPrestigeEl.textContent = Math.round(window.pTotal);
    requiredPrestigeEl.textContent = PRESTIGE_REQUIREMENT;

    const progressPercentage = Math.min(100, (window.pTotal / PRESTIGE_REQUIREMENT) * 100);
    progressBarEl.style.width = `${progressPercentage}%`;
    progressButtonEl.style.width = `${progressPercentage}%`; 

    if (window.pTotal >= PRESTIGE_REQUIREMENT && window.prestigeLevel < maxPrestige) {
        confirmPrestige.disabled = false;
    } else {
        confirmPrestige.disabled = true;
    }
}

function updatePrestigeButtonProgress() {
    const progressPercentage = Math.min(100, (window.pTotal / PRESTIGE_REQUIREMENT) * 100);
    if (progressButtonEl) {
        progressButtonEl.style.width = `${progressPercentage}%`;
    }
}

function openPrestigeModal() {
    updatePrestigeModal();
    prestigeModal.style.display = 'flex';
}

function closeModal() {
    prestigeModal.style.display = 'none';
}

async function handlePrestigeConfirmation() {

    const user = firebase.auth().currentUser;
    if (!user) {
        // Close the prestige modal
        closeModal();
        
        // Show login required message
        showLoginRequiredModal();
        return;
    }

    if (window.pTotal < PRESTIGE_REQUIREMENT || window.prestigeLevel >= maxPrestige) return;
    
    window.pTotal = 0;
    pTotalElement.innerHTML = window.pTotal;
    window.ppc = 1;
    window.pps = 0;
    window.upgrades = [];
    
    if (window.berries) {
        window.berries.forEach(berry => {
            berry.purchased = false;
            berry.visible = false;
        });
        window.berries[0].visible = true;
        window.purchasedBerries = [];
        renderVisibleBerries();
    }

    window.prestigeLevel++;
    window.rewardMultiplier = calculateRewardMultiplier(window.prestigeLevel);

    updatePrestigeModal();
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
        const prestigeSFX = new Audio('assets/audio/sfx/prestige.wav');
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
    
    updateGameProgress({});
    
}

function showLoginRequiredModal() {
    // Create modal if it doesn't exist already
    let loginModal = document.getElementById('login-required-modal');
    
    if (!loginModal) {
        loginModal = document.createElement('div');
        loginModal.id = 'login-required-modal';
        loginModal.className = 'modal';
        
        loginModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Login Required</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p>You need to be logged in to use the Prestige feature!</p>
                    <p>Login to save your progress and unlock additional features.</p>
                </div>
                <div class="modal-footer">
                    <button id="login-redirect-btn" class="btn-custom">Login</button>
                    <button id="cancel-login-btn" class="btn-custom btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(loginModal);
        
        // Add event listeners
        loginModal.querySelector('.close-modal').addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        
        loginModal.querySelector('#cancel-login-btn').addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        
        loginModal.querySelector('#login-redirect-btn').addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    
    // Show the modal
    loginModal.style.display = 'flex';
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

    const baseCost = window.prestigeLevel === 0 ? 25 : 25 * rewardMultiplier;
    const baseIncrease = 1;
    const costMultiplier = 1.55;
    const powerMultiplier = 1.25;

    window.upgrades.length = 0;

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

        window.upgrades.push(upgrade);
    }

    renderVisibleUpgrades();
}

function renderVisibleUpgrades() {
    const upgradeContainer = document.getElementById('pokemon-container') || document.querySelector('.upgrades-container');
    upgradeContainer.innerHTML = '';
    
    window.upgrades.forEach((upgrade, index) => {
        if (!upgrade.visible) return;
        
        const effectiveMultiplier = window.prestigeLevel === 0 ? 1 : rewardMultiplier;
        
        let displayedIncome;
        if (upgrade.level > 0) {
            const nextLevelMultiplier = Math.pow(1.2, upgrade.level);
            displayedIncome = parseFloat((upgrade.increase * effectiveMultiplier * nextLevelMultiplier).toFixed(2));
        } else {
            displayedIncome = window.prestigeLevel === 0 ? 
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
    const upgrade = window.upgrades[index];
    if (window.pTotal >= upgrade.cost) {
        window.pTotal -= upgrade.cost;
        pTotalElement.innerHTML = Math.round(window.pTotal);

        upgrade.level++;
        upgrade.cost = Math.round(upgrade.cost * upgrade.costMult);

        if (upgrade.level === 1 && index + 1 < window.upgrades.length) {
            window.upgrades[index + 1].visible = true;
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
        
        updateGameProgress({});
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.berriesLoaded) {
        fetchBerries();
    }
    
    const gamblingButton = document.querySelector('.gambling');
    if (gamblingButton) {
        gamblingButton.addEventListener('click', function() {
            const gamblingModal = document.getElementById('gambling-modal');
            if (gamblingModal) {
                gamblingModal.style.display = 'flex';
            }
        });
    }
});

window.berries = [];
window.berriesLoaded = false;
window.purchasedBerries = [];

document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    
    if (!window.berriesLoaded) {
        fetchBerries();
    }
});

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    const pokemonContainer = document.getElementById('pokemon-container');
    const berriesContainer = document.getElementById('berries-container');

    if (tabName === 'pokemon') {
        pokemonContainer.style.display = 'flex';
        berriesContainer.style.display = 'none';
    } else if (tabName === 'berries') {
        pokemonContainer.style.display = 'none';
        berriesContainer.style.display = 'flex';
        
        if (window.berriesLoaded && !hasVisibleBerry()) {
            showNextBerry();
        }
    }
}

async function fetchBerries() {
    try {
        const allBerries = [];
        let url = 'https://pokeapi.co/api/v2/berry/?limit=43';
        
        const response = await fetch(url);
        const data = await response.json();
        
        window.berries = data.results.slice(0, 43).map((berry, index) => {
            const id = getBerryIdFromUrl(berry.url);
            const baseCost = 100 * Math.pow(5, index);
            const multiplierValue = calculateBerryMultiplier(index);
            
            return {
                id: id,
                name: berry.name,
                url: berry.url,
                cost: Math.round(baseCost),
                multiplier: multiplierValue,
                visible: index === 0,
                purchased: false,
                effect: index % 2 === 0 ? 'click' : 'second'
            };
        });
        
        window.berriesLoaded = true;
        renderVisibleBerries();
        
        fetchBerryDetails();
        
    } catch (error) {
        console.error("Error fetching berries:", error);
    }
}

function getBerryIdFromUrl(url) {
    const match = url.match(/\/berry\/(\d+)\//);
    return match ? match[1] : "1";
}

function calculateBerryMultiplier(index) {
    const baseMultiplier = 0.2 + (index * 0.1);
    const randomFactor = 1 + (Math.random() * 0.2 - 0.1);
    return parseFloat((baseMultiplier * randomFactor).toFixed(2));
}

async function fetchBerryDetails() {
    for (let berry of window.berries) {
        try {
            const response = await fetch(berry.url);
            const data = await response.json();
            
            const itemResponse = await fetch(data.item.url);
            const itemData = await itemResponse.json();
            
            berry.sprite = itemData.sprites.default;
            
            const berryElement = document.querySelector(`.berry-upgrade[data-id="${berry.id}"]`);
            if (berryElement) {
                const imgElement = berryElement.querySelector('.berry-img');
                if (imgElement && berry.sprite) {
                    imgElement.src = berry.sprite;
                }
            }
        } catch (error) {
            console.error(`Error fetching details for berry ${berry.name}:`, error);
        }
    }
}

function renderVisibleBerries() {
    const berriesContainer = document.getElementById('berries-container');
    if (!berriesContainer) return;
    
    berriesContainer.innerHTML = '';
    
    window.berries.forEach((berry, index) => {
        if (!berry.visible) return;
        
        const berryDiv = document.createElement('div');
        berryDiv.classList.add('berry-upgrade');
        berryDiv.setAttribute('data-id', berry.id);
        berryDiv.setAttribute('data-index', index);
        
        if (berry.purchased) {
            berryDiv.classList.add('purchased');
        } else {
            berryDiv.onclick = () => buyBerry(index);
        }
        
        const spriteUrl = berry.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/berries/${berry.name}-berry.png`;
        
        const currentValueType = berry.effect === 'click' ? window.ppc : window.pps;
        const newValue = Math.round(currentValueType * (1 + berry.multiplier));
        const increaseAmount = Math.round(newValue - currentValueType);
        
        berryDiv.innerHTML = `
            <div class="left-upg">
                <img class="berry-img" src="${spriteUrl}" alt="${berry.name}" draggable="false"/>
            </div>
            <div class="mid-upg">
                <h4>${berry.name.charAt(0).toUpperCase() + berry.name.slice(1)} Berry</h4>
                <div class="cost-info">
                    <img class="p-upg-img" src="assets/images/pokedollar.png" alt="P" draggable="false"/>
                    <span class="upg-cost">${berry.purchased ? 'Purchased' : berry.cost}</span>
                </div>
            </div>
            <div class="right-upg">
                <p>${berry.purchased ? 'Active' : 'Inactive'}</p>
            </div>
            <div class="next-upg-info berry-info-tooltip">
                <p class="berry-gain">+${increaseAmount} per ${berry.effect}</p>
                <p class="berry-multiplier-value">(×${berry.multiplier + 1} multiplier)</p>
            </div>
        `;
        
        berriesContainer.appendChild(berryDiv);
    });
}

function buyBerry(index) {
    const berry = window.berries[index];
    if (!berry || berry.purchased || window.pTotal < berry.cost) return;
    
    window.pTotal -= berry.cost;
    pTotalElement.innerHTML = Math.round(window.pTotal);
    
    berry.purchased = true;
    window.purchasedBerries.push(berry);
    
    if (berry.effect === 'click') {
        window.ppc *= (1 + berry.multiplier);
        ppcText.innerHTML = Math.round(window.ppc);
    } else {
        window.pps *= (1 + berry.multiplier);
        ppsText.innerHTML = Math.round(window.pps);
    }
    
    const berrySFX = new Audio('assets/audio/sfx/berry.mp3');
    berrySFX.volume = 0.3;
    berrySFX.playbackRate = 1.5;
    berrySFX.play();
    
    renderVisibleBerries();
    
    showNextBerry();
    
    updateGameProgress({});
}

function showNextBerry() {
    let foundNext = false;
    
    for (let i = 0; i < window.berries.length; i++) {
        if (window.berries[i].visible && !window.berries[i].purchased) {
            foundNext = true;
            break;
        }
    }
    
    if (!foundNext) {
        for (let i = 0; i < window.berries.length; i++) {
            if (!window.berries[i].purchased) {
                window.berries[i].visible = true;
                renderVisibleBerries();
                break;
            }
        }
    }
}

function hasVisibleBerry() {
    return window.berries.some(berry => berry.visible && !berry.purchased);
}

window.updateGameProgress = function(data) {
    data.purchasedBerries = window.purchasedBerries.map(berry => berry.id);
    data.berries = window.berries;
    
    originalUpdateGameProgress(data);
};

const originalApplyGameState = window.applyGameState || function() {};

window.applyGameState = function(gameState) {
    originalApplyGameState(gameState);
    
    if (gameState.berries) {
        window.berries = gameState.berries;
        window.berriesLoaded = true;
    }
    
    window.purchasedBerries = [];

    if (gameState.purchasedBerries && Array.isArray(gameState.purchasedBerries)) {
        gameState.purchasedBerries.forEach(berryId => {
            const berry = window.berries.find(b => b.id === berryId);
            if (berry) {
                berry.purchased = true;
                window.purchasedBerries.push(berry);
            }
        });
    }
    
    renderVisibleBerries();
};

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
    updatePrestigeButtonProgress();
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
  
    pTotalElement.innerHTML = Math.round(window.pTotal);
  
    ppcText.innerHTML   = Math.round(window.ppc);
    ppsText.innerHTML   = Math.round(window.pps);

  }, 100);

setInterval(() => {
    updateGameProgress({});
    updatePrestigeButtonProgress();
}, 5000);
    
(async () => {
    getPokemon(regionData[window.prestigeLevel].startId);
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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the sticker wall modal elements
    const stickerWallModal = document.getElementById('stickerwall-modal');
    const stickerWallToggle = document.getElementById('stickerwall-toggle');
    const closeStickerWallModal = document.getElementById('close-stickerwall-modal');
    
    // Open the sticker wall modal when the toggle button is clicked
    stickerWallToggle.addEventListener('click', function() {
      stickerWallModal.style.display = 'flex';
    });
    
    // Close the sticker wall modal when the close button is clicked
    closeStickerWallModal.addEventListener('click', function() {
      stickerWallModal.style.display = 'none';
    });
    
    // Close the sticker wall modal when clicking outside of it
    window.addEventListener('click', function(event) {
      if (event.target === stickerWallModal) {
        stickerWallModal.style.display = 'none';
      }
    });
  
    // Don't forget to remove the original sticker wall element from the main page
    // You can use JavaScript to hide it if needed
    const originalStickerWall = document.getElementById('sticker-wall');
    if (originalStickerWall) {
      originalStickerWall.style.display = 'none';
    }
  });