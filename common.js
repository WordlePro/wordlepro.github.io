/**
 * Wordle Common Logic
 */

// --- 基础状态 ---
let currentLang = localStorage.getItem('language') || 'en';
let isHighContrast = localStorage.getItem('wordle_high_contrast') === 'true';

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

    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = msg;
    container.appendChild(t);

    if (persistent) {
        return t; // 返回引用以便后续手动移除
    } else {
        setTimeout(() => {
            t.classList.add("hide");
            setTimeout(() => t.remove(), 450);
        }, 1800);
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

// 初始化调用
window.addEventListener('DOMContentLoaded', initTheme);