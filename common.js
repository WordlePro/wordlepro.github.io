/**
 * Wordle Common Logic
 */

// --- 基础状态 ---
let currentLang = localStorage.getItem('language') || 'en';
let isHighContrast = localStorage.getItem('wordle_high_contrast') === 'true';
let activePersistentToast = null;

// --- 主题管理 ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    document.body.classList.toggle('dark-mode', isDark);
    if (isHighContrast) document.body.classList.add('high-contrast');

    // 同步设置面板勾选框 (如果存在)
    const darkToggle = document.getElementById('setting-dark-mode');
    const contrastToggle = document.getElementById('setting-high-contrast');
    if (darkToggle) darkToggle.checked = isDark;
    if (contrastToggle) contrastToggle.checked = isHighContrast;
}

function toggleTheme(checked) {
    document.body.classList.toggle('dark-mode', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
}

function toggleHighContrast(checked) {
    isHighContrast = checked;
    document.body.classList.toggle('high-contrast', checked);
    localStorage.setItem('wordle_high_contrast', checked);
}

// --- 设置面板 ---
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'flex';
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('closing'); // 使用相同的 closing 类
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 200);
    }
}

// --- 多语言切换 ---
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    if (typeof updateUILanguage === 'function') {
        updateUILanguage();
    }
}

// --- UI 组件逻辑 ---
function showToast(msg, persistent = false) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    // 在显示任何新提示前，必须立即清理之前的持久提示
    clearPersistentToast();

    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = msg;
    container.appendChild(t);

    if (persistent) {
        activePersistentToast = t; // 记录这个持久化的提示框
        return t;
    } else {
        setTimeout(() => {
            t.classList.add("hide");
            setTimeout(() => t.remove(), 450);
        }, 1800);
    }
}

/**
 * 立即删除持久化提示框（不带动画）
 * 用于重新开始游戏时，防止新旧提示位置冲突
 */
function clearPersistentToast() {
    if (activePersistentToast) {
        activePersistentToast.remove(); // 核心：直接从 DOM 中移除
        activePersistentToast = null;
    }
}

function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        const msgEl = document.getElementById('modal-message');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const confirmBtn = document.getElementById('modal-confirm-btn');

        if (!overlay || !msgEl) return resolve(true);

        // 设置文本
        const t = i18n[currentLang];
        msgEl.textContent = message;
        if (cancelBtn) cancelBtn.textContent = t.cancel || "Cancel";
        if (confirmBtn) confirmBtn.textContent = t.confirm || "Confirm";

        // 显示弹窗：先移除可能存在的 closing 类，再显示
        overlay.classList.remove('closing');
        overlay.style.display = 'flex';

        // 处理点击后的清理逻辑
        const handleAction = (result) => {
            // 1. 触发消失动画
            overlay.classList.add('closing');

            // 2. 等待动画结束 (与 CSS 中的 0.2s 对应)
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('closing'); // 重置状态供下次使用

                // 移除监听器防止内存泄漏（可选）
                cancelBtn.onclick = null;
                confirmBtn.onclick = null;

                // 3. 最后返回结果
                resolve(result);
            }, 200);
        };

        cancelBtn.onclick = () => handleAction(false);
        confirmBtn.onclick = () => handleAction(true);
    });
}

function dismissStartScreen() {
    const screen = document.getElementById('start-screen');
    if (screen) {
        screen.classList.add('hidden');
        setTimeout(() => screen.style.display = 'none', 400);
    }
}

function updateClearBtnVisibility() {
    // 1. 先全部重置
    document.querySelectorAll('.clear-row-btn').forEach(btn => {
        btn.classList.remove('visible');
    });

    // 2. 找到当前活跃行
    const currentRowIdx = guesses.length;
    const activeBtn = document.getElementById(`clear-row-${currentRowIdx}`);

    // 3. 判断显示：当前行有字 且 游戏没结束
    if (activeBtn && currentGuess.length > 0 && gameStatus === "playing") {
        activeBtn.classList.add('visible');
    }
}

function clearCurrentLine() {
    if (document.activeElement) document.activeElement.blur();
    if (isAnimating || gameStatus !== "playing" || currentGuess.length === 0) return;

    const row = guesses.length;
    for (let c = 0; c < 5; c++) {
        // 兼容两种格式：tile-row-col (Hard) 和 tile-index (Normal)
        const t1 = document.getElementById(`tile-${row}-${c}`);
        const t2 = document.getElementById(`tile-${row * 5 + c}`);
        const tile = t1 || t2;
        if (tile) {
            tile.textContent = "";
            tile.removeAttribute("data-state");
            tile.classList.remove("pop");
        }
    }
    currentGuess = "";
    updateClearBtnVisibility();
}

// 初始化调用
window.addEventListener('DOMContentLoaded', initTheme);