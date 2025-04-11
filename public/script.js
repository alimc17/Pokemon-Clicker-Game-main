  // Initialize Firebase app if not already initialized
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore(); // if using Firestore

  // Function to update the nav buttons based on auth state
  function updateNav(user) {
      const navButtons = document.getElementById('nav-buttons');
      navButtons.innerHTML = "";  // Clear any existing content
      if (user) {
          // If user is logged in, show logout button and perhaps a welcome message
          const welcomeMsg = document.createElement('span');
          welcomeMsg.textContent = `Welcome, ${user.email}`;
          navButtons.appendChild(welcomeMsg);

          const logoutBtn = document.createElement('button');
          logoutBtn.textContent = 'Logout';
          logoutBtn.onclick = () => {
              auth.signOut().then(() => {
                  // Optionally reload page or update UI to guest mode
                  location.reload();
              });
          };
          navButtons.appendChild(logoutBtn);

          // Optionally, load saved game progress here
          loadGameProgress(user.uid);
      } else {
          // If user is not logged in, show login and signup buttons
          const loginBtn = document.createElement('button');
          loginBtn.textContent = 'Login';
          loginBtn.onclick = () => {
              document.location = 'login.html';
          };
          navButtons.appendChild(loginBtn);

          const signupBtn = document.createElement('button');
          signupBtn.textContent = 'Signup';
          signupBtn.onclick = () => {
              document.location = 'signup.html';
          };
          navButtons.appendChild(signupBtn);
      }
  }

  // Listen for auth state changes
  auth.onAuthStateChanged(user => {
      updateNav(user);
  });

  // Example function for loading game progress from Firestore
  function loadGameProgress(uid) {
      db.collection("users").doc(uid).get().then(doc => {
          if (doc.exists) {
              const progress = doc.data();
              // Use the progress data to update your game state
              // For example:
              console.log("Loaded progress:", progress);
              // Update your game UI elements accordingly.
          } else {
              console.log("No progress found. Starting fresh.");
          }
      }).catch(error => {
          console.error("Error fetching progress:", error);
      });
  }
