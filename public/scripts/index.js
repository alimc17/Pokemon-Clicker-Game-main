// Initialize with default 0 FIRST
window.pTotal = 0;

// Then check auth state BEFORE loading from localStorage
document.addEventListener("DOMContentLoaded", () => {
    const user = firebase.auth().currentUser; // Check auth state synchronously
    if (!user) {
        window.pTotal = parseInt(localStorage.getItem('guestProgress')) || 0;
    }
    document.querySelector('.p-total').textContent = window.pTotal;
});

function incrementP() {
    window.pTotal++;
    document.querySelector('.p-total').textContent = window.pTotal;
    
    const user = firebase.auth().currentUser;
    if (user) {
        // Use a nested object to prevent field collisions
        updateGameProgress({ gameData: { pTotal: window.pTotal } });
    } else {
        localStorage.setItem('guestProgress', window.pTotal.toString());
    }
}

window.addEventListener('beforeunload', () => {
    if (firebase.auth().currentUser) {
        // Force-save progress before page closes
        updateGameProgress({ gameData: { pTotal: window.pTotal } });
    }
});