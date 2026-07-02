(function () {
    var STORAGE_KEY = 'dlpReportLayout';
    var body = document.body;
    var splitBtn = document.getElementById('layoutSplitBtn');
    var stackedBtn = document.getElementById('layoutStackedBtn');

    if (!splitBtn || !stackedBtn) return;

    function applyLayout(mode) {
        if (mode === 'stacked') {
            body.classList.add('stacked-layout');
            stackedBtn.classList.add('active');
            stackedBtn.setAttribute('aria-pressed', 'true');
            splitBtn.classList.remove('active');
            splitBtn.setAttribute('aria-pressed', 'false');
        } else {
            mode = 'split';
            body.classList.remove('stacked-layout');
            splitBtn.classList.add('active');
            splitBtn.setAttribute('aria-pressed', 'true');
            stackedBtn.classList.remove('active');
            stackedBtn.setAttribute('aria-pressed', 'false');
        }
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) {
            /* localStorage unavailable — layout choice just won't persist */
        }
    }

    splitBtn.addEventListener('click', function () { applyLayout('split'); });
    stackedBtn.addEventListener('click', function () { applyLayout('stacked'); });

    var saved = 'split';
    try {
        saved = localStorage.getItem(STORAGE_KEY) || 'split';
    } catch (e) {
        /* localStorage unavailable — default to split */
    }
    applyLayout(saved);
})();