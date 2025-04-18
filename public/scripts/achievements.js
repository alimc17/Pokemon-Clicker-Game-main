// Define the achievements array at the global scope outside of any function
window.achievements = [
    { id: 'points_100k', name: 'P100K Master', description: 'Earn 100,000 Pokédollars', requirement: 100000, type: 'points', icon: 'assets/images/achievements/p100k.png', unlocked: false },
    { id: 'points_1m', name: 'Millionaire', description: 'Earn 1,000,000 Pokédollars', requirement: 1000000, type: 'points', icon: 'assets/images/achievements/p1m.png', unlocked: false },
    { id: 'prestige_1', name: 'First Journey', description: 'Reach Prestige Level 1', requirement: 1, type: 'prestige', icon: 'assets/images/achievements/prestige1.png', unlocked: false },
    { id: 'prestige_5', name: 'Region Master', description: 'Reach Prestige Level 5', requirement: 5, type: 'prestige', icon: 'assets/images/achievements/prestige5.png', unlocked: false },
    { id: 'upgrades_10', name: 'Collector', description: 'Obtain 10 total Pokémon upgrades', requirement: 10, type: 'upgrades', icon: 'assets/images/achievements/upgrades10.png', unlocked: false },
    { id: 'upgrades_25', name: 'Professor', description: 'Obtain 25 total Pokémon upgrades', requirement: 25, type: 'upgrades', icon: 'assets/images/achievements/upgrades25.png', unlocked: false }
];

/*
// Create HTML elements for achievements
function createAchievementElements() {
    const achievementsContainer = document.createElement('div');
    achievementsContainer.classList.add('achievements-container');
    achievementsContainer.style.display = 'none';
    
    const achievementsHeader = document.createElement('div');
    achievementsHeader.classList.add('achievements-header');
    achievementsHeader.innerHTML = '<h2>Achievements</h2><span class="close-achievements">&times;</span>';
    achievementsContainer.appendChild(achievementsHeader);
    
    const achievementsList = document.createElement('div');
    achievementsList.classList.add('achievements-list');
    
    window.achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.classList.add('achievement');
        achievementElement.setAttribute('data-id', achievement.id);
        if (!achievement.unlocked) {
            achievementElement.classList.add('locked');
        }
        
        achievementElement.innerHTML = `
            <div class="achievement-icon">
                <img src="${achievement.unlocked ? achievement.icon : 'assets/images/achievements/locked.png'}" alt="${achievement.name}">
            </div>
            <div class="achievement-info">
                <h3>${achievement.unlocked ? achievement.name : '???'}</h3>
                <p>${achievement.unlocked ? achievement.description : 'Achievement locked'}</p>
            </div>
        `;
        
        achievementsList.appendChild(achievementElement);
    });
    
    achievementsContainer.appendChild(achievementsList);
    document.body.appendChild(achievementsContainer);
    
    // Add event listeners
    document.querySelector('.close-achievements').addEventListener('click', () => {
        achievementsContainer.style.display = 'none';
    });
    
    // Add button to navigation
    const achievementsButton = document.createElement('button');
    achievementsButton.classList.add('btn-custom');
    achievementsButton.textContent = 'Achievements';
    achievementsButton.addEventListener('click', () => {
        achievementsContainer.style.display = 'flex';
    });
    
    const leftNav = document.getElementById('nav-left');
    leftNav.appendChild(achievementsButton);
}
*/

// Check achievements and update UI
function checkAchievements() {
    let newUnlocks = false;
    
    window.achievements.forEach(achievement => {
        if (achievement.unlocked) return;
        
        let requirement = false;
        
        switch(achievement.type) {
            case 'points':
                requirement = window.pTotal >= achievement.requirement;
                break;
            case 'prestige':
                requirement = window.prestigeLevel >= achievement.requirement;
                break;
            case 'upgrades':
                const totalUpgrades = window.upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0);
                requirement = totalUpgrades >= achievement.requirement;
                break;
        }
        
        if (requirement) {
            achievement.unlocked = true;
            newUnlocks = true;
            
            // Update UI for this achievement
            const achievementElement = document.querySelector(`.achievement[data-id="${achievement.id}"]`);
            if (achievementElement) {
                achievementElement.classList.remove('locked');
                achievementElement.querySelector('h3').textContent = achievement.name;
                achievementElement.querySelector('p').textContent = achievement.description;
                achievementElement.querySelector('img').src = achievement.icon;
            }
            
            // Show notification
            showAchievementNotification(achievement);
        }
    });
    
    // If any achievements were unlocked, save progress
    if (newUnlocks) {
        updateGameProgress({ achievements: window.achievements });
    }
}

// Show achievement notification
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.classList.add('achievement-notification');
    notification.innerHTML = `
        <div class="notification-icon">
            <img src="${achievement.icon}" alt="${achievement.name}">
        </div>
        <div class="notification-info">
            <h3>Achievement Unlocked!</h3>
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Play sound effect
    try {
        const achievementSFX = new Audio('assets/audio/achievement.wav');
        achievementSFX.volume = 0.3;
        achievementSFX.play();
    } catch (error) {
        console.log("Achievement sound effect not found");
    }
    
    // Remove notification after a delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 1000);
    }, 5000);
}

// Add CSS for achievements
function addAchievementStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .achievements-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 600px;
            max-height: 80vh;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            color: white;
        }
        
        .achievements-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 10px;
        }
        
        .close-achievements {
            font-size: 24px;
            cursor: pointer;
        }
        
        .achievements-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            overflow-y: auto;
            max-height: calc(80vh - 80px);
            padding-right: 10px;
        }
        
        .achievement {
            display: flex;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 10px;
            transition: all 0.3s ease;
        }
        
        .achievement.locked {
            filter: grayscale(100%);
            opacity: 0.7;
        }
        
        .achievement-icon {
            width: 50px;
            height: 50px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .achievement-icon img {
            max-width: 100%;
            max-height: 100%;
        }
        
        .achievement-info h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
        }
        
        .achievement-info p {
            margin: 0;
            font-size: 14px;
            opacity: 0.8;
        }
        
        .achievement-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            align-items: center;
            color: white;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            animation: slide-in 0.5s ease forwards;
            max-width: 300px;
        }
        
        .achievement-notification.fade-out {
            animation: fade-out 1s ease forwards;
        }
        
        .notification-icon {
            width: 50px;
            height: 50px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-icon img {
            max-width: 100%;
            max-height: 100%;
        }
        
        .notification-info h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
            color: gold;
        }
        
        .notification-info h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
        }
        
        .notification-info p {
            margin: 0;
            font-size: 12px;
            opacity: 0.8;
        }
        
        @keyframes slide-in {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fade-out {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Initialize achievements
function initAchievements() {
    addAchievementStyles();
    createAchievementElements();
    
    // Check achievements periodically
    setInterval(checkAchievements, 5000);
    
    // Also check when specific events occur
    document.querySelector('.pokeball').addEventListener('click', checkAchievements);
    
    // Hook into prestige confirmation
    const originalPrestigeConfirmation = handlePrestigeConfirmation;
    window.handlePrestigeConfirmation = function() {
        originalPrestigeConfirmation();
        checkAchievements();
    };
}

// Extend applyGameState to handle loading achievements
const originalApplyGameState = window.applyGameState;
window.applyGameState = function(gameState) {
    originalApplyGameState(gameState);
    
    // Load achievements if available
    if (gameState.achievements) {
        gameState.achievements.forEach(savedAchievement => {
            const achievement = window.achievements.find(a => a.id === savedAchievement.id);
            if (achievement) {
                achievement.unlocked = savedAchievement.unlocked;
                
                // Update UI for this achievement if elements exist
                const achievementElement = document.querySelector(`.achievement[data-id="${achievement.id}"]`);
                if (achievementElement && achievement.unlocked) {
                    achievementElement.classList.remove('locked');
                    achievementElement.querySelector('h3').textContent = achievement.name;
                    achievementElement.querySelector('p').textContent = achievement.description;
                    achievementElement.querySelector('img').src = achievement.icon;
                }
            }
        });
    }
};

// Initialize achievements when the DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    // Wait a bit to ensure other scripts have initialized
    setTimeout(initAchievements, 1000);
});