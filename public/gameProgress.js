  // Example: Update game progress when a key event happens
  function updateGameProgress(newProgress) {
      const user = auth.currentUser;
      if (user) {
          db.collection("users").doc(user.uid).set(newProgress, { merge: true })
              .then(() => {
                  console.log("Progress saved successfully!");
              })
              .catch(error => {
                  console.error("Error saving progress: ", error);
              });
      } else {
          // Optionally, save to localStorage for guest users
          localStorage.setItem('gameProgress', JSON.stringify(newProgress));
      }
  }

  // Example usage when a game event occurs:
  function onLevelUp(level, score) {
      const progress = { level: level, score: score };
      updateGameProgress(progress);
  }

