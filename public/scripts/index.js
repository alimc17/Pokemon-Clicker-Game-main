let pTotal = 0;

function incrementP() {
    pTotal++;
    document.querySelector('.p-total').textContent = pTotal;

    updateGameProgress({pTotal: pTotal});
}