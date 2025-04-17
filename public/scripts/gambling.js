document.addEventListener("DOMContentLoaded", () => {
    const gamblingBtn = document.querySelector(".gambling");
    const gamblingModal = document.getElementById("gambling-modal");
    const modalContent = gamblingModal.querySelector(".modal-content");
    const closeGamblingModal = document.getElementById("close-gambling-modal");
  
    function openModal() {
        gamblingModal.style.display = "flex";
        modalContent.classList.remove("animate-out");
        gamblingModal.classList.remove("animate-out");
  
        modalContent.classList.add("animate-in");
        gamblingModal.classList.add("animate-in");
    }
  
    function closeModal() {
        modalContent.classList.remove("animate-in");
        gamblingModal.classList.remove("animate-in");
  
        modalContent.classList.add("animate-out");
        gamblingModal.classList.add("animate-out");
  
        setTimeout(() => {
            gamblingModal.style.display = "none";
        }, 200); // Match duration of fade-out
    }
  
    gamblingBtn.addEventListener("click", openModal);
    closeGamblingModal.addEventListener("click", closeModal);
  
    window.addEventListener("click", (e) => {
        if (e.target === gamblingModal) {
        closeModal();
        }
    });
});

const legendaries = [
    {
        name: 'Articuno',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/144.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/144.ogg',
    },
    {
        name: 'Zapados',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/145.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/145.ogg',
    },
    {
        name: 'Moltres',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/146.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/146.ogg',
    },
    {
        name: 'Mewtwo',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/150.ogg',
    },
    {
        name: 'Lugia',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/249.ogg',
    },
    {
        name: 'Ho-Oh',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/250.ogg',
    },
    {
        name: 'Kyogre',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/382.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/382.ogg',
    },
    {
        name: 'Groudon',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/383.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/383.ogg',
    },
    {
        name: 'Rayquaza',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/384.ogg',
    },
    {
        name: 'Dialga',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/483.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/483.ogg',
    },
    {
        name: 'Palkia',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/484.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/484.ogg',
    },
    {
        name: 'Regigigas',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/486.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/486.ogg',
    },
    {
        name: 'Girantina',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/487.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/487.ogg',
    },
    {
        name: 'Reshiram',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/643.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/643.ogg',
    },
    {
        name: 'Zekrom',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/644.png',
        cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/644.ogg',
    },
]

const unlockedLegendaries = new Array(15).fill(false);

const legendaryButton = document.querySelector('.buy-button');
legendaryButton.addEventListener('click', buyLegendary);

function buyLegendary() {
    if (parsedPTotal < 5) return;

    const lockedIndexes = unlockedLegendaries
        .map((unlocked, index) => !unlocked ? index : null)
        .filter(index => index !== null);

    if (lockedIndexes.length === 0) return;

    const randomIndex = lockedIndexes[Math.floor(Math.random() * lockedIndexes.length)];
    const legendary = legendaries[randomIndex];

    const slot = document.querySelector(`.question-slot[data-index="${randomIndex}"]`);
    slot.innerHTML = `<img src="${legendary.img}" alt="${legendary.name}" style="width: 100%; height: auto;" draggable="false"/>`;

    // Add tooltip and animation class
    slot.setAttribute('data-name', legendary.name);
    slot.classList.add('legendary-reveal');
    if (!slot.classList.contains('legendary-slot')) {
        slot.classList.add('legendary-slot');
    }

    // Mark as unlocked
    unlockedLegendaries[randomIndex] = true;

    const cryAudio = new Audio(legendary.cry);
    cryAudio.volume = 0.4;
    cryAudio.play();

    // Deduct pokédollars
    parsedPTotal -= 5;
    pTotal.innerHTML = Math.round(parsedPTotal);
}