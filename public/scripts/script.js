// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// at top of the file, alongside your other globals:
function updatePrestigeUI() {
    const regionNameEl    = document.getElementById('region-name');
    const prestigeLevelEl = document.getElementById('prestige-level');
    const prestigeButton  = document.getElementById('prestige-button');
   
    if (!regionNameEl || !prestigeLevelEl || !prestigeButton || !window.regionData) return;
    console.log('updatePrestigeUI → level:', window.prestigeLevel,
        'video src should be:', window.regionData[window.prestigeLevel].bg);
    // name & level text
    regionNameEl.textContent    = window.regionData[window.prestigeLevel].name;
    prestigeLevelEl.textContent = window.prestigeLevel;
  
    // disable button at max
    prestigeButton.disabled = window.prestigeLevel >= maxPrestige;
  
    // swap the background video
    const videoEl = document.querySelector('.bg-video');
    if (videoEl) {
      const src = videoEl.querySelector('source');
      src.src = window.regionData[window.prestigeLevel].bg;
      videoEl.load();
    }
  }
  

// Save game progress to Firebase for users or localStorage for guests
function updateGameProgress(newProgress) {
    const user = firebase.auth().currentUser;
    
    // Prepare complete game state
    const gameState = {
        gameData: {
            pTotal: window.pTotal,
            ppc: window.ppc || 1,
            pps: window.pps || 0,
            prestigeLevel: window.prestigeLevel || 0,
            rewardMultiplier: window.rewardMultiplier || 1,
            upgrades: window.upgrades || [],
            berries: window.berries    || [],
            purchasedBerries: window.purchasedBerries.map(b => b.id) || [],
            unlockedLegendaries: window.unlockedLegendaries || [],
            savedLegendaryIndices: window.savedLegendaryIndices || []
        },
        ...newProgress // Merge any additional progress data passed in
    };
    
    if (user) {
        // Save to Firebase if logged in
        db.collection("users").doc(user.uid)
            .set(gameState, { merge: true })
            .then(() => console.log("Progress saved to Firebase"))
            .catch(error => {
                console.error("Firestore error:", error);
                // Fallback to localStorage on Firebase error
                saveToLocalStorage(gameState);
            });
    } else {
        // Save to localStorage for guests
        saveToLocalStorage(gameState);
    }
}

// Helper function to save game state to localStorage
function saveToLocalStorage(gameState) {
    try {
        localStorage.setItem('guestProgress', JSON.stringify(gameState));
        console.log("Progress saved to localStorage");
    } catch (error) {
        console.error("localStorage error:", error);
    }
}

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const leftNav = document.getElementById('nav-left');
    const rightNav = document.getElementById('nav-right');
    
    // Save progress before page unloads
    window.addEventListener('beforeunload', () => {
        updateGameProgress({});
    });
    
    auth.onAuthStateChanged(user => {
        updateNav(user);

        if (user) {
            loadGameProgress(user.uid);
        } else {
            // ONLY load guest data if no user exists
            loadGuestProgress();
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
            welcomeContainer.appendChild(welcomeMsg);
        });

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.classList.add('btn-custom');
        logoutBtn.onclick = () => {
            // Save current progress to localStorage before logout
            updateGameProgress({});
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

                if (data.gameData) {
                    applyGameState(data);
                }
            } else {
                console.log("No progress found.");
                // Try loading from local storage as fallback
                loadGuestProgress();
            }
        })
        .catch(error => {
            console.error("Error fetching progress:", error);
            // Try loading from local storage as fallback
            loadGuestProgress();
        });
}

function loadGuestProgress() {
    try {
      const savedProgress = localStorage.getItem('guestProgress');
      if (savedProgress) {
        // You have JSON state: restore via applyGameState()
        const gameState = JSON.parse(savedProgress);
        applyGameState(gameState);
        console.log("Progress loaded from localStorage (JSON)");
      } else {
        // NO saved state at all → first-ever visitor
        // 1) Bootstrap the upgrades
        getPokemon(regionData[0].startId).then(() => generateUpgrades(pokemon));
        // 2) Bootstrap the berries
        fetchBerries().then(() => renderVisibleBerries());
        // 3) **Bootstrap the gambling slots** ← step 5 goes here
        renderLegendaries();
        console.log("Initialized fresh game state for a guest");
      }
    } catch (error) {
      console.error("Error loading local progress:", error);
    }
  }
  
// Apply loaded game state to the game
async function applyGameState(gameState) {
    if (!gameState.gameData) return;
    
    const { pTotal, 
            ppc, 
            pps, 
            prestigeLevel, 
            rewardMultiplier, 
            upgrades: savedUpgrades = [],
            berries: savedBerries       = [],
            purchasedBerries: savedPurchasedIds = [],
            unlockedLegendaries = [],
            savedLegendaryIndices = []
    } = gameState.gameData;
    
    // Update game variables
    window.pTotal = pTotal || 0;
    window.ppc = ppc || 1;
    window.pps = pps || 0;
    window.prestigeLevel = prestigeLevel || 0;
    window.rewardMultiplier = rewardMultiplier || 1;
    
    updatePrestigeUI();

    // Update DOM
    if (document.querySelector('.p-total')) {
        document.querySelector('.p-total').textContent = Math.round(window.pTotal);
    }
    
    if (document.querySelector('.ppc-text')) {
        document.querySelector('.ppc-text').textContent = Math.round(window.ppc);
    }
    
    if (document.querySelector('.pps-text')) {
        document.querySelector('.pps-text').textContent = Math.round(window.pps);
    }
    
    if (document.getElementById('prestige-level')) {
        document.getElementById('prestige-level').textContent = window.prestigeLevel;
    }
  

    generateUpgrades(pokemon);

    savedUpgrades.forEach((saved, i) => {
        const upg = window.upgrades[i];
        if (!upg) return;
        upg.level   = saved.level;
        upg.cost    = saved.cost;
        upg.visible = saved.visible;
    });

    renderVisibleUpgrades();

    await fetchBerries();

    savedBerries.forEach((saved, idx) => {
        if (!window.berries[idx]) return;
        Object.assign(window.berries[idx], {
          cost:       saved.cost,
          multiplier: saved.multiplier,
          sprite:     saved.sprite,
          visible:    saved.visible
        });
      });

    window.purchasedBerries = [];
    savedPurchasedIds.forEach(id => {
    const berry = window.berries.find(b => b.id === id);
    if (!berry) return;
        berry.purchased = true;
    window.purchasedBerries.push(berry);
    });

    renderVisibleBerries();

    window.unlockedLegendaries   = unlockedLegendaries;
    window.savedLegendaryIndices = savedLegendaryIndices;
    renderLegendaries();

    /*
    
    // Update background video if available
    if (document.querySelector('.bg-video') && window.regionData) {
        const videoElement = document.querySelector('.bg-video');
        const sourceElement = videoElement.querySelector('source');
        if (sourceElement) {
            sourceElement.src = window.regionData[window.prestigeLevel].bg;
            videoElement.load();
        }
    }*/
}