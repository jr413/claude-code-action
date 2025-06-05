// TeleAI エグゼクティブダッシュボード
// リアルタイムアナリティクスとデータ可視化

// API設定
const API_BASE_URL = 'https://teleai-pro-api.onrender.com';
const REFRESH_INTERVAL = 30000; // 30秒ごとに更新

// グローバル変数
let refreshTimer;
let callsChart;
let usersChart;
let wsConnection;

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    initializeCharts();
    loadDashboardData();
    setupWebSocket();
    startAutoRefresh();
});

// ダッシュボードの初期化
function initializeDashboard() {
    updateLastUpdateTime();
    console.log('TeleAI ダッシュボード初期化完了');
}

// イベントリスナーの設定
function setupEventListeners() {
    // 更新ボタン
    document.getElementById('refreshBtn').addEventListener('click', () => {
        const icon = document.querySelector('#refreshBtn i');
        icon.classList.add('spinning');
        loadDashboardData().finally(() => {
            icon.classList.remove('spinning');
        });
    });

    // エクスポートボタン
    document.getElementById('exportBtn').addEventListener('click', () => {
        showExportModal();
    });

    // モーダル閉じるボタン
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        hideExportModal();
    });

    // エクスポートオプション
    document.querySelectorAll('.export-option').forEach(button => {
        button.addEventListener('click', (e) => {
            const format = e.currentTarget.dataset.format;
            exportData(format);
        });
    });

    // モーダル外側クリックで閉じる
    document.getElementById('exportModal').addEventListener('click', (e) => {
        if (e.target.id === 'exportModal') {
            hideExportModal();
        }
    });
}

// チャートの初期化
function initializeCharts() {
    // 通話数の推移チャート
    const callsCtx = document.getElementById('callsChart').getContext('2d');
    callsChart = new Chart(callsCtx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(),
            datasets: [{
                label: '通話数',
                data: generateRandomData(24, 50, 200),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // ユーザー分布チャート
    const usersCtx = document.getElementById('usersChart').getContext('2d');
    usersChart = new Chart(usersCtx, {
        type: 'doughnut',
        data: {
            labels: ['新規ユーザー', 'アクティブユーザー', '休眠ユーザー'],
            datasets: [{
                data: [30, 50, 20],
                backgroundColor: [
                    '#10b981',
                    '#2563eb',
                    '#6b7280'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ダッシュボードデータの読み込み
async function loadDashboardData() {
    try {
        // 実際のAPIが利用可能になったら、以下のコメントを解除
        // const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`);
        // const data = await response.json();
        
        // デモデータを使用
        const data = generateMockData();
        
        updateKPIs(data.kpis);
        updateCallsTable(data.recentCalls);
        updateCharts(data.chartData);
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

// KPIの更新
function updateKPIs(kpis) {
    document.getElementById('totalCalls').textContent = formatNumber(kpis.totalCalls);
    document.getElementById('avgDuration').textContent = formatDuration(kpis.avgDuration);
    document.getElementById('activeUsers').textContent = formatNumber(kpis.activeUsers);
    document.getElementById('satisfactionScore').textContent = kpis.satisfactionScore.toFixed(1);
}

// 通話テーブルの更新
function updateCallsTable(calls) {
    const tbody = document.getElementById('callsTableBody');
    tbody.innerHTML = '';
    
    calls.forEach(call => {
        const row = createCallRow(call);
        tbody.appendChild(row);
    });
}

// 通話行の作成
function createCallRow(call) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${formatDateTime(call.timestamp)}</td>
        <td>${call.userId}</td>
        <td>${formatDuration(call.duration)}</td>
        <td>
            <span class="status-badge ${call.status}">
                ${getStatusText(call.status)}
            </span>
        </td>
        <td>
            <button class="play-button" onclick="playAudio('${call.id}', '${call.audioUrl}')">
                <i class="fas fa-play"></i>
                再生
            </button>
        </td>
    `;
    return row;
}

// WebSocket接続の設定
function setupWebSocket() {
    // 実際のWebSocket URLが利用可能になったら実装
    // wsConnection = new WebSocket('wss://teleai-pro-api.onrender.com/ws');
    
    // デモ用: 定期的にデータを更新
    setInterval(() => {
        simulateRealtimeUpdate();
    }, 5000);
}

// リアルタイム更新のシミュレーション
function simulateRealtimeUpdate() {
    // KPIの微小な変更
    const currentCalls = parseInt(document.getElementById('totalCalls').textContent.replace(/,/g, ''));
    const newCalls = currentCalls + Math.floor(Math.random() * 5);
    document.getElementById('totalCalls').textContent = formatNumber(newCalls);
    
    // 接続ステータスの更新
    updateConnectionStatus(true);
}

// 自動更新の開始
function startAutoRefresh() {
    refreshTimer = setInterval(() => {
        loadDashboardData();
    }, REFRESH_INTERVAL);
}

// 自動更新の停止
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
}

// オーディオ再生
function playAudio(callId, audioUrl) {
    const player = document.getElementById('audioPlayer');
    const title = document.getElementById('audioTitle');
    
    // デモ用: 実際のオーディオURLが利用可能になったら使用
    player.src = audioUrl || '';
    title.textContent = `通話 #${callId}`;
    
    player.play().catch(error => {
        console.error('オーディオ再生エラー:', error);
        showNotification('オーディオの再生に失敗しました', 'error');
    });
}

// エクスポートモーダルの表示
function showExportModal() {
    document.getElementById('exportModal').classList.add('show');
    document.getElementById('exportModal').setAttribute('aria-hidden', 'false');
}

// エクスポートモーダルの非表示
function hideExportModal() {
    document.getElementById('exportModal').classList.remove('show');
    document.getElementById('exportModal').setAttribute('aria-hidden', 'true');
}

// データのエクスポート
async function exportData(format) {
    try {
        const data = collectExportData();
        
        switch (format) {
            case 'csv':
                exportAsCSV(data);
                break;
            case 'json':
                exportAsJSON(data);
                break;
            case 'pdf':
                exportAsPDF(data);
                break;
        }
        
        hideExportModal();
        showNotification(`${format.toUpperCase()}形式でエクスポートしました`, 'success');
        
    } catch (error) {
        console.error('エクスポートエラー:', error);
        showNotification('エクスポートに失敗しました', 'error');
    }
}

// エクスポート用データの収集
function collectExportData() {
    return {
        timestamp: new Date().toISOString(),
        kpis: {
            totalCalls: document.getElementById('totalCalls').textContent,
            avgDuration: document.getElementById('avgDuration').textContent,
            activeUsers: document.getElementById('activeUsers').textContent,
            satisfactionScore: document.getElementById('satisfactionScore').textContent
        },
        recentCalls: Array.from(document.querySelectorAll('#callsTableBody tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                timestamp: cells[0].textContent,
                userId: cells[1].textContent,
                duration: cells[2].textContent,
                status: cells[3].textContent.trim()
            };
        })
    };
}

// CSV形式でエクスポート
function exportAsCSV(data) {
    const csv = convertToCSV(data);
    downloadFile(csv, 'teleai-dashboard-export.csv', 'text/csv');
}

// JSON形式でエクスポート
function exportAsJSON(data) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'teleai-dashboard-export.json', 'application/json');
}

// PDF形式でエクスポート（簡易実装）
function exportAsPDF(data) {
    // 実際の実装では、jsPDFなどのライブラリを使用
    console.log('PDF export:', data);
    alert('PDF エクスポート機能は現在開発中です');
}

// ファイルのダウンロード
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// ユーティリティ関数
function formatNumber(num) {
    return num.toLocaleString('ja-JP');
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statusMap = {
        'completed': '完了',
        'in-progress': '進行中',
        'failed': '失敗'
    };
    return statusMap[status] || status;
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('ja-JP');
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    const indicator = statusElement.querySelector('.status-indicator');
    
    if (connected) {
        indicator.style.color = 'var(--success-color)';
        statusElement.innerHTML = '<i class="fas fa-circle status-indicator"></i> 接続中';
    } else {
        indicator.style.color = 'var(--danger-color)';
        statusElement.innerHTML = '<i class="fas fa-circle status-indicator"></i> 切断';
    }
}

// 通知の表示
function showNotification(message, type = 'info') {
    // 実際の実装では、より洗練された通知システムを使用
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// モックデータ生成関数
function generateMockData() {
    return {
        kpis: {
            totalCalls: 15234,
            avgDuration: 245,
            activeUsers: 3421,
            satisfactionScore: 4.7
        },
        recentCalls: generateMockCalls(10),
        chartData: {
            calls: generateRandomData(24, 50, 200),
            users: [30, 50, 20]
        }
    };
}

function generateMockCalls(count) {
    const statuses = ['completed', 'in-progress', 'failed'];
    const calls = [];
    
    for (let i = 0; i < count; i++) {
        calls.push({
            id: `CALL-${1000 + i}`,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            userId: `USER-${Math.floor(Math.random() * 1000)}`,
            duration: Math.floor(Math.random() * 600) + 30,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            audioUrl: ''
        });
    }
    
    return calls;
}

function generateTimeLabels() {
    const labels = [];
    for (let i = 23; i >= 0; i--) {
        labels.push(`${i}:00`);
    }
    return labels.reverse();
}

function generateRandomData(count, min, max) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
}

// CSVへの変換
function convertToCSV(data) {
    const headers = ['タイムスタンプ', 'ユーザーID', '通話時間', 'ステータス'];
    const rows = data.recentCalls.map(call => [
        call.timestamp,
        call.userId,
        call.duration,
        call.status
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
}

// チャートの更新
function updateCharts(chartData) {
    if (callsChart && chartData.calls) {
        callsChart.data.datasets[0].data = chartData.calls;
        callsChart.update();
    }
    
    if (usersChart && chartData.users) {
        usersChart.data.datasets[0].data = chartData.users;
        usersChart.update();
    }
}

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
    if (wsConnection) {
        wsConnection.close();
    }
});