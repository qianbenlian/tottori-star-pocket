// Tottori Star Pocket - 星データ管理
// 星カタログの管理と現在時刻の星座計算

// Hipparcos カタログから抽出した主要な星データ
const STAR_CATALOG = [
    // 北天
    { name: 'Polaris', ra: 37.9542, dec: 89.2641, mag: 2.02, color: '#fff9ff' },
    { name: 'Capella', ra: 79.1725, dec: 45.9977, mag: 0.08, color: '#fff5ff' },
    { name: 'Vega', ra: 279.2346, dec: 38.7837, mag: 0.03, color: '#ffffff' },
    { name: 'Deneb', ra: 310.3582, dec: 45.2803, mag: 1.25, color: '#fff9ff' },
    { name: 'Mizar', ra: 200.9813, dec: 54.9255, mag: 2.27, color: '#ffffff' },
    
    // 赤道
    { name: 'Sheratan', ra: 8.8897, dec: 29.0901, mag: 2.64, color: '#fff5ff' },
    { name: 'Betelgeuse', ra: 88.7929, dec: 7.4070, mag: 0.42, color: '#ffcc99' },
    { name: 'Rigel', ra: 78.6345, dec: -8.2014, mag: 0.13, color: '#ccddff' },
    { name: 'Sirius', ra: 101.2865, dec: -16.7161, mag: -1.46, color: '#ffffff' },
    { name: 'Canopus', ra: 95.9754, dec: -52.6957, mag: -0.74, color: '#ffddcc' },
    
    // 南天
    { name: 'Achernar', ra: 14.4291, dec: -57.2369, mag: 0.45, color: '#ccddff' },
    { name: 'Crux', ra: 193.6368, dec: -60.7366, mag: 1.25, color: '#ffffff' },
    { name: 'Acrux', ra: 186.6493, dec: -63.0986, mag: 0.77, color: '#ccddff' },
    
    // その他の主要星
    { name: 'Arcturus', ra: 213.9154, dec: 19.1825, mag: -0.05, color: '#ffeecc' },
    { name: 'Spica', ra: 201.2983, dec: -11.1613, mag: 0.98, color: '#ccddff' },
    { name: 'Aldebaran', ra: 68.9803, dec: 16.5034, mag: 0.85, color: '#ff9955' },
    { name: 'Antares', ra: 247.3519, dec: -26.4320, mag: 0.96, color: '#ff6600' },
    { name: 'Altair', ra: 297.6958, dec: 8.8683, mag: 0.76, color: '#ffffcc' },
    { name: 'Fomalhaut', ra: 344.4125, dec: -29.6224, mag: 1.17, color: '#ffffff' },
];

/**
 * 現在時刻の恒星時を計算
 * @returns {number} グリニッジ恒星時（度数）
 */
function calculateSiderealTime() {
    const now = new Date();
    
    // ユリウス日を計算
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    
    // ユリウス日の計算
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    // グリニッジ恒星時（UT1）を計算
    const jd0 = Math.floor(jd - 0.5) + 0.5;
    const T = (jd0 - 2451545.0) / 36525.0;
    
    // GMST（グリニッジ平均恒星時）
    const gmst = 280.46061837 + 360.98564724838 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000.0;
    
    // 正規化（0-360）
    return ((gmst % 360) + 360) % 360;
}

/**
 * 赤経・赤緯を地平座標に変換
 * @param {number} ra - 赤経（度）
 * @param {number} dec - 赤緯（度）
 * @param {number} latitude - 観測地点の緯度（度）
 * @param {number} hourAngle - 時角（度）
 * @returns {object} {altitude, azimuth}
 */
function equatorialToHorizontal(ra, dec, latitude, hourAngle) {
    const lat = THREE.MathUtils.degToRad(latitude);
    const decRad = THREE.MathUtils.degToRad(dec);
    const haRad = THREE.MathUtils.degToRad(hourAngle);
    
    // 高度
    const sinAlt = Math.sin(lat) * Math.sin(decRad) + Math.cos(lat) * Math.cos(decRad) * Math.cos(haRad);
    const altitude = Math.asin(sinAlt);
    
    // 方位角
    const cosAz = (Math.sin(decRad) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(altitude));
    const sinAz = -Math.sin(haRad) * Math.cos(decRad) / Math.cos(altitude);
    const azimuth = Math.atan2(sinAz, cosAz);
    
    return {
        altitude: THREE.MathUtils.radToDeg(altitude),
        azimuth: THREE.MathUtils.radToDeg(azimuth)
    };
}

/**
 * 星の見える高さから点の大きさを計算
 * @param {number} altitude - 高度（度）
 * @param {number} magnitude - 等級
 * @returns {number} 大きさ
 */
function calculateStarSize(altitude, magnitude) {
    // 高度が低いと見づらいので、大きくする
    const altitudeBoost = Math.max(0, altitude / 90) * 0.5;
    const brightnessSize = Math.pow(10, -magnitude / 2.5) * 0.3;
    return 0.1 + brightnessSize + altitudeBoost;
}

/**
 * 星の色を RGB に変換
 * @param {string} colorHex - 16進数カラーコード
 * @returns {THREE.Color}
 */
function parseStarColor(colorHex) {
    return new THREE.Color(colorHex);
}

// エクスポート（必要に応じて）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STAR_CATALOG,
        calculateSiderealTime,
        equatorialToHorizontal,
        calculateStarSize,
        parseStarColor
    };
}