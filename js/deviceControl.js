// Tottori Star Pocket - デバイス制御
// スマートフォン・タブレットの傾きを検出

let permissionGranted = false;

// DeviceOrientationEvent の権限リクエスト（iOS 13+）
function requestPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13 以降
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    permissionGranted = true;
                    document.getElementById('permissionRequest').style.display = 'none';
                    initDeviceOrientation();
                }
            })
            .catch(console.error);
    } else {
        // Android またはそれ以外のデバイス
        permissionGranted = true;
        document.getElementById('permissionRequest').style.display = 'none';
        initDeviceOrientation();
    }
}

function initDeviceOrientation() {
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    window.addEventListener('devicemotion', handleDeviceMotion);
}

function handleDeviceOrientation(event) {
    // alpha: Z軸周り（0-360）
    // beta: X軸周り（-180～180）
    // gamma: Y軸周り（-90～90）
    deviceOrientation.alpha = event.alpha || 0;
    deviceOrientation.beta = event.beta || 0;
    deviceOrientation.gamma = event.gamma || 0;

    // 向き情報を画面に表示
    updateOrientationDisplay();
}

function handleDeviceMotion(event) {
    // 加速度センサーなどの追加データが必要な場合はここで処理
    // 現在のところは使用していません
}

function updateOrientationDisplay() {
    const orientationText = `向き: α${Math.round(deviceOrientation.alpha)}° β${Math.round(deviceOrientation.beta)}° γ${Math.round(deviceOrientation.gamma)}°`;
    document.getElementById('orientation').textContent = orientationText;
}

// ページロード時に権限リクエストを表示（必要な場合）
window.addEventListener('load', () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ は明示的な権限が必要
        document.getElementById('permissionRequest').style.display = 'block';
    } else {
        // Android は自動的に開始
        permissionGranted = true;
        document.getElementById('permissionRequest').style.display = 'none';
        initDeviceOrientation();
    }
});