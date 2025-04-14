// friends.js

import { auth, db } from "./firebaseConfig.js";

// Toggle the Friends section
const friendsToggleBtn = document.getElementById("friends-toggle");
let friendsHeader = null;
let friendsBody = null;
let friendModal = null;
let modalOverlay = null;

friendsToggleBtn.addEventListener("click", () => {
  if (friendsHeader) {
    friendsHeader.remove();
    friendsHeader = null;
    friendsBody.remove();
    friendsBody = null;
  } else {
    openFriendsSection();
  }
});

function openFriendsSection() {
  friendsHeader = document.createElement("div");
  friendsHeader.className = "friends-header";
  friendsHeader.innerHTML = `
    <h2>Friends</h2>
    <span id="add-friend-icon" style="cursor: pointer; font-size: 24px;">➕</span>
  `;

  friendsBody = document.createElement("div");
  friendsBody.className = "friends-body";

  const main = document.querySelector(".main");
  main.prepend(friendsHeader);
  main.insertBefore(friendsBody, main.children[1]);

  const user = auth.currentUser;
  if (!user) {
    friendsBody.innerHTML = `<p>Login to share your achievements with friends</p>`;
  } else {
    friendsBody.innerHTML = `<p>Loading friends...</p>`;
    // TODO: Load actual friends list here
  }

  document.getElementById("add-friend-icon").addEventListener("click", openFriendModal);
}

// Modal creation
function openFriendModal() {
  modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";

  friendModal = document.createElement("div");
  friendModal.className = "friend-modal";
  friendModal.innerHTML = `
    <span class="close-modal" style="float:right; cursor:pointer;">&times;</span>
    <h3>Add a Friend</h3>
    <input type="text" id="friend-username-input" placeholder="Enter username" />
    <button id="send-request" class="btn-custom">Send Request</button>
  `;

  modalOverlay.appendChild(friendModal);
  document.body.appendChild(modalOverlay);

  friendModal.querySelector(".close-modal").addEventListener("click", closeFriendModal);
  document.getElementById("send-request").addEventListener("click", sendFriendRequest);
}

function closeFriendModal() {
  modalOverlay.remove();
  modalOverlay = null;
  friendModal = null;
}

async function sendFriendRequest() {
  const usernameToAdd = document.getElementById("friend-username-input").value.trim();
  const user = auth.currentUser;

  if (!usernameToAdd) {
    alert("Please enter a username.");
    return;
  }

  if (!user) {
    alert("You must be logged in to send friend requests.");
    return;
  }

  if (usernameToAdd.toLowerCase() === user.displayName?.toLowerCase()) {
    alert("You can't add yourself as a friend.");
    return;
  }

  try {
    const usernameDoc = await db.collection("usernames").doc(usernameToAdd).get();
    if (!usernameDoc.exists) {
      alert("Username not found.");
      return;
    }

    const { uid: recipientUid } = usernameDoc.data();
    const requestRef = db.collection("friendRequests").doc(recipientUid);
    const requestSnap = await requestRef.get();
    const requestData = requestSnap.exists ? requestSnap.data() : { pending: {} };

    requestData.pending[user.uid] = {
      username: user.displayName || "Unknown",
      timestamp: new Date()
    };

    await requestRef.set(requestData);

    alert("Friend request sent!");
    document.getElementById("friend-username-input").value = "";
    closeFriendModal();
  } catch (error) {
    console.error("Error sending friend request:", error);
    alert("Failed to send request. Try again later.");
  }
}
