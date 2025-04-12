// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // THEN wait for auth state
    auth.onAuthStateChanged(user => {
        updateNav(user);
    });
});

function updateNav(user) {
    const leftNav = document.getElementById('nav-left');
    const rightNav = document.getElementById('nav-right');

    if (!leftNav || !rightNav) {
        console.warn("Nav elements not found in the DOM.");
        return;
    }

    // Clear previous welcome message but keep title
    while (leftNav.children.length > 1) {
        leftNav.removeChild(leftNav.lastChild);
    }
    rightNav.innerHTML = "";

    if (user) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.textContent = `Welcome, ${user.email}`;
        leftNav.appendChild(welcomeMsg);

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = () => {
            auth.signOut().then(() => location.reload());
        };
        rightNav.appendChild(logoutBtn);

        loadGameProgress(user.uid);
    } else {
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => location.href = 'login.html';
        rightNav.appendChild(loginBtn);

        const signupBtn = document.createElement('button');
        signupBtn.textContent = 'Signup';
        signupBtn.onclick = () => location.href = 'signup.html';
        rightNav.appendChild(signupBtn);
    }
}

function loadGameProgress(uid) {
    db.collection("users").doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                console.log("Loaded progress:", doc.data());
                // Load progress into game state here
            } else {
                console.log("No progress found.");
            }
        })
        .catch(error => {
            console.error("Error fetching progress:", error);
        });
}
