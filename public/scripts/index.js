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
let upgCost = document.querySelector('.upg-cost');
let parsedUpgCost = parseFloat(upgCost.innerHTML);
let upgLevel = document.querySelector('.upg-level');
let upgIncrease = document.querySelector('.upg-increase');
let parsedUpgIncrease = parseFloat(upgIncrease.innerHTML);

let ppcText = document.querySelector('.ppc-text');
let ppsText = document.querySelector('.pps-text');
let ppc = 1;
let pps = 0;

let pokeball = document.querySelector('.pokeball');

let pokemon = [];
let pokemonOfType = [];
const typeNames = ["grass", "fire", "water"];

async function getPokemon() {
    let url = 'https://pokeapi.co/api/v2/pokemon';
    try {
        while (url) {
            const response = await fetch(url);
            const data = await response.json();
            
            pokemon = pokemon.concat(data.results);
            console.log(`Fetched ${pokemon.length} Pokémon so far...`);
            
            url = data.next;
        }
        console.log(`Completed! Total Pokémon fetched: ${pokemon.length}`);
    } catch (error) {
        console.error("Error fetching Pokémon:", error);
    }
}

async function getPokemonDetails(pokemonUrl) {
    const response = await fetch(pokemonUrl);
    const data = await response.json();
    return data.types;
}

async function filterPokemonByType(chosenType) {
    const chosenTypeName = typeNames[chosenType - 1];
    for (const poke of pokemon) {
        const types = await getPokemonDetails(poke.url);

        const hasChosenType = types.some(typeInfo => typeInfo.type.name === chosenTypeName);
        if (hasChosenType) {
            pokemonOfType.push(poke);
        }
    }
}

await getPokemon();
await filterPokemonByType(1);
console.log(pokemonOfType);

/*
//* im not testing this now im too tired
let upgrades = [];

async function createUpgradesForPokemon() {
    // Assuming pokemonOfType has already been populated
    for (const poke of pokemonOfType) {
        const pokemonDetails = await getPokemonDetails(poke.url);  // Fetch the Pokémon details (types)
        
        // Create the upgrade for each Pokémon
        const upgrade = {
            name: poke.name, // Pokémon name as the upgrade name
            cost: document.querySelector(`.${poke.name}-cost`), // Assuming you have elements with these class names
            parsedCost: parseFloat(document.querySelector(`.${poke.name}-cost`).innerHTML),
            increase: document.querySelector(`.${poke.name}-increase`), // Assuming you have elements with these class names
            parsedIncrease: parseFloat(document.querySelector(`.${poke.name}-increase`).innerHTML),
            level: document.querySelector(`.${poke.name}-level`), // Assuming you have elements with these class names
            gemMultiplier: 1.025,
            costMultiplier: 1.12,
        };
        
        upgrades.push(upgrade); // Push each upgrade to the array
    }
}

// Example usage:
await createUpgradesForPokemon();
console.log(upgrades); // Array of upgrades for each Pokémon of the selected type
*/

function incrementP(event) {
    parsedPTotal = parseFloat(pTotal.innerHTML);
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
    timeout(div);
}

const timeout = (div) => {
    setTimeout(() => {
        div.remove();
    }, 800)
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
  
      setTimeout(() => {
        sparkle.remove();
      }, 800);
    }
}

function buyUpg() {
    parsedPTotal = parseFloat(pTotal.innerHTML);
    parsedUpgCost = parseFloat(upgCost.innerHTML);
    parsedUpgIncrease = parseFloat(upgIncrease.innerHTML);

    if (parsedPTotal >= parsedUpgCost) {
        parsedPTotal -= parsedUpgCost;
        pTotal.innerHTML = Math.round(parsedPTotal);

        let level = parseInt(upgLevel.innerHTML);
        upgLevel.innerHTML = level + 1;

        parsedUpgIncrease = parseFloat((parsedUpgIncrease * 1.01).toFixed(2));
        upgIncrease.innerHTML = parsedUpgIncrease;

        ppc += parsedUpgIncrease;

        parsedUpgCost *= 1.2;
        upgCost.innerHTML = Math.round(parsedUpgCost);
    }
}

setInterval(() => {
    parsedPTotal += pps / 10;
    pTotal.innerHTML = Math.round(parsedPTotal);
    ppcText.innerHTML = Math.round(ppc);
    ppsText.innerHTML = Math.round(pps);
}, 100)