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
    const welcomeContainer = document.getElementById('welcome-container');

    // Clear old content
    while (leftNav.children.length > 1) leftNav.removeChild(leftNav.lastChild);
    rightNav.innerHTML = "";

    if (user) {
        // Get all usernames and find the one matching this user's UID
        db.collection("usernames").get().then(querySnapshot => {
            let username = "Unknown";

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.uid === user.uid) {
                    username = doc.id; // document ID is the username
                }
            });

            const welcomeMsg = document.createElement('div');
            welcomeMsg.textContent = `Welcome, ${username}`;
        //    welcomeMsg.classList.add('welcome-message');
            welcomeContainer.appendChild(welcomeMsg);
        });

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.classList.add('btn-custom');
        logoutBtn.onclick = () => {
            if (!localStorage.getItem('guestProgress')) {
                localStorage.setItem('guestProgress', window.pTotal.toString());
            }
            auth.signOut().then(() => location.reload());
        };
        rightNav.appendChild(logoutBtn);

    } else {
        ['Login', 'Sign Up'].forEach((text, i) => {
            const btn = document.createElement('a');
            btn.href = i === 0 ? 'login.html' : 'signup.html';
            btn.textContent = text;
            btn.classList.add('btn-custom');
            rightNav.appendChild(btn);
        });
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
