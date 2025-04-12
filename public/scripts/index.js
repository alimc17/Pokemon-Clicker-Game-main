let pTotal = localStorage.getItem('guestProgress')
             ? parseInt(localStorage.getItem('guestProgress'))
             : 0;

// Initialize UI
document.querySelector('.p-total').textContent = pTotal;

function incrementP() {
    pTotal++;
    document.querySelector('.p-total').textContent = pTotal;
    
    const user = firebase.auth().currentUser;
    if (user) {
        updateGameProgress({ pTotal: pTotal });
    } else {
        localStorage.setItem('guestProgress', pTotal.toString());
    }
}