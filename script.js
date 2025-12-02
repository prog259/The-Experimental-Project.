document.addEventListener('DOMContentLoaded', () => {
    const cupsContainer = document.getElementById('cups-container');
    const progress = document.getElementById('progress');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressText = document.getElementById('progress-text');
    const currentDateEl = document.getElementById('current-date');
    const resetBtn = document.getElementById('reset-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.querySelector('.close-btn');
    const goalInput = document.getElementById('goal-input');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const messageContainer = document.getElementById('message-container');

    let TOTAL_CUPS = 8;
    let filledCups = 0;
    let audioCtx;
    let trackingData = {};

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = `Today, ${today.toLocaleDateString(undefined, options)}`;

    const playWaterDropSound = () => {
        // Sound playing logic...
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.");
                return;
            }
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    };

    const loadState = () => {
        // State loading logic...
        try {
            const savedGoal = localStorage.getItem('waterTrackerGoal');
            if (savedGoal) {
                TOTAL_CUPS = parseInt(savedGoal, 10);
                goalInput.value = TOTAL_CUPS;
            }
            const dataRaw = localStorage.getItem('waterTrackerHistory');
            if (dataRaw) {
                trackingData = JSON.parse(dataRaw);
                filledCups = trackingData[todayStr] || 0;
            } else {
                trackingData = {};
                filledCups = 0;
                saveProgress();
            }
        } catch (e) {
            console.error("Error loading state from localStorage", e);
            trackingData = {};
            filledCups = 0;
            saveProgress();
        }
    };

    const saveProgress = () => {
        // Save progress logic...
        try {
            trackingData[todayStr] = filledCups;
            localStorage.setItem('waterTrackerHistory', JSON.stringify(trackingData));
        } catch (e) {
            console.error("Error saving progress to localStorage", e);
        }
    };

    const saveGoal = () => {
        // Save goal logic...
        try {
            localStorage.setItem('waterTrackerGoal', TOTAL_CUPS);
        } catch (e) {
            console.error("Error saving goal to localStorage", e);
        }
    };

    const updateUI = () => {
        // UI update logic...
        const percentage = TOTAL_CUPS > 0 ? (filledCups / TOTAL_CUPS) * 100 : 0;
        progress.style.width = `${percentage}%`;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
        progressText.textContent = `${filledCups}/${TOTAL_CUPS} Glasses`;
        const cups = document.querySelectorAll('.cup');
        cups.forEach((cup, index) => {
            cup.classList.toggle('filled', index < filledCups);
        });
    };

    const createCups = () => {
        // Cup creation logic...
        cupsContainer.innerHTML = '';
        for (let i = 0; i < TOTAL_CUPS; i++) {
            const cup = document.createElement('button');
            cup.classList.add('cup');
            cup.innerHTML = `<span class="material-symbols-outlined">local_drink</span>`;
            cup.addEventListener('click', () => {
                if (cup.classList.contains('filled') && i === filledCups - 1) {
                    filledCups--;
                } else if (!cup.classList.contains('filled') && i === filledCups) {
                    filledCups++;
                }
                playWaterDropSound();
                saveProgress();
                updateUI();
                checkStreak();
            });
            cupsContainer.appendChild(cup);
        }
        updateUI();
    };

    const checkMissedDay = () => {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Show message only if there's history and yesterday is missing.
        if (Object.keys(trackingData).length > 0 && !trackingData.hasOwnProperty(todayStr) && !trackingData.hasOwnProperty(yesterdayStr)) {
            const mostRecentDate = Object.keys(trackingData).sort().pop();
            if(mostRecentDate) {
                 messageContainer.textContent = "You forgot yesterday's quote. Don't forget today's!";
                 messageContainer.style.display = 'block';
            }
        }
    };

    const checkStreak = () => {
        let streak = 0;
        const goal = parseInt(localStorage.getItem('waterTrackerGoal') || TOTAL_CUPS, 10);
        let dayToTest = new Date(today);

        // Determine starting point for streak
        const todayCups = trackingData[todayStr] || 0;
        if (todayCups < goal) {
            // If today's goal isn't met, streak must have ended yesterday
            dayToTest.setDate(dayToTest.getDate() - 1);
        }

        // Loop backwards from starting day
        while (true) {
            const dateStr = dayToTest.toISOString().split('T')[0];
            const cupsThatDay = trackingData[dateStr];

            if (cupsThatDay !== undefined && cupsThatDay >= goal) {
                streak++;
                dayToTest.setDate(dayToTest.getDate() - 1); // Move to the previous day
            } else {
                break; // Streak is broken
            }
        }

        if (streak > 0) {
            messageContainer.textContent = `You're on a ${streak}-day streak! Keep it up!`;
            messageContainer.style.display = 'block';
        } else {
            // If no streak, hide the message so the missed day message can show if needed.
            messageContainer.style.display = 'none';
        }
    };

    // Event listeners and other functions...
    resetBtn.addEventListener('click', () => { filledCups = 0; saveProgress(); updateUI(); });
    settingsBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target === settingsModal) { settingsModal.style.display = 'none'; } });

    goalInput.addEventListener('change', () => {
        const newGoal = parseInt(goalInput.value, 10);
        if (newGoal > 0 && newGoal !== TOTAL_CUPS) {
            TOTAL_CUPS = newGoal;
            if (filledCups > TOTAL_CUPS) {
                filledCups = TOTAL_CUPS;
                saveProgress();
            }
            saveGoal();
            createCups();
            checkStreak();
        }
    });

    exportBtn.addEventListener('click', () => {
        try {
            const historyData = localStorage.getItem('waterTrackerHistory') || '{}';
            const goalData = localStorage.getItem('waterTrackerGoal') || TOTAL_CUPS.toString();
            const dataToExport = { history: JSON.parse(historyData), goal: goalData };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "water_tracker_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (e) {
            console.error("Error exporting data", e);
            alert("Could not export data.");
        }
    });

    importBtn.addEventListener('click', () => { importFile.click(); });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && data.hasOwnProperty('history') && data.hasOwnProperty('goal')) {
                    const goal = parseInt(data.goal, 10);
                    if (isNaN(goal) || goal <= 0) {
                        alert('Invalid data file: goal is not a positive number.');
                        return;
                    }
                    localStorage.setItem('waterTrackerHistory', JSON.stringify(data.history));
                    localStorage.setItem('waterTrackerGoal', data.goal.toString());

                    loadState();
                    createCups();
                    checkStreak(); // Check streak after import
                    checkMissedDay(); // Check for missed day after import

                    settingsModal.style.display = 'none';
                } else {
                    alert('Invalid data file: missing "history" or "goal" keys.');
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert('Error importing data.');
            } finally {
                importFile.value = '';
            }
        };
        reader.readAsText(file);
    });

    // Initial load
    loadState();
    createCups();
    checkStreak();
    checkMissedDay();
});
