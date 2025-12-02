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
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        const savedGoal = localStorage.getItem('waterTrackerGoal');
        if (savedGoal) {
            TOTAL_CUPS = parseInt(savedGoal, 10);
            goalInput.value = TOTAL_CUPS;
        }

        const data = JSON.parse(localStorage.getItem('waterTracker'));
        if (data && new Date(data.date).toDateString() === today.toDateString()) {
            filledCups = data.filledCups;
        } else {
            filledCups = 0;
            saveProgress();
        }
    };

    const saveProgress = () => {
        localStorage.setItem('waterTracker', JSON.stringify({ filledCups, date: today.toISOString() }));
    };

    const saveGoal = () => {
        localStorage.setItem('waterTrackerGoal', TOTAL_CUPS);
    };

    const updateUI = () => {
        const percentage = (filledCups / TOTAL_CUPS) * 100;
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
            updateUI();
        }
    });

    exportBtn.addEventListener('click', () => {
        const data = {
            progress: JSON.parse(localStorage.getItem('waterTracker')),
            goal: localStorage.getItem('waterTrackerGoal')
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "water_tracker_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.progress && data.goal) {
                        localStorage.setItem('waterTracker', JSON.stringify(data.progress));
                        localStorage.setItem('waterTrackerGoal', data.goal);
                        loadState();
                        createCups();
                        updateUI();
                        settingsModal.style.display = 'none';
                    } else {
                        alert('Invalid data file.');
                    }
                } catch (error) {
                    alert('Error importing data.');
                }
            };
            reader.readAsText(file);
        }
    });

    loadState();
    createCups();
    updateUI();
});
