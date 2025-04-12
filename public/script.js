// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // THEN wait for auth state
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
        welcomeMsg.textContent = `Welcome, ${user.email}`;
        leftNav.appendChild(welcomeMsg);

        // Create logout button with progress preservation
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = () => {
            // Save guest progress before logout
            if (!localStorage.getItem('guestProgress')) {
                localStorage.setItem('guestProgress', window.pTotal.toString());
            }
            auth.signOut().then(() => location.reload());
        };
        rightNav.appendChild(logoutBtn);

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
                const data = doc.data();
                window.pTotal = data.pTotal || 0;
                document.querySelector('.p-total').textContent = window.pTotal;
                console.log("Loaded progress:", data);
            }
        })
        .catch(error => {
            console.error("Error fetching progress:", error);
        });
}