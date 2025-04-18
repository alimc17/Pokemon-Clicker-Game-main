/*function updateGameProgress(newProgress) {
  const user = firebase.auth().currentUser;
  
  // Prepare complete game state
  const gameState = {
      gameData: {
          pTotal: parsedPTotal,
          ppc: ppc,
          pps: pps,
          prestigeLevel: prestigeLevel,
          rewardMultiplier: rewardMultiplier,
          upgrades: upgrades
      },
      ...newProgress // Merge any additional progress data passed in
  };
  
  if (user) {
      // Save to Firebase if logged in
      firebase.firestore().collection("users").doc(user.uid)
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
}*/
