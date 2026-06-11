/**
 * 本地化补丁 —— 在所有原版脚本之后、本地服务器之前加载
 * 职责：资源路径重写 / 音频 / 账号中心旁路 / 协议拦截
 */

// ============ 1. 强制 png（本地资源均为 png，禁用 webp 探测结果） ============
imageExt = 'png';

// ============ 2. 资源路径重写：指向本地 assets 平铺文件 ============
(function () {
    function hexFlat(p) { return hexname(p).replace(/\//g, '_'); }
    var HAVE = window.LOCAL_IMAGE_FILES || null; // 由 manifest.js 提供

    function localImage(path) {
        var f = hexFlat(path) + '.png';
        if (HAVE && !HAVE[f]) {
            // 兼容：部分资源此前按 image/ 前缀下载
            var alt = hexFlat('image/' + path) + '.png';
            if (HAVE[alt]) return 'assets/images/' + alt;
        }
        return 'assets/images/' + f;
    }

    window.getRes = function (a, b) {
        switch (a) {
            case 'frame':
            case 'group':
            case 'protocol':
                return RES[a + '/' + b];
            case 'image':
                return b ? localImage('image/' + b) : '';
            case 'mp3':
                return 'assets/audio/' + hexFlat('mp3/' + b) + '.mp3';
            default:
                return localImage((a ? a + '/' : '') + b);
        }
    };
})();

// ============ 3. 背景音乐（原版为整轨音频 + 分段播放） ============
var audioSprite = new Audio('assets/audio/music_all.mp3');
audioSprite.preload = 'auto';

// ============ 4. 账号中心旁路（单机版直接登录成功） ============
function showAccountCenter() {
    setTimeout(function () { ac_login_success('local_hero'); }, 0);
}
function hideAccountCenter() {}
var order_id = 0;
function ac_recharge(partner, user, id, pid, price, desc) {
    // 单机版：模拟支付成功
    setTimeout(function () {
        ac_recharge_success({ ret: 200, order_id: id, tid: 'local' });
    }, 0);
}

// ============ 5. 协议拦截：转发给本地伪服务器 ============
function doProtocol(a, b, c) {
    var name = GGet(a, b);
    var def = getRes('protocol', name) || { send: {} };
    var payload = {};
    for (var d in def.send) payload[d] = GGet(a, def.send[d]);
    payload.session_id = G.session_id;
    if (主窗体) payload.main_frame = 主窗体.name;
    if (弹出框) payload.pop_frame = 弹出框.name;

    setTimeout(function () {
        var resp;
        try {
            resp = LocalServer.handle(name, payload, a) || { code: 0 };
        } catch (e) {
            console.error('[LocalServer] ' + name + ' 处理失败:', e);
            resp = { code: 0 };
        }
        try {
            dataChange(a, resp);
        } catch (e2) {
            console.error('[dataChange] ' + name + ':', e2);
        }
        try { LocalServer.persist(); } catch (e3) {}
    }, 0);
}

// ============ 6. 错误日志（便于调试缺资源/缺数据） ============
window.addEventListener('error', function (e) {
    if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'AUDIO')) {
        console.warn('[资源缺失]', e.target.src ? decodeURIComponent(e.target.src) : e.target);
    }
}, true);
