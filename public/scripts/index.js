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