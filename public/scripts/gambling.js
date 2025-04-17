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
        name: 'Mewtwo',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    },
    {
        name: 'Lugia',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
    },
    {
        name: 'Ho-Oh',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png',
    },
    {
        name: 'Latias',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/380.png',
    },
    {
        name: 'Latios',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/381.png',
    },
    {
        name: 'Lugia',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
    },
    {
        name: 'Mewtwo',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    },
    {
        name: 'Lugia',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
    },
    {
        name: 'Mewtwo',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    },
    {
        name: 'Lugia',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
    },
]