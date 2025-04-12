  // Example: Update game progress when a key event happens
  function updateGameProgress(newProgress) {
    const user = auth.currentUser;
    if (user) {
        console.log("Attempting to save:", newProgress);
        db.collection("users").doc(user.uid).set(newProgress, { merge: true })
            .then(() => {
                console.log("Firestore save confirmed");
            })
            .catch(error => {
                console.error("Firestore error:", error);
                // Fallback to localStorage if Firestore fails
                localStorage.setItem('guestProgress', window.pTotal.toString());
            });
    }
}

  // Example usage when a game event occurs:
  function onLevelUp(level, score) {
      const progress = { level: level, score: score };
      updateGameProgress(progress);
  }

