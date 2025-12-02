document.addEventListener('DOMContentLoaded', () => {
    const cupsContainer = document.getElementById('cups-container');
    const progress = document.getElementById('progress');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressText = document.getElementById('progress-text');
    const currentDateEl = document.getElementById('current-date');
    const resetBtn = document.getElementById('reset-btn');

    const TOTAL_CUPS = 8;
    let filledCups = 0;

    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = `Today, ${today.toLocaleDateString(undefined, options)}`;

    const loadProgress = () => {
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

    const updateProgress = () => {
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

        saveProgress();
    };

    const createCups = () => {
        for (let i = 0; i < TOTAL_CUPS; i++) {
            const cup = document.createElement('button');
            cup.classList.add('cup');
            cup.innerHTML = `<span class="material-symbols-outlined">local_drink</span>`;
            cup.addEventListener('click', () => {
                if (cup.classList.contains('filled')) {
                    if (i === filledCups - 1) {
                        filledCups--;
                    }
                } else {
                    if (i === filledCups) {
                        filledCups++;
                    }
                }
                updateProgress();
            });
            cupsContainer.appendChild(cup);
        }
    };

    resetBtn.addEventListener('click', () => {
        filledCups = 0;
        updateProgress();
    });

    loadProgress();
    createCups();
    updateProgress();
});
