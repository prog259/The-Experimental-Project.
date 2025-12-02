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

    let TOTAL_CUPS = 8;
    let filledCups = 0;
    let audioCtx;

    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = `Today, ${today.toLocaleDateString(undefined, options)}`;

    const playWaterDropSound = () => {
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
        try {
            const savedGoal = localStorage.getItem('waterTrackerGoal');
            if (savedGoal) {
                TOTAL_CUPS = parseInt(savedGoal, 10);
                goalInput.value = TOTAL_CUPS;
            }

            const dataRaw = localStorage.getItem('waterTracker');
            if (dataRaw) {
                const data = JSON.parse(dataRaw);
                if (data && new Date(data.date).toDateString() === today.toDateString()) {
                    filledCups = data.filledCups;
                } else {
                    filledCups = 0;
                    saveProgress();
                }
            }
        } catch (e) {
            console.error("Error loading state from localStorage", e);
            // If data is corrupt, reset it.
            filledCups = 0;
            saveProgress();
        }
    };

    const saveProgress = () => {
        try {
            localStorage.setItem('waterTracker', JSON.stringify({ filledCups, date: today.toISOString() }));
        } catch (e) {
            console.error("Error saving progress to localStorage", e);
        }
    };

    const saveGoal = () => {
        try {
            localStorage.setItem('waterTrackerGoal', TOTAL_CUPS);
        } catch (e) {
            console.error("Error saving goal to localStorage", e);
        }
    };

    const updateUI = () => {
        const percentage = TOTAL_CUPS > 0 ? (filledCups / TOTAL_CUPS) * 100 : 0;
        progress.style.width = `${percentage}%`;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
        progressText.textContent = `${filledCups}/${TOTAL_CUPS} Glasses`;

        const cups = document.querySelectorAll('.cup');
        cups.forEach((cup, index) => {
            if (index < filledCups) {
                cup.classList.add('filled');
            } else {
                cup.classList.remove('filled');
            }
        });
    };

    const createCups = () => {
        cupsContainer.innerHTML = ''; // Clear existing cups
        for (let i = 0; i < TOTAL_CUPS; i++) {
            const cup = document.createElement('button');
            cup.classList.add('cup');
            cup.innerHTML = `<span class="material-symbols-outlined">local_drink</span>`;
            cup.addEventListener('click', () => {
                if (cup.classList.contains('filled') && i === filledCups - 1) {
                    filledCups--;
                    playWaterDropSound();
                } else if (!cup.classList.contains('filled') && i === filledCups) {
                    filledCups++;
                    playWaterDropSound();
                }
                saveProgress();
                updateUI();
            });
            cupsContainer.appendChild(cup);
        }
        updateUI(); // Ensure UI is correct after creating cups
    };

    resetBtn.addEventListener('click', () => {
        filledCups = 0;
        saveProgress();
        updateUI();
    });

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

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
        }
    });

    exportBtn.addEventListener('click', () => {
        try {
            const progressData = JSON.parse(localStorage.getItem('waterTracker')) || { filledCups: filledCups, date: today.toISOString() };
            const goalData = localStorage.getItem('waterTrackerGoal') || TOTAL_CUPS.toString();

            const dataToExport = {
                progress: progressData,
                goal: goalData
            };
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

    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && data.hasOwnProperty('progress') && data.hasOwnProperty('goal')) {
                    if (typeof data.progress.filledCups !== 'number' || typeof data.progress.date !== 'string') {
                        alert('Invalid data file: progress data is malformed.');
                        return;
                    }
                    const goal = parseInt(data.goal, 10);
                    if (isNaN(goal) || goal <= 0) {
                        alert('Invalid data file: goal is not a positive number.');
                        return;
                    }

                    localStorage.setItem('waterTracker', JSON.stringify(data.progress));
                    localStorage.setItem('waterTrackerGoal', data.goal.toString());

                    loadState();
                    createCups();

                    settingsModal.style.display = 'none';
                } else {
                    alert('Invalid data file: missing "progress" or "goal" keys.');
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert('Error importing data. The file might be corrupted or in the wrong format.');
            } finally {
                // Reset file input to allow re-importing the same file
                importFile.value = '';
            }
        };
        reader.readAsText(file);
    });

    // Initial load
    loadState();
    createCups();
});
