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
const incomingRequestHeader = document.querySelector("incoming-friend-h3");

/**
 * Load and render the friends list along with outgoing friend requests.
 */
async function loadFriendsList() {
  const user = firebase.auth().currentUser;
  friendsList.innerHTML = ""; // Clear existing content

  // Show or hide the add friend "+" button based on authentication.
  openAddFriendModal.style.display = user ? "inline-block" : "none";

  try {
    const uid = user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    const data = userDoc.data() || {};
    const friends = data.friends || {};
    const outgoing = data.outgoing || {};
    let html = "";

    // Render each friend. Process each friend individually.
    for (const fid in friends) {
      try {
        const { username } = friends[fid];
        // Fetch additional friend data (e.g. online status)
        const friendDoc = await db.collection("users").doc(fid).get();
        const friendData = friendDoc.exists ? friendDoc.data() : {};
        // Default offline if field is missing.
        const isOnline = typeof friendData.online !== "undefined" ? friendData.online : false;
        html += `
          <div class="friend-entry">
            <span class="status-dot ${isOnline ? "online" : "offline"}"></span>
            <span class="friend-name">${username}</span>
            <button class="unfriend-btn" data-uid="${fid}">Unfriend</button>
          </div>
        `;
      } catch (innerErr) {
        console.error("Error processing friend", fid, innerErr);
      }
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

    // Attach event listener for unfriending
    document.querySelectorAll(".unfriend-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const fid = btn.dataset.uid;
        await unfriend(user.uid, fid);
        loadFriendsList();
      });
    });

    // Attach event listener for canceling outgoing requests
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
 * Only display the container if there is data.
 */
function listenIncomingFriendRequests() {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser || !incomingRequestsList) return;

  db.collection("friendRequests").doc(currentUser.uid)
    .onSnapshot(doc => {
      const data = doc.exists ? doc.data() : {};
      console.log("onSnapshot fired. Data:", data);
      // If there are no incoming requests, hide the container.
      if (Object.keys(data).length === 0) {
        incomingRequestsList.style.display = "none";
        //incomingRequestHeader.style.display = "none";
      } else {
        incomingRequestsList.style.display = "block";
        //incomingRequestHeader.style.display = "block";
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
        incomingRequestsList.innerHTML = html;
        // Attach event listeners for accept/decline actions.
        document.querySelectorAll(".accept-request-btn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const requesterUid = btn.dataset.uid;
            await acceptFriendRequest(currentUser.uid, requesterUid);
            incomingRequestsList.style.display = "none"; // Hide after action.
          });
        });
        document.querySelectorAll(".decline-request-btn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const requesterUid = btn.dataset.uid;
            await declineFriendRequest(currentUser.uid, requesterUid);
            incomingRequestsList.style.display = "none";
          });
        });
      }
    }, error => {
      console.error("Error listening for incoming friend requests:", error);
      incomingRequestsList.innerHTML = "<p>Error loading friend requests.</p>";
      incomingRequestsList.style.display = "block";
    });
}

// Toggle the friends modal and load lists/requests.
friendsToggleBtn.addEventListener("click", () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    // Show login required message
    showLoginRequiredModal();
    return;
  }

  if (friendsModal.style.display === "flex") {
    friendsModal.style.display = "none";
  } else {
    friendsModal.style.display = "flex";
    loadFriendsList();
    listenIncomingFriendRequests();
  }
});

// Modal close handlers.
closeFriendsModal.addEventListener("click", () => {
  friendsModal.style.display = "none";
});
openAddFriendModal.addEventListener("click", () => {
  addFriendModal.style.display = "flex";
  // Clear search input/results on modal open.
  searchInput.value = "";
  searchResults.innerHTML = "";
});
closeAddModal.addEventListener("click", () => {
  addFriendModal.style.display = "none";
});

// Friend search: send friend request once user types 3+ characters.
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
          // Fetch sender's username from the "usernames" collection.
          const usernameQuery = await db.collection("usernames")
            .where("uid", "==", currentUser.uid)
            .get();
          let senderUsername = "Anonymous";
          if (!usernameQuery.empty) {
            // Use the document ID as the sender's chosen username.
            senderUsername = usernameQuery.docs[0].id;
          }

          // Update outgoing requests for the sender.
          await db.collection("users").doc(currentUser.uid).set({
            outgoing: {
              [uid]: { username } // 'username' here is the target user's username.
            }
          }, { merge: true });

          // Write the friend request to the friendRequests collection.
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

// Accept friend request: update both users' friend lists.
async function acceptFriendRequest(recipientUid, requesterUid) {
  try {
    // Get the friend request data.
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

    // Lookup the recipient's actual username in the usernames collection.
    let recipientUsername = "Anonymous";
    const usernameQuery = await db.collection("usernames")
      .where("uid", "==", recipientUid)
      .limit(1)
      .get();
    if (!usernameQuery.empty) {
      recipientUsername = usernameQuery.docs[0].id;
    }

    // Add the recipient to the requester's friends list using the recipient's username.
    await db.collection("users").doc(requesterUid).update({
      [`friends.${recipientUid}`]: { username: recipientUsername }
    });

    // Remove the friend request.
    await db.collection("friendRequests").doc(recipientUid).update({
      [requesterUid]: firebase.firestore.FieldValue.delete()
    });

    // Remove the outgoing request for the requester.
    await db.collection("users").doc(requesterUid).update({
      [`outgoing.${recipientUid}`]: firebase.firestore.FieldValue.delete()
    });

    console.log("Friend request accepted successfully.");
    loadFriendsList();
    initLeaderboardRealtime();
    // The realtime listener will update the incoming requests automatically.
  } catch (e) {
    console.error("Error accepting friend request:", e);
  }
}

// Decline friend request: remove the request and cleanup outgoing.
async function declineFriendRequest(recipientUid, requesterUid) {
  try {
    await db.collection("friendRequests").doc(recipientUid).update({
      [requesterUid]: firebase.firestore.FieldValue.delete()
    });
    await db.collection("users").doc(requesterUid).update({
      [`outgoing.${recipientUid}`]: firebase.firestore.FieldValue.delete()
    });
    console.log("Friend request declined.");
  } catch (e) {
    console.error("Error declining friend request:", e);
  }
}

// Unfriend: remove both users from each other's friend list.
async function unfriend(uid, fid) {
  try {
    const userRef = db.collection("users").doc(uid);
    const friendRef = db.collection("users").doc(fid);
    await userRef.update({
      [`friends.${fid}`]: firebase.firestore.FieldValue.delete()
    });
    await friendRef.update({
      [`friends.${uid}`]: firebase.firestore.FieldValue.delete()
    });
  } catch (e) {
    console.error("Error removing friend:", e);
  }
}

// Cancel outgoing friend request: remove outgoing field and friend request.
async function cancelRequest(uid, rid) {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      [`outgoing.${rid}`]: firebase.firestore.FieldValue.delete()
    });
    await db.collection("friendRequests").doc(rid).update({
      [uid]: firebase.firestore.FieldValue.delete()
    });
  } catch (e) {
    console.error("Error canceling outgoing friend request:", e);
  }
}
