/**
 * 霸气江湖 - 资源管理器 v2（完整映射版）
 * 1102条资源映射，图片优先渲染
 */
var ResManager = (function() {
    'use strict';

    var loadedImages = {};
    var readyCount = 0;
    var totalCount = 0;
    var nameToFile = (typeof RES_MAP !== 'undefined') ? RES_MAP : {};
    var effectFrames = { dandao:[], daoguang:[], sudu:[], xuan:[], bang:[], baodian:[], jght:[] };
    var onReadyCallback = null;
    var isReady = false;

    function init() {
        // 使用完整 RES_MAP
        var names = Object.keys(nameToFile);
        totalCount = names.length;
        // 只预加载关键资源（常用UI元素），其余的按需加载
        var keyNames = ['bg_1','kuang','jiantou','jinyuanbao','loading','gong','fang','gang','exp',
            'dengji','jianghu-bg','kp-bg','leixing','miaoshu','jishi-juese1','jishi-juese2','jishi-juese3',
            'anniu1-2','bao','long','long-1','dang','c6','jianghuxiaoxia','gonggao',
            '卡牌水墨背景','布阵背景','首页背景','首页','封面2','边框底纹','底板2','底板3','底板4',
            '黑色遮罩','白色遮罩','江湖','江湖边','标题栏','血条','血条_2','血槽1'];
        var toLoad = 0;
        for (var i = 0; i < keyNames.length; i++) {
            var fn = nameToFile[keyNames[i]];
            if (fn) { loadImage(keyNames[i], fn); toLoad++; }
        }
        // 预加载战斗特效帧
        preloadEffectFrames();
        // 设置 totalCount 为实际要加载的数量
        totalCount = toLoad + 40; // +40 for effect frames
    }

    function preloadEffectFrames() {
        var patterns = [
            { prefix:'dsbf_dandao_', count:7, cat:'dandao' },
            { prefix:'dsbf_daoguang_', count:6, cat:'daoguang' },
            { prefix:'dsbf_sudu01_', count:3, cat:'sudu' },
            { prefix:'dsbf_sudu02_', count:3, cat:'sudu' },
            { prefix:'dsbf_sudu03_', count:3, cat:'sudu' },
            { prefix:'dsbf_xuan_', count:1, cat:'xuan' },
            { prefix:'dsbf_bang_', count:1, cat:'bang' },
            { prefix:'dsbf_baodian01_', count:10, cat:'baodian' },
            { prefix:'dsbf_baodian02_', count:10, cat:'baodian' },
            { prefix:'dsbf_baodian03_', count:10, cat:'baodian' },
            { prefix:'jght_', count:12, cat:'jght' },
        ];
        for (var p = 0; p < patterns.length; p++) {
            var pat = patterns[p];
            for (var i = 0; i < pat.count; i++) {
                var name = pat.prefix + ('00000'+i).slice(-5);
                var fn = getFile(name);
                if (fn) {
                    var img = new Image();
                    img.cat = pat.cat;
                    img.onload = function() { loadedImages[this._name] = this; categorize(this.cat, this); readyCount++; checkReady(); };
                    img.onerror = function() { readyCount++; checkReady(); };
                    img._name = name;
                    img.src = 'assets/images/' + fn;
                }
            }
        }
    }

    function getFile(name) { return nameToFile[name] || null; }

    function loadImage(name, filename) {
        var img = new Image();
        img.onload = function() { loadedImages[name] = img; readyCount++; checkReady(); };
        img.onerror = function() { readyCount++; checkReady(); };
        img.src = 'assets/images/' + filename;
    }

    function getImage(name) {
        // 先查缓存
        if (loadedImages[name]) return loadedImages[name];
        // 再尝试按需加载
        var fn = nameToFile[name];
        if (fn) {
            // 标记避免重复加载
            if (!loadedImages._pending) loadedImages._pending = {};
            if (!loadedImages._pending[name]) {
                loadedImages._pending[name] = true;
                var img = new Image();
                img.onload = function() { loadedImages[name] = img; loadedImages._pending[name] = false; };
                img.onerror = function() { loadedImages._pending[name] = false; };
                img.src = 'assets/images/' + fn;
            }
        }
        return null;
    }

    function categorize(cat, img) { if (effectFrames[cat]) effectFrames[cat].push(img); }
    function checkReady() { if (readyCount >= totalCount && !isReady) { isReady = true; if (onReadyCallback) onReadyCallback(); } }

    function drawImage(ctx, name, x, y, w, h, alpha) {
        var img = getImage(name) || loadedImages[name];
        if (img) {
            ctx.save();
            if (alpha !== undefined) { ctx.globalAlpha = alpha; }
            ctx.drawImage(img, x, y, w || img.width, h || img.height);
            ctx.restore();
            return true;
        }
        return false;
    }

    function drawImageCentered(ctx, name, cx, cy, w, h, alpha) {
        var img = getImage(name) || loadedImages[name];
        if (img) {
            ctx.save();
            if (alpha !== undefined) { ctx.globalAlpha = alpha; }
            var dw = w || img.width, dh = h || img.height;
            ctx.drawImage(img, cx - dw/2, cy - dh/2, dw, dh);
            ctx.restore();
            return true;
        }
        return false;
    }

    function getEffectFrame(cat, idx) { var f = effectFrames[cat]; return (f && f.length) ? f[idx % f.length] : null; }
    function getEffectFrames(cat) { return effectFrames[cat] || []; }
    function onReady(cb) { onReadyCallback = cb; if (isReady) cb(); }
    function getProgress() { return totalCount > 0 ? Math.min(1, readyCount / totalCount) : 1; }

    return {
        init: init, onReady: onReady, getProgress: getProgress,
        getImage: getImage, drawImage: drawImage, drawImageCentered: drawImageCentered,
        getEffectFrame: getEffectFrame, getEffectFrames: getEffectFrames,
        loadedImages: loadedImages, effectFrames: effectFrames,
    };
})();
