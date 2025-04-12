let pTotal = document.querySelector('.p-total');

function incrementP() {
    pTotal.innerHTML++;

    updateGameProgress(pTotal.innerHTML);
}