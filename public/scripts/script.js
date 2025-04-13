// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const leftNav = document.getElementById('nav-left');
    const rightNav = document.getElementById('nav-right');

    auth.onAuthStateChanged(user => {
        updateNav(user);

        if (user) {
            loadGameProgress(user.uid);
        } else {
            // ONLY load guest data if no user exists
            if (!firebase.auth().currentUser) {
                const guestProgress = localStorage.getItem('guestProgress');
                if (guestProgress) {
                    window.pTotal = parseInt(guestProgress);
                    document.querySelector('.p-total').textContent = window.pTotal;
                }
            }
        }
    });
});

function updateNav(user) {
    const leftNav = document.getElementById('nav-left');
    const rightNav = document.getElementById('nav-right');

    if (!leftNav || !rightNav) {
        console.warn("Nav elements not found in the DOM.");
        return;
    }

    // Clear previous content but keep title
    while (leftNav.children.length > 1) {
        leftNav.removeChild(leftNav.lastChild);
    }
    rightNav.innerHTML = "";

    if (user) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.textContent = `Welcome, ${user.username}`;
        leftNav.appendChild(welcomeMsg);

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.classList.add('nav-button');
        logoutBtn.onclick = () => {
            if (!localStorage.getItem('guestProgress')) {
                localStorage.setItem('guestProgress', window.pTotal.toString());
            }
            auth.signOut().then(() => location.reload());
        };
        rightNav.appendChild(logoutBtn);

    } else {
        const loginBtn = document.createElement('a');
        loginBtn.href = 'login.html';
        loginBtn.textContent = 'Login';
        loginBtn.classList.add('nav-button');

        const signupBtn = document.createElement('a');
        signupBtn.href = 'signup.html';
        signupBtn.textContent = 'Sign Up';
        signupBtn.classList.add('nav-button');

        rightNav.appendChild(loginBtn);
        rightNav.appendChild(signupBtn);

        const welcome = leftNav.querySelector('.welcome-msg');
        if (welcome) welcome.remove();
    }
}

function loadGameProgress(uid) {
    db.collection("users").doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                console.log("Loaded progress:", data);

                if (data.gameData && typeof data.gameData.pTotal === 'number') {
                    window.pTotal = data.gameData.pTotal;
                    document.querySelector('.p-total').textContent = window.pTotal;
                }
            } else {
                console.log("No progress found.");
            }
        })
        .catch(error => {
            console.error("Error fetching progress:", error);
        });
}
