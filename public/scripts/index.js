// Initialize pTotal with guest progress or default to 0
window.pTotal = localStorage.getItem('guestProgress') 
              ? parseInt(localStorage.getItem('guestProgress')) 
              : 0;

// Initialize UI
document.querySelector('.p-total').textContent = window.pTotal;

function incrementP() {
    window.pTotal++;
    document.querySelector('.p-total').textContent = window.pTotal;
    
    const user = firebase.auth().currentUser;
    if (user) {
        updateGameProgress({ pTotal: window.pTotal });
    } else {
        localStorage.setItem('guestProgress', window.pTotal.toString());
    }
}