// FRIENDS MODAL ELEMENTS
const friendsToggleBtn = document.getElementById("friends-toggle");
const friendsModal = document.getElementById("friends-modal");
const closeFriendsModal = document.getElementById("close-friends-modal");
const friendsList = document.getElementById("friends-list");

// ADD FRIEND MODAL ELEMENTS
const addFriendModal = document.getElementById("add-friend-modal");
const openAddFriendModal = document.getElementById("open-add-friend-modal");
const closeAddModal = document.getElementById("close-add-modal");

// SEARCH ELEMENTS
const searchInput = document.getElementById("search-username");
const searchResults = document.getElementById("search-results");

// INCOMING FRIEND REQUESTS CONTAINER
const incomingRequestsList = document.getElementById("incoming-requests");

/**
 * Load and render the friends list along with outgoing friend requests.
 */
async function loadFriendsList() {
  const user = firebase.auth().currentUser;
  friendsList.innerHTML = ""; // Clear any existing content
  
  // Show or hide the add friend "+" button based on authentication
  openAddFriendModal.style.display = user ? "inline-block" : "none";

  if (!user) {
    friendsList.innerHTML = `<p class="login-message">Login to see your friends.</p>`;
    return;
  }

  try {
    const uid = user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    const data = userDoc.data() || {};
    const friends = data.friends || {};
    const outgoing = data.outgoing || {};
    let html = "";

    // Render current friends
    for (const fid in friends) {
      const { username } = friends[fid];
      // Fetch extra friend data (for instance, online status)
      const friendDoc = await db.collection("users").doc(fid).get();
      const friendData = friendDoc.data() || {};
      const isOnline = friendData.online;
      html += `
        <div class="friend-entry">
          <span class="status-dot ${isOnline ? "online" : "offline"}"></span>
          <span class="friend-name">${username}</span>
          <button class="unfriend-btn" data-uid="${fid}">Unfriend</button>
        </div>
      `;
    }

    // Render outgoing friend requests
    for (const rid in outgoing) {
      const { username } = outgoing[rid];
      html += `
        <div class="friend-entry">
          <span class="status-dot pending"></span>
          <span class="friend-name">${username}</span>
          <button class="cancel-request-btn" data-uid="${rid}">Cancel Request</button>
        </div>
      `;
    }

    friendsList.innerHTML = html || `<p class="login-message">No friends or requests yet.</p>`;

    // Attach event listeners to the unfriending buttons
    document.querySelectorAll(".unfriend-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const fid = btn.dataset.uid;
        await unfriend(user.uid, fid);
        loadFriendsList();
      });
    });

    // Attach event listeners to the cancel request buttons
    document.querySelectorAll(".cancel-request-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const rid = btn.dataset.uid;
        await cancelRequest(user.uid, rid);
        loadFriendsList();
      });
    });

  } catch (error) {
    console.error("Error loading friends:", error);
    friendsList.innerHTML = `<p class="login-message">Failed to load friends.</p>`;
  }
}

/**
 * Listen in real time for incoming friend requests.
 */
function listenIncomingFriendRequests() {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser || !incomingRequestsList) return;

  db.collection("friendRequests").doc(currentUser.uid)
    .onSnapshot(doc => {
      const data = doc.exists ? doc.data() : {};
      let html = "";
      for (const requesterUid in data) {
        const { username } = data[requesterUid];
        html += `
          <div class="friend-request-entry">
            <span>${username}</span>
            <button class="accept-request-btn" data-uid="${requesterUid}">Accept</button>
            <button class="decline-request-btn" data-uid="${requesterUid}">Decline</button>
          </div>
        `;
      }
      incomingRequestsList.innerHTML = html || `<p>No incoming friend requests.</p>`;

      // Attach event listeners for "Accept" buttons
      document.querySelectorAll(".accept-request-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const requesterUid = btn.dataset.uid;
          await acceptFriendRequest(currentUser.uid, requesterUid);
        });
      });

      // Attach event listeners for "Decline" buttons
      document.querySelectorAll(".decline-request-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const requesterUid = btn.dataset.uid;
          await declineFriendRequest(currentUser.uid, requesterUid);
        });
      });
    }, error => {
      console.error("Error listening for incoming friend requests:", error);
      incomingRequestsList.innerHTML = "<p>Error loading friend requests.</p>";
    });
}

// Toggle the friends modal and load lists and requests as needed.
friendsToggleBtn.addEventListener("click", () => {
  if (friendsModal.style.display === "flex") {
    friendsModal.style.display = "none";
  } else {
    friendsModal.style.display = "flex";
    loadFriendsList();
    listenIncomingFriendRequests();
  }
});

// Modal close handlers
closeFriendsModal.addEventListener("click", () => {
  friendsModal.style.display = "none";
});
openAddFriendModal.addEventListener("click", () => {
  addFriendModal.style.display = "flex";
  // Clear search inputs/results upon opening the add friend modal.
  searchInput.value = "";
  searchResults.innerHTML = "";
});
closeAddModal.addEventListener("click", () => {
  addFriendModal.style.display = "none";
});

// Friend search: send request after typing 3+ characters
searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim().toLowerCase();
  searchResults.innerHTML = "";
  if (query.length < 3) return;

  try {
    const snapshot = await db.collection("usernames")
      .orderBy(firebase.firestore.FieldPath.documentId())
      .startAt(query)
      .endAt(query + "\uf8ff")
      .limit(10)
      .get();

    if (snapshot.empty) {
      searchResults.innerHTML = "<p>No users found.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const username = doc.id;
      const { uid } = doc.data();

      const entry = document.createElement("div");
      entry.className = "friend-entry";
      entry.textContent = username;
      entry.style.cursor = "pointer";

      entry.addEventListener("click", async () => {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser || currentUser.uid === uid) return;
      
        try {
          // Fetch sender's username
          const senderDoc = await db.collection("users").doc(currentUser.uid).get();
          const senderData = senderDoc.data();
          const senderUsername = senderData?.username || "Anonymous";
      
          // Update outgoing requests for the sender.
          await db.collection("users").doc(currentUser.uid).set({
            outgoing: {
              [uid]: { username }
            }
          }, { merge: true });
      
          // Write the friend request to the dedicated friendRequests collection.
          await db.collection("friendRequests").doc(uid).set({
            [currentUser.uid]: {
              username: senderUsername,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });
      
          searchResults.innerHTML = "<p>Friend request sent!</p>";
          searchInput.value = "";
          setTimeout(() => {
            addFriendModal.style.display = "none";
          }, 1500);
      
        } catch (e) {
          console.error("Error sending request:", e);
          searchResults.innerHTML = "<p>Failed to send request.</p>";
        }
      });      
      
      searchResults.appendChild(entry);
    });

  } catch (err) {
    console.error("Search failed:", err);
    searchResults.innerHTML = "<p>Error searching for users.</p>";
  }
});

// Accept friend request: move request into friends for both users.
async function acceptFriendRequest(recipientUid, requesterUid) {
  try {
    // Get the friend request data
    const requestDoc = await db.collection("friendRequests").doc(recipientUid).get();
    const requestData = requestDoc.data() || {};
    const requesterData = requestData[requesterUid];

    if (!requesterData) {
      console.error("No friend request found from this user.");
      return;
    }
    
    // Add the requester to the recipient's friends list.
    await db.collection("users").doc(recipientUid).update({
      [`friends.${requesterUid}`]: { username: requesterData.username }
    });
    // Add the recipient to the requester's friends list.
    const recipientUser = firebase.auth().currentUser;
    await db.collection("users").doc(requesterUid).update({
      [`friends.${recipientUid}`]: { username: recipientUser.displayName || "Anonymous" }
    });
    
    // Remove the friend request from the friendRequests collection.
    await db.collection("friendRequests").doc(recipientUid).update({
      [requesterUid]: firebase.firestore.FieldValue.delete()
    });
    
    // Optionally remove the outgoing request for the requester.
    await db.collection("users").doc(requesterUid).update({
      [`outgoing.${recipientUid}`]: firebase.firestore.FieldValue.delete()
    });
    
    console.log("Friend request accepted successfully.");
    loadFriendsList();
    // The realtime listener will update the incoming requests automatically.
    
  } catch (e) {
    console.error("Error accepting friend request:", e);
  }
}

// Decline friend request: simply remove the request from the friendRequests collection.
async function declineFriendRequest(recipientUid, requesterUid) {
  try {
    await db.collection("friendRequests").doc(recipientUid).update({
      [requesterUid]: firebase.firestore.FieldValue.delete()
    });
    
    // Optionally remove the sender’s outgoing request as well.
    await db.collection("users").doc(requesterUid).update({
      [`outgoing.${recipientUid}`]: firebase.firestore.FieldValue.delete()
    });
    
    console.log("Friend request declined.");
  } catch (e) {
    console.error("Error declining friend request:", e);
  }
}

// Unfriend: remove each friend from both users’ friend lists.
async function unfriend(uid, fid) {
  const userRef = db.collection("users").doc(uid);
  const friendRef = db.collection("users").doc(fid);

  await userRef.update({
    [`friends.${fid}`]: firebase.firestore.FieldValue.delete()
  });
  await friendRef.update({
    [`friends.${uid}`]: firebase.firestore.FieldValue.delete()
  });
}

// Cancel outgoing friend request: remove both the sender's outgoing and the request document.
async function cancelRequest(uid, rid) {
  const userRef = db.collection("users").doc(uid);

  await userRef.update({
    [`outgoing.${rid}`]: firebase.firestore.FieldValue.delete()
  });
  await db.collection("friendRequests").doc(rid).update({
    [uid]: firebase.firestore.FieldValue.delete()
  });
}
