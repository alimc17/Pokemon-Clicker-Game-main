// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let leaderboardUnsub = null;
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
    const leftNav = document.getElementById('nav-left-id');
    const rightNav = document.getElementById('nav-right-id');
    
    // Save progress before page unloads
    window.addEventListener('beforeunload', () => {
        updateGameProgress({});
    });
    
    auth.onAuthStateChanged(async user => {
        updateNav(user);

        let progress;
        if (user) {
          const doc = await db.collection("users").doc(user.uid).get();
          progress = doc.exists ? doc.data().gameData : null;
        } else {
          const saved = localStorage.getItem('guestProgress');
          progress = saved ? JSON.parse(saved).gameData : null;
        }
    
        // if we have a saved prestigeLevel > 0, show the button
        if (progress && progress.prestigeLevel > 0) {
          const btn = document.getElementById('return-region-btn');
          btn.style.display = 'inline-block';
        }
    
        // now actually load the progress
        if (user) {
          loadGameProgress(user.uid);
        } else {
          loadGuestProgress();
        }
    });
});

function updateNav(user) {
    const leftNav = document.getElementById('nav-left-id');
    const rightNav = document.getElementById('nav-right-id');
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
        logoutBtn.onclick = async () => {
            // save progress & flip your online flag
            await updateGameProgress({});
            await db.collection("users").doc(auth.currentUser.uid)
                     .update({ online: false });
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

// handler to jump back to the saved region
async function returnToRegion() {
    // make sure game state is fully applied
    // if user is logged in, reload from Firebase; otherwise from localStorage
    const user = firebase.auth().currentUser;
    if (user) {
      await loadGameProgress(user.uid);
    } else {
      loadGuestProgress();
    }
    const videoEl = document.querySelector('.bg-video');
    if (videoEl) {
      videoEl.querySelector('source').src =
        regionData[window.prestigeLevel].bg;
      videoEl.load();
    }
  
    // swap the region name/level
    document.getElementById('region-name').textContent = regionData[window.prestigeLevel].name;
    document.getElementById('prestige-level').textContent = window.prestigeLevel;
    
    await getPokemon(regionData[lvl].startId);
    generateUpgrades(pokemon);
      
}
  
  // attach the click listener
document
.getElementById('return-region-btn')
.addEventListener('click', function() {
    this.style.display = 'none';
    returnToRegion();    
});
  

/**
 * Load your friends + your own score, sort descending, and render.
 */
async function loadLeaderboard() {
    const user = auth.currentUser;
    if (!user) return;
  
    // 1) get your friends list
    const userDoc = await db.collection("users").doc(user.uid).get();
    const data = userDoc.data() || {};
    const friends = data.friends || {};        // { friendUid: { username } }
    const entries = [];
  
    // 2) include yourself
    entries.push({
      uid: user.uid,
      username: (await db.collection("usernames")
                       .where("uid","==",user.uid).get())
                 .docs[0].id,
      prestige: data.gameData?.prestigeLevel || 0,
      totalP:    data.gameData?.pTotal         || 0
    });
  
    // 3) fetch each friend’s gameData
    await Promise.all(Object.entries(friends).map(async ([fid, {username}]) => {
      const doc = await db.collection("users").doc(fid).get();
      const gd  = doc.exists ? doc.data().gameData : null;
      entries.push({
        uid:       fid,
        username,
        prestige:  gd?.prestigeLevel || 0,
        totalP:    gd?.pTotal         || 0
      });
    }));
  
    // 4) sort by prestige desc, then totalP desc
    entries.sort((a,b) => {
      if (b.prestige !== a.prestige) return b.prestige - a.prestige;
      return b.totalP - a.totalP;
    });
  
    // 5) render into the UL
    const ul = document.getElementById("leaderboard-list");
    ul.innerHTML = entries.map((e,i) => `
      <li>
        <strong>#${i+1}</strong>
        ${e.username}
        — Level ${e.prestige}
        (${Math.round(e.totalP)} P)
      </li>
    `).join("");
  
    // show container
    document.getElementById("leaderboard-container").style.display = "block";
  }
  
  // Trigger it after login state settles
  auth.onAuthStateChanged(user => {
    // … your existing code …
    if (user) {
      loadLeaderboard();
    } else {
      // could also show guests if you store friends for guests
      document.getElementById("leaderboard-container").style.display = "none";
    }
  });

  async function initLeaderboardRealtime() {
    const user = auth.currentUser;
    if (!user) return;
  
    // 1) clean up any previous listener
    if (leaderboardUnsub) {
      leaderboardUnsub();
      leaderboardUnsub = null;
    }
  
    // 2) fetch your friends map & build UID list
    const youDoc = await db.collection("users").doc(user.uid).get();
    const friendsMap = youDoc.data()?.friends || {};
    const uids = [user.uid, ...Object.keys(friendsMap)];
  
    // 3) build a UID → username map
    const nameMap = {};
    // friend usernames come from your friendsMap
    for (const fid in friendsMap) {
      nameMap[fid] = friendsMap[fid].username;
    }
    // your username from the `usernames` collection
    const youNameSnap = await db.collection("usernames")
      .where("uid", "==", user.uid)
      .limit(1)
      .get();
    nameMap[user.uid] = youNameSnap.empty
      ? "You"
      : youNameSnap.docs[0].id;
  
    // 4) subscribe to all those user docs
    leaderboardUnsub = db.collection("users")
      .where(firebase.firestore.FieldPath.documentId(), "in", uids)
      .onSnapshot(snapshot => {
        const entries = snapshot.docs.map(doc => {
          const gd = doc.data().gameData || {};
          return {
            uid:       doc.id,
            username:  nameMap[doc.id] || doc.id,
            prestige:  gd.prestigeLevel || 0,
            totalP:    gd.pTotal        || 0
          };
        });
  
        // 5) sort & render
        entries.sort((a, b) => {
          if (b.prestige !== a.prestige) return b.prestige - a.prestige;
          return b.totalP   - a.totalP;
        });
  
        const ul = document.getElementById("leaderboard-list");
        ul.innerHTML = entries.map((e, i) => `
          <li>
            <strong>#${i+1}</strong>
            ${e.username}
            — Level ${e.prestige}
            (${Math.round(e.totalP)} P)
          </li>
        `).join("");
  
        document.getElementById("leaderboard-container")
                .style.display = entries.length ? "block" : "none";
      });
  }
  
  // 6) kick off (and tear down) your live listener inside auth.onAuthStateChanged
  auth.onAuthStateChanged(async user => {
    updateNav(user);
    if (user) {
      await db.collection("users").doc(user.uid).update({ online: true });
      window.addEventListener("beforeunload", () => {
        db.collection("users").doc(user.uid).update({ online: false });
      });

      loadGameProgress(user.uid);
      initLeaderboardRealtime();
      
    } else {
      loadGuestProgress();
      // unsubscribe if we were listening
      if (leaderboardUnsub) {
        leaderboardUnsub();
        leaderboardUnsub = null;
      }
      document.getElementById("leaderboard-container").style.display = "none";
    }
  });
  