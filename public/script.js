// Initialize Firebase app if not already initialized
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); // if using Firestore

// Update nav depending on user's login state
function updateNav(user) {
    const leftNav = document.getElementById('nav-left');
    const rightNav = document.getElementById('nav-right');

    if (!leftNav || !rightNav) {
        console.warn("Nav elements not found in the DOM.");
        return;
    }

    // Clear previous dynamic content (but preserve the title in left nav)
    while (leftNav.children.length > 1) {
        leftNav.removeChild(leftNav.lastChild);
    }
    rightNav.innerHTML = "";

    if (user) {
        // Add welcome message under the title
        const welcomeMsg = document.createElement('div');
        welcomeMsg.textContent = `Welcome, ${user.email}`;
        leftNav.appendChild(welcomeMsg);

        // Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = () => {
            auth.signOut().then(() => {
                location.reload();
            });
        };
        rightNav.appendChild(logoutBtn);

        // Load progress
        loadGameProgress(user.uid);
    } else {
        // Login and Signup buttons
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => {
            document.location = 'login.html';
        };
        rightNav.appendChild(loginBtn);

        const signupBtn = document.createElement('button');
        signupBtn.textContent = 'Signup';
        signupBtn.onclick = () => {
            document.location = 'signup.html';
        };
        rightNav.appendChild(signupBtn);
    }
}

// Function to load saved progress from Firestore
function loadGameProgress(uid) {
    db.collection("users").doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const progress = doc.data();
                console.log("Loaded progress:", progress);
                // Update your game state based on progress data here
            } else {
                console.log("No progress found. Starting fresh.");
            }
        })
        .catch(error => {
            console.error("Error fetching progress:", error);
        });
}

// Wait until DOM is ready before running anything that touches the DOM
document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged(user => {
        updateNav(user);
    });
});
