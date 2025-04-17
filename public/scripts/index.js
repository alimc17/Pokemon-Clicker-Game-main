/*
// Set default value
window.pTotal = 0;

document.addEventListener("DOMContentLoaded", () => {
    // Just update the display — actual value will be set later in script.js
    document.querySelector('.p-total').textContent = window.pTotal;
});

// Clicking the pokeball increases pTotal
function incrementP() {
    window.pTotal++;
    document.querySelector('.p-total').textContent = window.pTotal;

    const user = firebase.auth().currentUser;
    if (user) {
        updateGameProgress({ gameData: { pTotal: window.pTotal } });
    } else {
        localStorage.setItem('guestProgress', window.pTotal.toString());
    }
}

// Save progress before page unloads
window.addEventListener('beforeunload', () => {
    const user = firebase.auth().currentUser;
    if (user) {
        updateGameProgress({ gameData: { pTotal: window.pTotal } });
    }
});

function buyUpg() {
    const upgCost = document.querySelector('.upg-cost');
    const upgLevel = document.querySelector('.upg-level')
    const cost = parseInt(upgCost.textContent);

    if (window.pTotal >= cost) {
        window.pTotal -= cost;
        document.querySelector('.p-total').textContent = window.pTotal;
        upgLevel.textContent = parseInt(upgLevel.textContent) + 1;

        const user = firebase.auth().currentUser;
        if (user) {
            updateGameProgress({ gameData: { pTotal: window.pTotal } });
        } else {
            localStorage.setItem('guestProgress', window.pTotal.toString());
        }
    }
}
*/

let pTotal = document.querySelector('.p-total');
let parsedPTotal = parseFloat(pTotal.innerHTML);
let ppcText = document.querySelector('.ppc-text');
let ppsText = document.querySelector('.pps-text');

let ppc = 1;
let pps = 0;

let pokeball = document.querySelector('.pokeball');

let pokemon = [];
let pokemonOfType = [];
const upgrades = [];

const clickSFX = new Audio('assets/audio/click.wav');
clickSFX.volume = 0.2;

async function getPokemon() {
    let url = 'https://pokeapi.co/api/v2/pokemon?limit=150';
    try {
        const response = await fetch(url);
        const data = await response.json();
        pokemon = data.results;
        console.log(`Fetched ${pokemon.length} Pokémon`);
    } catch (error) {
        console.error("Error fetching Pokémon:", error);
    }
}

function getPokemonIdFromUrl(url) {
    const parts = url.split('/');
    return parts[parts.length - 2];
}

function generateUpgrades(pokemonList) {
    const upgradeContainer = document.querySelector('.upgrades-container');
    upgradeContainer.innerHTML = '';

    const baseCost = 25;
    const baseIncrease = 1;
    const costMultiplier = 1.55;
    const powerMultiplier = 1.25;

    for (let i = 0; i < 15; i++) {
        const poke = pokemonList[i];
        const cost = Math.round(baseCost * Math.pow(costMultiplier, i));
        const increase = parseFloat((baseIncrease * Math.pow(powerMultiplier, i)).toFixed(2));

        const upgrade = {
            name: poke.name,
            cost: cost,
            increase: increase,
            level: 0,
            pMult: increase,
            costMult: costMultiplier,
            type: i === 0 ? 'click' : 'second'
        };

        upgrades.push(upgrade);

        const upgradeDiv = document.createElement('div');
        upgradeDiv.classList.add('upgrade');
        upgradeDiv.setAttribute('data-index', i);
        upgradeDiv.onclick = () => buyGeneratedUpgrade(i);

        upgradeDiv.innerHTML = `
            <div class="left-upg">
                <img class="upg-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getPokemonIdFromUrl(poke.url)}.png" alt="${poke.name}" draggable="false"/>
            </div>
            <div class="mid-upg">
                <h4>${poke.name.charAt(0).toUpperCase() + poke.name.slice(1)}</h4>
                <div class="cost-info">
                    <img class="p-upg-img" src="assets/images/pokedollar.png" alt="P" draggable="false"/>
                    <span class="upg-cost">${cost}</span>
                </div>
            </div>
            <div class="right-upg">
                <p>Level <span class="upg-level">0</span></p>
            </div>
            <div class="next-upg-info">
                <p>
                    +
                    <img class="p-upg-img" src="assets/images/pokedollar.png" alt="P" draggable="false"/>
                    <span class="upg-increase">${increase}</span>
                    per ${i === 0 ? 'click' : 'second'}
                </p>
            </div>
        `;

        upgradeContainer.appendChild(upgradeDiv);
    }
}

function buyGeneratedUpgrade(index) {
    const upgrade = upgrades[index];
    if (parsedPTotal >= upgrade.cost) {
        parsedPTotal -= upgrade.cost;
        pTotal.innerHTML = Math.round(parsedPTotal);

        upgrade.level++;
        upgrade.cost = Math.round(upgrade.cost * upgrade.costMult);
        
        if (upgrade.type === 'click') {
            ppc += upgrade.increase * upgrade.pMult;
        }
        else {
            pps += upgrade.increase * upgrade.pMult;
        }

        const upgradeDiv = document.querySelector(`.upgrade[data-index="${index}"]`);
        upgradeDiv.querySelector('.upg-cost').innerHTML = upgrade.cost;
        upgradeDiv.querySelector('.upg-level').innerHTML = upgrade.level;

        const pokeId = getPokemonIdFromUrl(pokemon[index].url);
        const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokeId}.ogg`;
        const cryAudio = new Audio(cryUrl);
        cryAudio.volume = 0.2;
        cryAudio.play();

    }
}

function incrementP(event) {
    clickSFX.playbackRate = 0.8 + Math.random() * 0.4;
    clickSFX.play();

    parsedPTotal += ppc;
    pTotal.innerHTML = Math.round(parsedPTotal);

    let x = event.clientX;
    let y = event.clientY;
    createSparkles(x, y);

    x = event.offsetX;
    y = event.offsetY;
    const div = document.createElement('div');
    div.innerHTML = `+${Math.round(ppc)}`;
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

document.addEventListener("DOMContentLoaded", () => {
    const gamblingBtn = document.querySelector(".gambling");
    const gamblingModal = document.getElementById("gambling-modal");
    const closeGamblingModal = document.getElementById("close-gambling-modal");
  
    gamblingBtn.addEventListener("click", () => {
      gamblingModal.style.display = "flex";
    });
  
    closeGamblingModal.addEventListener("click", () => {
      gamblingModal.style.display = "none";
    });
  
    window.addEventListener("click", (e) => {
      if (e.target === gamblingModal) {
        gamblingModal.style.display = "none";
      }
    });
});

setInterval(() => {
    parsedPTotal += pps / 10;
    pTotal.innerHTML = Math.round(parsedPTotal);
    ppcText.innerHTML = Math.round(ppc);
    ppsText.innerHTML = Math.round(pps);
}, 100);

(async () => {
    await getPokemon();
    generateUpgrades(pokemon);
})();