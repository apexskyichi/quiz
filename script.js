/**
 * かわいいクイズアプリ - メインスクリプト
 */

// ========================================
// グローバル変数
// ========================================
let quizData = null;           // 問題データ
let currentQuestion = null;    // 現在の問題
let availableQuestions = [];   // 出題可能な問題リスト
let masteredQuestions = new Set(); // マスター済み問題のID
let selectedGenres = [];       // 選択中のジャンル
let selectedSubgenres = {};    // 選択中のサブジャンル（ジャンルごと）
let questionRange = { start: null, end: null }; // 出題範囲
let isAnswerShown = false;     // 答え表示フラグ
let questionHistory = [];      // 出題履歴（重複防止用）
const MAX_HISTORY = 10;        // 履歴の最大保持数

// ========================================
// 初期化処理
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // データ読み込み
        await loadQuizData();
        
        // ローカルストレージから設定を復元
        loadSettings();
        
        // イベントリスナーの設定
        setupEventListeners();
        
        // 初回起動チェック
        if (isFirstTime()) {
            showSetupModal();
        } else {
            // 問題を表示
            updateAvailableQuestions();
            showNextQuestion();
        }
        
        // ローディング画面を非表示
        hideLoading();
        
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('問題データの読み込みに失敗しました。データファイルを確認してください。');
        hideLoading();
    }
});

// ========================================
// データ管理
// ========================================

/**
 * クイズデータを読み込む
 */
async function loadQuizData() {
    try {
        // キャッシュを回避するためにタイムスタンプを追加
        const timestamp = new Date().getTime();
        const response = await fetch(`./data/questions.json?t=${timestamp}`);
        if (!response.ok) {
            throw new Error('データファイルが見つかりません');
        }
        quizData = await response.json();
        
        // データ検証
        if (!quizData.questions || !quizData.genres) {
            throw new Error('データ形式が不正です');
        }
        
        console.log(`問題データ読み込み完了: ${quizData.questions.length}問`);
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        // デモデータを使用
        quizData = getDemoData();
        console.log('デモデータを使用します');
    }
}

/**
 * デモデータを返す
 */
function getDemoData() {
    return {
        questions: [
            {
                id: 1,
                genre: "英単語",
                subgenre: "基礎",
                question: '"apple" の意味は？',
                answer: "りんご",
                explanation: "果物の名前。赤や青のものがある。"
            },
            {
                id: 2,
                genre: "英単語",
                subgenre: "基礎",
                question: '"beautiful" の意味は？',
                answer: "美しい",
                explanation: "人や物の見た目が魅力的なことを表す形容詞。"
            },
            {
                id: 3,
                genre: "英単語",
                subgenre: "基礎",
                question: '"coffee" の意味は？',
                answer: "コーヒー",
                explanation: "コーヒー豆から作られる飲み物。"
            },
            {
                id: 4,
                genre: "日本史",
                subgenre: "江戸時代",
                question: "江戸幕府を開いた人物は？",
                answer: "徳川家康",
                explanation: "1603年に征夷大将軍となり、江戸に幕府を開いた。"
            },
            {
                id: 5,
                genre: "日本史",
                subgenre: "江戸時代",
                question: "江戸時代の身分制度を何というか？",
                answer: "士農工商",
                explanation: "武士・農民・職人・商人の4つの身分に分けられた制度。"
            },
            {
                id: 6,
                genre: "数学",
                subgenre: "幾何",
                question: "円周率πの近似値は？",
                answer: "3.14159...",
                explanation: "円の直径に対する円周の比率を表す無理数。"
            },
            {
                id: 7,
                genre: "数学",
                subgenre: "基礎",
                question: "2の10乗は？",
                answer: "1024",
                explanation: "2を10回掛け合わせた数。コンピュータでよく使われる。"
            }
        ],
        genres: ["英単語", "日本史", "数学"],
        metadata: {
            version: "1.0",
            lastUpdated: new Date().toISOString().split('T')[0],
            totalQuestions: 7
        }
    };
}

/**
 * 設定をローカルストレージから読み込む
 */
function loadSettings() {
    const saved = localStorage.getItem('quizSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        selectedGenres = settings.selectedGenres || [];
        selectedSubgenres = settings.selectedSubgenres || {};
        questionRange = settings.questionRange || { start: null, end: null };
        masteredQuestions = new Set(settings.masteredQuestions || []);
    }
}

/**
 * 設定をローカルストレージに保存する
 */
function saveSettings() {
    const settings = {
        selectedGenres,
        selectedSubgenres,
        questionRange,
        masteredQuestions: Array.from(masteredQuestions),
        lastAccessDate: new Date().toISOString()
    };
    localStorage.setItem('quizSettings', JSON.stringify(settings));
}

/**
 * 初回起動かチェック
 */
function isFirstTime() {
    return !localStorage.getItem('quizSettings');
}

// ========================================
// 問題管理
// ========================================

/**
 * 出題可能な問題リストを更新
 */
function updateAvailableQuestions() {
    if (!quizData || !quizData.questions) {
        availableQuestions = [];
        return;
    }
    
    availableQuestions = quizData.questions.filter(q => {
        // ジャンルフィルター
        if (selectedGenres.length > 0 && !selectedGenres.includes(q.genre)) {
            return false;
        }
        
        // サブジャンルフィルター
        if (selectedGenres.includes(q.genre) && selectedSubgenres[q.genre]) {
            const subgenreList = selectedSubgenres[q.genre];
            // サブジャンルが選択されていて、問題にサブジャンルがある場合のみフィルタ
            if (subgenreList && subgenreList.length > 0 && q.subgenre) {
                if (!subgenreList.includes(q.subgenre)) {
                    return false;
                }
            }
            // サブジャンルがない問題は、そのジャンルが選択されていれば含める
        }
        
        // 範囲フィルター
        if (questionRange.start && q.id < questionRange.start) {
            return false;
        }
        if (questionRange.end && q.id > questionRange.end) {
            return false;
        }
        
        // マスター済みフィルター
        if (masteredQuestions.has(q.id)) {
            return false;
        }
        
        return true;
    });
    
    updateProgressInfo();
}

/**
 * 次の問題を表示
 */
function showNextQuestion() {
    if (availableQuestions.length === 0) {
        showError('出題可能な問題がありません。設定を確認してください。');
        return;
    }
    
    // 履歴に含まれない問題を選ぶ
    let candidateQuestions = availableQuestions.filter(
        q => !questionHistory.includes(q.id)
    );
    
    // 候補がない場合は全問題から選ぶ
    if (candidateQuestions.length === 0) {
        candidateQuestions = availableQuestions;
        questionHistory = []; // 履歴をリセット
    }
    
    // ランダムに選択
    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    currentQuestion = candidateQuestions[randomIndex];
    
    // 履歴に追加
    questionHistory.push(currentQuestion.id);
    if (questionHistory.length > MAX_HISTORY) {
        questionHistory.shift();
    }
    
    // 問題を表示
    displayQuestion();
}

/**
 * 問題を画面に表示
 */
function displayQuestion() {
    if (!currentQuestion) return;
    
    // カードをリセット
    const card = document.getElementById('quizCard');
    card.classList.remove('flip');
    
    // 問題情報を設定
    // ジャンルタグにサブジャンルも表示
    let genreText = currentQuestion.genre;
    if (currentQuestion.subgenre) {
        genreText += ` · ${currentQuestion.subgenre}`;
    }
    document.getElementById('genreTag').textContent = genreText;
    document.getElementById('questionNumber').textContent = `#${currentQuestion.id}`;
    document.getElementById('questionText').textContent = currentQuestion.question;
    document.getElementById('answerText').textContent = currentQuestion.answer;
    document.getElementById('explanationText').textContent = currentQuestion.explanation;
    
    // セクションの表示切り替え
    document.getElementById('questionSection').style.display = 'block';
    document.getElementById('answerSection').classList.remove('show');
    
    // ボタンの表示切り替え
    document.getElementById('answerBtn').style.display = 'block';
    document.getElementById('nextBtn').style.display = 'none';
    
    // マスター済みボタンの状態更新
    updateMasterButton();
    
    // フラグをリセット
    isAnswerShown = false;
    
    // エラーメッセージをクリア
    hideError();
}

/**
 * 答えを表示
 */
function showAnswer() {
    if (isAnswerShown) return;
    
    const card = document.getElementById('quizCard');
    const answerSection = document.getElementById('answerSection');
    const answerBtn = document.getElementById('answerBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // カードアニメーション
    card.classList.add('flip');
    
    // 表示切り替え
    setTimeout(() => {
        document.getElementById('questionSection').style.display = 'none';
        answerSection.classList.add('show');
        answerBtn.style.display = 'none';
        nextBtn.style.display = 'block';
    }, 100);
    
    isAnswerShown = true;
}

// ========================================
// マスター済み管理
// ========================================

/**
 * マスター済みをトグル
 */
function toggleMaster() {
    if (!currentQuestion) return;
    
    if (masteredQuestions.has(currentQuestion.id)) {
        masteredQuestions.delete(currentQuestion.id);
    } else {
        masteredQuestions.add(currentQuestion.id);
    }
    
    saveSettings();
    updateMasterButton();
    updateAvailableQuestions();
}

/**
 * マスター済みボタンの表示更新
 */
function updateMasterButton() {
    const masterBtn = document.getElementById('masterBtn');
    if (!currentQuestion) return;
    
    if (masteredQuestions.has(currentQuestion.id)) {
        masterBtn.classList.add('mastered');
        masterBtn.innerHTML = 'マスター解除 ↩️';
    } else {
        masterBtn.classList.remove('mastered');
        masterBtn.innerHTML = 'マスター済み ✨';
    }
}

/**
 * すべてのマスター済みをリセット
 */
function resetAllMastered() {
    if (confirm('本当にすべてのマスター済み問題をリセットしますか？')) {
        masteredQuestions.clear();
        saveSettings();
        updateAvailableQuestions();
        updateMasterButton();
        closeSettings();
        showNextQuestion();
    }
}

/**
 * 選択ジャンルのマスター済みをリセット
 */
function resetGenreMastered() {
    if (selectedGenres.length === 0) {
        alert('ジャンルを選択してください');
        return;
    }
    
    if (confirm(`選択中のジャンル（${selectedGenres.join(', ')}）のマスター済みをリセットしますか？`)) {
        // 該当ジャンルの問題IDを取得
        const targetIds = quizData.questions
            .filter(q => selectedGenres.includes(q.genre))
            .map(q => q.id);
        
        // マスター済みから削除
        targetIds.forEach(id => masteredQuestions.delete(id));
        
        saveSettings();
        updateAvailableQuestions();
        updateMasterButton();
        closeSettings();
        showNextQuestion();
    }
}

// ========================================
// UI制御
// ========================================

/**
 * 進捗情報を更新
 */
function updateProgressInfo() {
    const totalInRange = quizData.questions.filter(q => {
        if (selectedGenres.length > 0 && !selectedGenres.includes(q.genre)) {
            return false;
        }
        // サブジャンルフィルター
        if (selectedGenres.includes(q.genre) && selectedSubgenres[q.genre]) {
            const subgenreList = selectedSubgenres[q.genre];
            if (subgenreList && subgenreList.length > 0 && q.subgenre) {
                if (!subgenreList.includes(q.subgenre)) {
                    return false;
                }
            }
        }
        if (questionRange.start && q.id < questionRange.start) {
            return false;
        }
        if (questionRange.end && q.id > questionRange.end) {
            return false;
        }
        return true;
    }).length;
    
    const masteredInRange = quizData.questions.filter(q => {
        if (selectedGenres.length > 0 && !selectedGenres.includes(q.genre)) {
            return false;
        }
        // サブジャンルフィルター
        if (selectedGenres.includes(q.genre) && selectedSubgenres[q.genre]) {
            const subgenreList = selectedSubgenres[q.genre];
            if (subgenreList && subgenreList.length > 0 && q.subgenre) {
                if (!subgenreList.includes(q.subgenre)) {
                    return false;
                }
            }
        }
        if (questionRange.start && q.id < questionRange.start) {
            return false;
        }
        if (questionRange.end && q.id > questionRange.end) {
            return false;
        }
        return masteredQuestions.has(q.id);
    }).length;
    
    document.getElementById('currentGenre').textContent = 
        selectedGenres.length === 0 ? 'すべて' : selectedGenres.join(', ');
    document.getElementById('remainingCount').textContent = availableQuestions.length;
    document.getElementById('totalCount').textContent = totalInRange;
    document.getElementById('masteredCount').textContent = masteredInRange;
}

/**
 * 設定モーダルを表示
 */
function showSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('show');
    
    // ジャンルリストを生成
    const genreList = document.getElementById('genreList');
    genreList.innerHTML = '';
    
    quizData.genres.forEach(genre => {
        const count = quizData.questions.filter(q => q.genre === genre).length;
        const item = document.createElement('label');
        item.className = 'genre-item';
        item.innerHTML = `
            <input type="checkbox" value="${genre}" 
                   ${selectedGenres.includes(genre) ? 'checked' : ''}
                   onchange="updateSubgenreList('${genre}')">
            <span>${genre}</span>
            <span class="genre-count">${count}問</span>
        `;
        genreList.appendChild(item);
    });
    
    // サブジャンルリストのコンテナを追加
    const subgenreContainer = document.getElementById('subgenreContainer');
    if (subgenreContainer) {
        subgenreContainer.innerHTML = '';
        
        // 選択されているジャンルのサブジャンルを表示
        selectedGenres.forEach(genre => {
            createSubgenreSection(genre);
        });
    }
    
    // 範囲設定を反映
    document.getElementById('rangeStart').value = questionRange.start || '';
    document.getElementById('rangeEnd').value = questionRange.end || '';
    
    // 統計情報を更新
    updateStatsInfo();
}

/**
 * サブジャンルセクションを作成
 */
function createSubgenreSection(genre) {
    const container = document.getElementById('subgenreContainer');
    if (!container) return;
    
    // そのジャンルのサブジャンルを取得
    const subgenres = [...new Set(
        quizData.questions
            .filter(q => q.genre === genre && q.subgenre)
            .map(q => q.subgenre)
    )];
    
    if (subgenres.length === 0) return;
    
    const section = document.createElement('div');
    section.className = 'setting-group';
    section.setAttribute('data-genre-section', genre);
    
    const label = document.createElement('label');
    label.className = 'setting-label';
    label.innerHTML = `📂 ${genre} のサブジャンル`;
    section.appendChild(label);
    
    const list = document.createElement('div');
    list.className = 'subgenre-list genre-list';
    list.setAttribute('data-genre', genre);
    
    subgenres.forEach(subgenre => {
        const count = quizData.questions.filter(q => 
            q.genre === genre && q.subgenre === subgenre
        ).length;
        
        const isChecked = selectedSubgenres[genre] && 
                         selectedSubgenres[genre].includes(subgenre);
        
        const item = document.createElement('label');
        item.className = 'genre-item';
        item.innerHTML = `
            <input type="checkbox" value="${subgenre}" 
                   ${isChecked ? 'checked' : ''}>
            <span>${subgenre}</span>
            <span class="genre-count">${count}問</span>
        `;
        list.appendChild(item);
    });
    
    section.appendChild(list);
    container.appendChild(section);
}

/**
 * ジャンルのチェック状態が変わったときの処理
 */
function updateSubgenreList(genre) {
    const checkbox = document.querySelector(`#genreList input[value="${genre}"]`);
    const section = document.querySelector(`[data-genre-section="${genre}"]`);
    
    if (checkbox.checked) {
        // チェックされた場合、サブジャンルセクションを追加
        if (!section) {
            createSubgenreSection(genre);
        }
    } else {
        // チェックが外れた場合、サブジャンルセクションを削除
        if (section) {
            section.remove();
        }
    }
}

// グローバルに公開
window.updateSubgenreList = updateSubgenreList;

/**
 * 統計情報を更新
 */
function updateStatsInfo() {
    const totalQuestions = quizData.questions.length;
    const totalMastered = masteredQuestions.size;
    const genreStats = {};
    
    quizData.genres.forEach(genre => {
        const genreQuestions = quizData.questions.filter(q => q.genre === genre);
        const genreMastered = genreQuestions.filter(q => masteredQuestions.has(q.id)).length;
        genreStats[genre] = {
            total: genreQuestions.length,
            mastered: genreMastered
        };
    });
    
    let statsHTML = `
        <div class="stats-item">
            <span class="stats-label">総問題数</span>
            <span class="stats-value">${totalQuestions}問</span>
        </div>
        <div class="stats-item">
            <span class="stats-label">マスター済み</span>
            <span class="stats-value">${totalMastered}問</span>
        </div>
    `;
    
    for (const [genre, stats] of Object.entries(genreStats)) {
        statsHTML += `
            <div class="stats-item">
                <span class="stats-label">${genre}</span>
                <span class="stats-value">${stats.mastered}/${stats.total}問</span>
            </div>
        `;
    }
    
    document.getElementById('statsInfo').innerHTML = statsHTML;
}

/**
 * 設定モーダルを閉じる
 */
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('show');
    
    // ジャンル設定を保存
    const checkedGenres = Array.from(
        document.querySelectorAll('#genreList input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    selectedGenres = checkedGenres.length > 0 ? checkedGenres : [];
    
    // サブジャンル設定を保存
    const newSelectedSubgenres = {};
    selectedGenres.forEach(genre => {
        const checkedSubgenres = Array.from(
            document.querySelectorAll(`.subgenre-list[data-genre="${genre}"] input[type="checkbox"]:checked`)
        ).map(cb => cb.value);
        
        if (checkedSubgenres.length > 0) {
            newSelectedSubgenres[genre] = checkedSubgenres;
        }
    });
    selectedSubgenres = newSelectedSubgenres;
    
    // 範囲設定を保存
    const startVal = document.getElementById('rangeStart').value;
    const endVal = document.getElementById('rangeEnd').value;
    questionRange = {
        start: startVal ? parseInt(startVal) : null,
        end: endVal ? parseInt(endVal) : null
    };
    
    saveSettings();
    updateAvailableQuestions();
}

/**
 * 初回セットアップモーダルを表示
 */
function showSetupModal() {
    const modal = document.getElementById('setupModal');
    modal.classList.add('show');
    
    // ジャンルリストを生成
    const genreList = document.getElementById('setupGenreList');
    genreList.innerHTML = '';
    
    quizData.genres.forEach(genre => {
        const count = quizData.questions.filter(q => q.genre === genre).length;
        const item = document.createElement('label');
        item.className = 'genre-item';
        item.innerHTML = `
            <input type="checkbox" value="${genre}" checked>
            <span>${genre}</span>
            <span class="genre-count">${count}問</span>
        `;
        genreList.appendChild(item);
    });
}

/**
 * 学習を開始
 */
function startLearning() {
    const checkedGenres = Array.from(
        document.querySelectorAll('#setupGenreList input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (checkedGenres.length === 0) {
        alert('少なくとも1つのジャンルを選択してください');
        return;
    }
    
    selectedGenres = checkedGenres;
    
    // 初回は選択されたジャンルのすべてのサブジャンルを選択
    selectedSubgenres = {};
    selectedGenres.forEach(genre => {
        const subgenres = [...new Set(
            quizData.questions
                .filter(q => q.genre === genre && q.subgenre)
                .map(q => q.subgenre)
        )];
        if (subgenres.length > 0) {
            selectedSubgenres[genre] = subgenres;
        }
    });
    
    saveSettings();
    
    const modal = document.getElementById('setupModal');
    modal.classList.remove('show');
    
    updateAvailableQuestions();
    showNextQuestion();
}

/**
 * エラーメッセージを表示
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = errorDiv.querySelector('.error-text');
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
}

/**
 * エラーメッセージを非表示
 */
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

/**
 * ローディング画面を非表示
 */
function hideLoading() {
    const loading = document.getElementById('loadingScreen');
    loading.classList.add('hide');
    setTimeout(() => {
        loading.style.display = 'none';
    }, 500);
}

/**
 * データを再読み込み
 */
async function reloadData() {
    if (confirm('問題データを再読み込みしますか？')) {
        showLoading();
        
        // Service Workerのキャッシュをクリア（可能な場合）
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    console.log('キャッシュをクリア:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }
        
        await loadQuizData();
        updateAvailableQuestions();
        showNextQuestion();
        hideLoading();
        closeSettings();
        alert('データを再読み込みしました');
        
        // ページをリロード（確実にService Workerを更新）
        window.location.reload(true);
    }
}

/**
 * ローディング画面を表示
 */
function showLoading() {
    const loading = document.getElementById('loadingScreen');
    loading.style.display = 'flex';
    loading.classList.remove('hide');
}

// ========================================
// イベントリスナー設定
// ========================================
function setupEventListeners() {
    // ダブルタップによるズームを防止
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // iOSのバウンススクロールを防止
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('.main-container')) {
            // メインコンテナ内はスクロール許可
            return;
        }
        e.preventDefault();
    }, { passive: false });
    
    // 答えを見るボタン
    document.getElementById('answerBtn').addEventListener('click', showAnswer);
    
    // 次の問題へボタン
    document.getElementById('nextBtn').addEventListener('click', () => {
        showNextQuestion();
    });
    
    // マスター済みボタン
    document.getElementById('masterBtn').addEventListener('click', toggleMaster);
    
    // 設定ボタン
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    
    // 設定モーダルを閉じる
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    
    // モーダル外クリックで閉じる
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeSettings();
        }
    });
    
    // リセットボタン
    document.getElementById('resetAllBtn').addEventListener('click', resetAllMastered);
    document.getElementById('resetGenreBtn').addEventListener('click', resetGenreMastered);
    
    // データ再読み込みボタン
    document.getElementById('reloadDataBtn').addEventListener('click', reloadData);
    
    // 全選択・選択解除ボタン
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        document.querySelectorAll('#genreList input[type="checkbox"]').forEach(cb => {
            if (!cb.checked) {
                cb.checked = true;
                updateSubgenreList(cb.value);
            }
        });
    });
    
    document.getElementById('selectNoneBtn').addEventListener('click', () => {
        document.querySelectorAll('#genreList input[type="checkbox"]').forEach(cb => {
            if (cb.checked) {
                cb.checked = false;
                updateSubgenreList(cb.value);
            }
        });
    });
    
    // 学習開始ボタン
    document.getElementById('startBtn').addEventListener('click', startLearning);
    
    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!isAnswerShown && currentQuestion) {
                showAnswer();
            } else if (isAnswerShown) {
                showNextQuestion();
            }
        }
    });
    
    // タッチジェスチャー（スワイプで次の問題）
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeDistance = touchStartX - touchEndX;
        if (Math.abs(swipeDistance) > 50 && isAnswerShown) {
            // 左スワイプで次の問題
            if (swipeDistance > 0) {
                showNextQuestion();
            }
        }
    }
}