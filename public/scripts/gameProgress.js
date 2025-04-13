  // Example: Update game progress when a key event happens
  function updateGameProgress(newProgress) {
    const user = auth.currentUser;
    if (user) {
        db.collection("users").doc(user.uid).set(newProgress, { merge: true })
            .then(() => console.log("Progress saved"))
            .catch(error => {
                console.error("Firestore error:", error);
                localStorage.setItem('guestProgress', window.pTotal.toString());
            });
    }
}


  // Example usage when a game event occurs:
  function onLevelUp(level, score) {
      const progress = { level: level, score: score };
      updateGameProgress(progress);
  }