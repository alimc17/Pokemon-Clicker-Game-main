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
    
    await getPokemon(regionData[window.prestigeLevel].startId);
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
      document.getElementById("sticker-wall").style.display = "block";
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
  

// Sticker wall functionality
const STICKERS = [
    "BulbasaurSticker.png",
    "CharmanderSticker.png",
    "EeveeSticker.png",
    "PichuSticker.png",
    "SquirtleSticker.png"
  ];
  
  // Initialize the sticker wall component
  function initStickerWall() {
    // Fill the sticker selector dropdown
    initStickerSelector();
    // Initialize the sticker feed
    initStickerFeed();
    // Setup event handlers
    setupStickerEventHandlers();
  }
  
  // Populate the sticker selector dropdown
  function initStickerSelector() {
    const stickerSelect = document.getElementById("sticker-select");
    if (!stickerSelect) return;
    
    // Clear existing options
    stickerSelect.innerHTML = "";
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "-- Select a sticker --";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    stickerSelect.appendChild(defaultOption);
    
    // Add sticker options
    STICKERS.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.text = name.split('.')[0]; // Remove file extension
      
      // Create a small sticker preview
      const miniPreview = document.createElement("span");
      miniPreview.className = "sticker-preview";
      miniPreview.textContent = `🏷️ ${option.text}`;
      
      stickerSelect.appendChild(option);
    });
    
    // Add change event to show preview
    stickerSelect.addEventListener("change", updateStickerPreview);
  }
  
  // Update the sticker preview when selection changes
  function updateStickerPreview() {
    const stickerSelect = document.getElementById("sticker-select");
    const previewContainer = document.getElementById("sticker-preview-container") || 
                            createStickerPreviewContainer();
    
    if (stickerSelect.value) {
      previewContainer.innerHTML = `
        <img src="assets/images/stickers/${stickerSelect.value}" 
             alt="${stickerSelect.value}" 
             class="sticker-preview-img" />
      `;
      previewContainer.style.display = "block";
    } else {
      previewContainer.style.display = "none";
    }
  }
  
  // Create the sticker preview container if it doesn't exist
  function createStickerPreviewContainer() {
    const form = document.getElementById("sticker-form");
    const container = document.createElement("div");
    container.id = "sticker-preview-container";
    container.className = "sticker-preview-container";
    
    // Insert after the sticker select element
    const selectLabel = form.querySelector("label:first-child");
    form.insertBefore(container, selectLabel.nextSibling);
    
    return container;
  }
  
  // Set up event handlers for the sticker form
  function setupStickerEventHandlers() {
    const form = document.getElementById("sticker-form");
    const textInput = document.getElementById("sticker-text");
    const charCount = document.createElement("span");
    
    // Add character counter
    charCount.className = "char-count";
    charCount.textContent = "140 characters remaining";
    textInput.parentNode.appendChild(charCount);
    
    textInput.addEventListener("input", () => {
      const remaining = 140 - textInput.value.length;
      charCount.textContent = `${remaining} characters remaining`;
      
      if (remaining < 20) {
        charCount.classList.add("warning");
      } else {
        charCount.classList.remove("warning");
      }
    });
    
    // Handle form submission
    form.addEventListener("submit", handleStickerSubmit);
  }
  
  // Handle sticker submission
  async function handleStickerSubmit(e) {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    const stickerSelect = document.getElementById("sticker-select");
    const textInput = document.getElementById("sticker-text");
    const submitButton = document.querySelector("#sticker-form button[type='submit']");
    
    // Validation
    if (!user) {
      showNotification("Please log in to post stickers", "error");
      return;
    }
    
    if (!stickerSelect.value) {
      showNotification("Please select a sticker", "error");
      return;
    }
    
    const text = textInput.value.trim();
    if (!text) {
      showNotification("Please add a message to your sticker", "error");
      return;
    }
    
    // Disable form during submission
    submitButton.disabled = true;
    submitButton.textContent = "Posting...";
    
    try {
      // Get username
      const usernameSnapshot = await db.collection("usernames")
        .where("uid", "==", user.uid)
        .limit(1)
        .get();
        
      const username = !usernameSnapshot.empty ? 
        usernameSnapshot.docs[0].id : "Anonymous";
      
      // Add the sticker post
      await db.collection("stickerPosts").add({
        uid: user.uid,
        username,
        sticker: stickerSelect.value,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: {}
      });
      
      // Reset form
      textInput.value = "";
      stickerSelect.selectedIndex = 0;
      updateStickerPreview();
      
      // Update character counter
      const charCount = document.querySelector(".char-count");
      if (charCount) {
        charCount.textContent = "140 characters remaining";
        charCount.classList.remove("warning");
      }
      
      showNotification("Sticker posted successfully!", "success");
    } catch (error) {
      console.error("Error posting sticker:", error);
      showNotification("Failed to post sticker. Please try again.", "error");
    } finally {
      // Re-enable form
      submitButton.disabled = false;
      submitButton.textContent = "Post";
    }
  }
  
  // Initialize real-time sticker feed
  function initStickerFeed() {
    const feedContainer = document.getElementById("sticker-feed");
    if (!feedContainer) return;
    
    // Add loading indicator
    feedContainer.innerHTML = `<div class="loading-spinner">Loading stickers...</div>`;
    
    // Subscribe to sticker posts with real-time updates
    db.collection("stickerPosts")
      .orderBy("timestamp", "desc")
      .limit(20) // Limit to improve performance
      .onSnapshot(
        snapshot => {
          // Remove loading indicator if present
          const loadingEl = feedContainer.querySelector(".loading-spinner");
          if (loadingEl) loadingEl.remove();
          
          // Handle empty feed
          if (snapshot.empty) {
            feedContainer.innerHTML = `
              <div class="empty-feed">
                No stickers yet! Be the first to post one.
              </div>
            `;
            return;
          }
          
          // Process document changes to minimize DOM updates
          snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const postId = doc.id;
            const existingPost = document.querySelector(`.sticker-entry[data-id="${postId}"]`);
            
            if (change.type === "removed" && existingPost) {
              // Remove deleted posts
              existingPost.remove();
            } else if (change.type === "added" || change.type === "modified") {
              // Add or update posts
              const postData = doc.data();
              const postElement = createStickerPostElement(doc.id, postData);
              
              if (existingPost) {
                // Update existing post
                existingPost.replaceWith(postElement);
              } else if (change.type === "added") {
                // Find position for new post based on timestamp
                const timestamp = postData.timestamp?.toMillis() || Date.now();
                let inserted = false;
                
                // Find the right position based on timestamp
                Array.from(feedContainer.children).forEach(child => {
                  if (!inserted && child.dataset.timestamp && 
                      parseInt(child.dataset.timestamp) < timestamp) {
                    feedContainer.insertBefore(postElement, child);
                    inserted = true;
                  }
                });
                
                // If not inserted, append at the end
                if (!inserted) {
                  feedContainer.appendChild(postElement);
                }
              }
            }
          });
          
          // Attach event handlers to like buttons
          attachLikeButtonHandlers();
        },
        error => {
          console.error("Error getting sticker feed:", error);
          feedContainer.innerHTML = `
            <div class="error-message">
              Failed to load stickers. Please refresh the page.
            </div>
          `;
        }
      );
  }
  
  // Create a sticker post element
  function createStickerPostElement(postId, postData) {
    const { uid, username, sticker, text, timestamp, likes = {} } = postData;
    const likeCount = Object.keys(likes).length;
    const user = firebase.auth().currentUser;
    const isLiked = user && likes[user.uid];
    const postTimestamp = timestamp?.toDate() || new Date();
    
    // Create post container
    const postElement = document.createElement("li");
    postElement.className = "sticker-entry";
    postElement.dataset.id = postId;
    postElement.dataset.timestamp = timestamp?.toMillis() || Date.now();
    
    // Format time string
    const timeString = formatPostTime(postTimestamp);
    
    // Build post HTML
    postElement.innerHTML = `
      <div class="sticker-post-header">
        <span class="sticker-username">${username}</span>
        <span class="sticker-time">${timeString}</span>
      </div>
      <div class="sticker-post-content">
        <img src="assets/images/stickers/${sticker}" alt="${sticker}" class="sticker-image" />
        <div class="sticker-text">${escapeHTML(text)}</div>
      </div>
      <div class="sticker-post-footer">
        <button class="like-btn ${isLiked ? 'liked' : ''}">
          <span class="like-icon">❤️</span>
          <span class="like-count">${likeCount}</span>
        </button>
        ${user && uid === user.uid ? `
          <button class="delete-btn">🗑️</button>
        ` : ''}
      </div>
    `;
    
    return postElement;
  }
  
  // Attach event handlers to like buttons
  function attachLikeButtonHandlers() {
    // Like button handlers
    document.querySelectorAll(".sticker-entry .like-btn").forEach(btn => {
      btn.onclick = handleLikeClick;
    });
    
    // Delete button handlers
    document.querySelectorAll(".sticker-entry .delete-btn").forEach(btn => {
      btn.onclick = handleDeleteClick;
    });
  }
  
  // Handle like button click
  async function handleLikeClick(e) {
    const user = firebase.auth().currentUser;
    if (!user) {
      showNotification("Please log in to like stickers", "error");
      return;
    }
    
    const likeBtn = e.currentTarget;
    const postElement = likeBtn.closest(".sticker-entry");
    const postId = postElement.dataset.id;
    
    try {
      // Optimistic UI update
      const likeCount = likeBtn.querySelector(".like-count");
      const currentCount = parseInt(likeCount.textContent);
      const isCurrentlyLiked = likeBtn.classList.contains("liked");
      
      if (isCurrentlyLiked) {
        likeBtn.classList.remove("liked");
        likeCount.textContent = Math.max(0, currentCount - 1);
      } else {
        likeBtn.classList.add("liked");
        likeCount.textContent = currentCount + 1;
      }
      
      // Update in Firestore
      const postRef = db.collection("stickerPosts").doc(postId);
      const postDoc = await postRef.get();
      
      if (postDoc.exists) {
        const likes = postDoc.data().likes || {};
        if (likes[user.uid]) {
          // Unlike
          delete likes[user.uid];
        } else {
          // Like
          likes[user.uid] = true;
        }
        
        await postRef.update({ likes });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      showNotification("Failed to update like. Please try again.", "error");
      
      // Revert optimistic UI update on error
      location.reload();
    }
  }
  
  // Handle delete button click
  async function handleDeleteClick(e) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    if (!confirm("Are you sure you want to delete this sticker post?")) {
      return;
    }
    
    const postElement = e.currentTarget.closest(".sticker-entry");
    const postId = postElement.dataset.id;
    
    try {
      await db.collection("stickerPosts").doc(postId).delete();
      showNotification("Sticker deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting sticker:", error);
      showNotification("Failed to delete sticker", "error");
    }
  }
  
  // Format post time as relative or absolute depending on age
  function formatPostTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
  
  // Show notification to user
  function showNotification(message, type = "info") {
    // Remove any existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement("span");
    closeBtn.className = "notification-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add("notification-hide");
        setTimeout(() => notification.remove(), 500);
      }
    }, 5000);
  }
  
  // Escape HTML to prevent XSS
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Initialize sticker wall when auth state is determined
  firebase.auth().onAuthStateChanged(user => {
    initStickerWall();
  });
  