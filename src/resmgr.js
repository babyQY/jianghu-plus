/**
 * 霸气江湖 - 资源加载与管理 (内置映射版)
 * 直接嵌入文件名映射，无需fetch，兼容 file:// 协议
 */
const ResManager = (function() {
    'use strict';

    // 内置映射表 - 从 source _mapping.txt 提取
    const BUILTIN_MAP = {
        '1星':'696D616765_31E6989F.png','2星':'696D616765_32E6989F.png','4星':'696D616765_34E6989F.png',
        'bg_1':'696D616765_62675F31.png','kuang':'696D616765_6B75616E67.png','jiantou':'696D616765_6A69616E746F75.png',
        'jinyuanbao':'696D616765_6A696E7975616E62616F.png','loading':'696D616765_6C6F6164696E67.png',
        'gong':'696D616765_676F6E67.png','fang':'696D616765_66616E67.png','gang':'696D616765_67616E67.png',
        'exp':'696D616765_657870.png','dengji':'696D616765_64656E676A69.png',
        'jianghu-bg':'696D616765_6A69616E6768752D6267.png','kp-bg':'696D616765_6B702D6267.png',
        'leixing':'696D616765_6C656978696E67.png','miaoshu':'696D616765_6D69616F736875.png',
        'jishi-juese1':'696D616765_6A697368692D6A7565736531.png','jishi-juese2':'696D616765_6A697368692D6A7565736532.png',
        'jishi-juese3':'696D616765_6A697368692D6A7565736533.png',
        'anniu1-2':'696D616765_616E6E6975312D32.png','bao':'696D616765_62616F.png',
        'long':'696D616765_6C6F6E67.png','long-1':'696D616765_6C6F6E672D31.png',
        'dang':'696D616765_64616E67.png','c6':'696D616765_6336.png',
        'jianghuxiaoxia':'696D616765_6A69616E6768757869616F786961.png',
        'gonggao':'696D616765_676F6E6767616F.png',
    };

    // 动态映射（从 _mapping.txt 补充）
    let loadedImages = {};
    let readyCount = 0;
    let totalCount = 0;
    let onReadyCallback = null;
    let isReady = false;

    let effectFrames = {
        dandao: [], daoguang: [], sudu: [], xuan: [], bang: [], baodian: [], jght: [],
    };

    function getFilename(name) {
        return BUILTIN_MAP[name] || null;
    }

    function init() {
        // 使用内置映射直接加载
        totalCount = Object.keys(BUILTIN_MAP).length;
        Object.entries(BUILTIN_MAP).forEach(([name, filename]) => {
            loadImage(name, filename);
        });
        // 预加载战斗帧序列
        preloadEffectFrames();
        // file:// 下 XHR 不可用，直接依赖内置 BUILTIN_MAP
    }

    function loadImage(name, filename) {
        var img = new Image();
        img.onload = function() {
            loadedImages[name] = img;
            readyCount++;
            checkReady();
            categorizeEffect(name, img);
        };
        img.onerror = function() {
            readyCount++;
            checkReady();
        };
        img.src = 'assets/images/' + filename;
    }

    function preloadEffectFrames() {
        var effectNames = [];
        // dandao 0-6
        for (var i = 0; i < 7; i++) effectNames.push('dsbf_dandao_' + pad5(i));
        // daoguang 0-5
        for (var i = 0; i < 6; i++) effectNames.push('dsbf_daoguang_' + pad5(i));
        // sudu sequences
        ['dsbf_sudu01_', 'dsbf_sudu02_', 'dsbf_sudu03_'].forEach(function(p) {
            for (var i = 0; i < 3; i++) effectNames.push(p + pad5(i));
        });
        // xuan
        effectNames.push('dsbf_xuan_' + pad5(0));
        // bang
        effectNames.push('dsbf_bang_' + pad5(0));
        // baodian sequences
        ['dsbf_baodian01_', 'dsbf_baodian02_', 'dsbf_baodian03_'].forEach(function(p) {
            for (var i = 0; i < 10; i++) effectNames.push(p + pad5(i));
        });
        // jght 0-11
        for (var i = 0; i < 12; i++) effectNames.push('jght_' + pad5(i));

        // Try loading each from _mapping (if available) or just try direct filenames
        effectNames.forEach(function(name) {
            var filename = getFilename(name);
            if (filename) {
                var img = new Image();
                img.onload = function() {
                    loadedImages[name] = img;
                    categorizeEffect(name, img);
                };
                img.onerror = function() {};
                img.src = 'assets/images/' + filename;
            }
        });
    }

    function pad5(n) { return ('00000' + n).slice(-5); }

    function categorizeEffect(name, img) {
        if (name.indexOf('dandao') >= 0) effectFrames.dandao.push(img);
        else if (name.indexOf('daoguang') >= 0) effectFrames.daoguang.push(img);
        else if (name.indexOf('sudu') >= 0) effectFrames.sudu.push(img);
        else if (name.indexOf('xuan') >= 0) effectFrames.xuan.push(img);
        else if (name.indexOf('bang') >= 0) effectFrames.bang.push(img);
        else if (name.indexOf('baodian') >= 0) effectFrames.baodian.push(img);
        else if (name.indexOf('jght') >= 0) effectFrames.jght.push(img);
    }

    function checkReady() {
        if (readyCount >= totalCount && !isReady) {
            isReady = true;
            if (onReadyCallback) onReadyCallback();
        }
    }

    function getImage(name) { return loadedImages[name] || null; }
    function hasImage(name) { return !!loadedImages[name]; }

    function drawImage(ctx, name, x, y, w, h, alpha) {
        var img = getImage(name);
        if (img) {
            ctx.save();
            if (alpha !== undefined) ctx.globalAlpha = alpha;
            ctx.drawImage(img, x, y, w || img.width, h || img.height);
            ctx.restore();
            return true;
        }
        return false;
    }

    function drawImageCentered(ctx, name, cx, cy, w, h, alpha) {
        var img = getImage(name);
        if (img) {
            ctx.save();
            if (alpha !== undefined) ctx.globalAlpha = alpha;
            var dw = w || img.width, dh = h || img.height;
            ctx.drawImage(img, cx - dw/2, cy - dh/2, dw, dh);
            ctx.restore();
            return true;
        }
        return false;
    }

    function getEffectFrame(category, index) {
        var frames = effectFrames[category];
        return (frames && frames.length > 0) ? frames[index % frames.length] : null;
    }

    function getEffectFrames(category) { return effectFrames[category] || []; }

    function onReady(cb) {
        onReadyCallback = cb;
        if (isReady) cb();
    }

    function getProgress() { return totalCount > 0 ? readyCount / totalCount : 0; }

    return {
        init, onReady, getProgress,
        getImage, hasImage, drawImage, drawImageCentered,
        getEffectFrame, getEffectFrames,
        loadedImages, effectFrames,
    };
})();
