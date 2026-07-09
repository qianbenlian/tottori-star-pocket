// Tottori Star Pocket - メイン処理
// 3D プラネタリウムのメイン制御

let scene, camera, renderer;
let starsGroup;
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };

// 鳥取砂丘の座標
const TOTTORI_LATITUDE = 35.5307;
const TOTTORI_LONGITUDE = 134.1734;

function init() {
    // Canvas コンテナを取得
    const container = document.getElementById('canvas-container');

    // シーン作成
    scene = new THREE.Scene();

    // カメラ設定（視野角を広くして全天球を見られるように）
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 0, 0);

    // レンダラー設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);

    // 星のグループを作成
    starsGroup = new THREE.Group();
    scene.add(starsGroup);

    // 星データを読み込み
    loadStars();

    // イベントリスナー
    window.addEventListener('resize', onWindowResize, false);

    // 時間更新
    updateTime();
    setInterval(updateTime, 1000);

    // アニメーションループ開始
    animate();
}

function loadStars() {
    // サンプル星データ（Hipparcos Catalogから抽出した明るい星）
    const starsData = [
        // 形式: { ra, dec, magnitude, name }
        // RA（赤経）: 0-360度、Dec（赤緯）: -90～90度、magnitude（等級）: 小さいほど明るい
        { ra: 0, dec: 29, mag: 2.0, name: 'Sheratan' },
        { ra: 24.4, dec: 88.3, mag: 2.0, name: 'Polaris' },
        { ra: 37.95, dec: 89.26, mag: 2.0, name: 'Polaris Australis' },
        { ra: 60.7, dec: -62.6, mag: 0.5, name: 'Achernar' },
        { ra: 85.3, dec: -69.7, mag: 0.6, name: 'Canopus' },
        { ra: 88.8, dec: 7.4, mag: 0.4, name: 'Sirius' },
        { ra: 139.8, dec: 61.4, mag: 1.3, name: 'Capella' },
        { ra: 145.4, dec: 27.1, mag: 0.1, name: 'Rigel' },
        { ra: 213.9, dec: 19.2, mag: 0.1, name: 'Betelgeuse' },
        { ra: 258.6, dec: -2.9, mag: -0.7, name: 'Sirius' },
        { ra: 320.8, dec: 62.6, mag: 1.2, name: 'Deneb' },
        { ra: 305.6, dec: 40.3, mag: 1.3, name: 'Vega' },
    ];

    // 拡張星データを生成（ランダムな星をもっと追加）
    const extendedStars = [...starsData];
    for (let i = 0; i < 300; i++) {
        extendedStars.push({
            ra: Math.random() * 360,
            dec: (Math.random() - 0.5) * 180,
            mag: 2 + Math.random() * 4, // 等級 2-6
            name: `Star ${i}`
        });
    }

    // 星を作成
    extendedStars.forEach(star => {
        const star3D = createStar(star);
        starsGroup.add(star3D);
    });

    // 銀河の背景グラデーションを追加
    addGalaxyBackground();
}

function createStar(star) {
    // 赤経・赤緯を3D座標に変換
    const raRad = THREE.MathUtils.degToRad(star.ra);
    const decRad = THREE.MathUtils.degToRad(star.dec);
    
    const radius = 100; // 星の球体までの距離
    const x = radius * Math.cos(decRad) * Math.cos(raRad);
    const y = radius * Math.sin(decRad);
    const z = radius * Math.cos(decRad) * Math.sin(raRad);

    // 等級から明るさと大きさを計算
    const brightness = Math.pow(10, -star.mag / 2.5); // 等級から相対的な明るさ
    const size = 0.1 + brightness * 0.5;

    // ジオメトリとマテリアル
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.15, 0.5, brightness),
    });

    const starMesh = new THREE.Mesh(geometry, material);
    starMesh.position.set(x, y, z);
    starMesh.userData = { name: star.name };

    return starMesh;
}

function addGalaxyBackground() {
    // 星空の背景を作成（テクスチャまたはカラーグラデーション）
    const geometry = new THREE.SphereGeometry(200, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x000a15,
        side: THREE.BackSide
    });
    const background = new THREE.Mesh(geometry, material);
    scene.add(background);
}

function updateStarOrientation() {
    // デバイスの向きから回転行列を計算
    const alpha = THREE.MathUtils.degToRad(deviceOrientation.alpha);
    const beta = THREE.MathUtils.degToRad(deviceOrientation.beta);
    const gamma = THREE.MathUtils.degToRad(deviceOrientation.gamma);

    // オイラー角で回転
    starsGroup.rotation.order = 'YXZ';
    starsGroup.rotation.y = alpha;
    starsGroup.rotation.x = beta;
    starsGroup.rotation.z = gamma;
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP');
    document.getElementById('time').textContent = timeString;
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);

    // 星の向きを更新
    updateStarOrientation();

    // レンダリング
    renderer.render(scene, camera);
}

// ページロード時に初期化
window.addEventListener('load', init);