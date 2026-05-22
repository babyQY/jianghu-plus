/**
 * 霸气江湖加强版 - 游戏引擎核心
 * 纯 Canvas 2D 游戏引擎
 */
const GameEngine = (function() {
    'use strict';

    // ============ 全局状态 ============
    const G = {
        // 玩家数据
        金钱: 1000,
        元宝: 100,
        等级: 1,
        经验: 0,
        体力: 50,
        体力上限: 50,
        威望: 0,
        修为: 0,

        // 队伍
        队伍上限: 3,
        队伍: [],
        人物: {},
        技能: {},
        装备: {},
        卦石: {},

        // 进度
        当前: { 区: 0, 关卡: '', 小关: '' },
        关卡进度: {},
        普通关卡进度: 0,
        精英关卡进度: 0,
        挑战关卡进度: 0,
        通天塔层数: 0,
        通天塔今日次数: 0,
        通天塔今日上限: 1,
        古墓今日进度: {},
        挑战通关: 0,
        上次登录日期: '',

        // 设置
        设置: { 音乐: true, 音效: true },

        // 邮件/兑换/充值
        邮件列表: [],
        已兑换: [],
        充值记录: [],
        每日奖励已领: '',

        // 当前页面
        currentScene: 'main',
        scenes: {},

        // 资源缓存
        resCache: {},

        // 战斗状态
        战况: null,
        站前: {},
        战斗动画: true,
    };

    // 品质颜色
    const 品质颜色 = ['#aaa', '#8BC34A', '#2196F3', '#9C27B0', '#FF9800', '#F44336'];
    const 品质名 = ['白', '绿', '蓝', '紫', '橙', '红'];

    // 装备槽位
    const 装备槽位 = ['武器', '帽子', '衣服', '鞋子', '宝物', '披风', '暗器'];

    // 人物类型
    const 人物类型 = ['外功型', '内功型', '平衡型', '防御型'];

    // 武功类型
    const 武功类型 = ['外功', '内功', '平衡', '治疗', '特殊'];

    // ============ Canvas 管理 ============
    let canvas, ctx;
    let W, H;
    let lastTime = 0;
    let running = false;

    function initCanvas() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 触控处理 - 在这里绑定因为 canvas 此时已存在
        canvas.addEventListener('click', function(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const scene = G.scenes[G.currentScene];
            if (scene && scene.onClick) {
                scene.onClick(x, y);
            }
        });

        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            const scene = G.scenes[G.currentScene];
            if (scene && scene.onTouchStart) {
                scene.onTouchStart(x, y);
            }
        });
    }

    function resizeCanvas() {
        const maxW = Math.min(window.innerWidth, 480);
        const maxH = Math.min(window.innerHeight, 854);
        W = canvas.width = maxW;
        H = canvas.height = maxH;
        canvas.style.width = maxW + 'px';
        canvas.style.height = maxH + 'px';
        canvas.style.left = ((window.innerWidth - maxW) / 2) + 'px';
        // Trigger scene resize
        if (G.scenes[G.currentScene] && G.scenes[G.currentScene].resize) {
            G.scenes[G.currentScene].resize(W, H);
        }
    }

    // ============ 游戏循环 ============
    function gameLoop(timestamp) {
        if (!running) return;
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        update(dt);
        render();

        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        const scene = G.scenes[G.currentScene];
        if (scene && scene.update) {
            scene.update(dt);
        }
    }

    function render() {
        ctx.clearRect(0, 0, W, H);
        const scene = G.scenes[G.currentScene];
        if (scene && scene.render) {
            scene.render(ctx, W, H);
        }
    }

    // ============ 场景管理 ============
    function registerScene(name, scene) {
        G.scenes[name] = scene;
    }

    function switchScene(name, ...args) {
        const oldScene = G.scenes[G.currentScene];
        if (oldScene && oldScene.onLeave) {
            oldScene.onLeave();
        }
        G.currentScene = name;
        const newScene = G.scenes[name];
        if (newScene && newScene.onEnter) {
            newScene.onEnter(...args);
        }
        resizeCanvas();
    }

    // ============ 资源加载 ============
    function getResUrl(name) {
        const hexname = computeHexname('image/' + name);
        const imgExt = 'png';
        // 优先本地缓存
        const localPath = 'assets/images/' + hexname.replace(/\//g, '_') + '.' + imgExt;
        return localPath;
        // Fallback: 原服务器
        // return 'http://res.waveear.com/jianghuplus/' + imgExt + '/' + hexname + '.' + imgExt;
    }

    function computeHexname(s) {
        const charmap = '0123456789ABCDEF';
        const a = encodeURI(s);
        let b = '';
        let c = 0;
        const d = a.length;
        while (c < d) {
            const e = a[c];
            if (e === '%') {
                b += a[c + 1];
                b += a[c + 2];
                c += 3;
            } else if (e === '/') {
                b += e;
                c += 1;
            } else {
                const ev = e.charCodeAt(0);
                b += charmap[Math.floor(ev / 16)];
                b += charmap[ev % 16];
                c += 1;
            }
        }
        return b;
    }

    function loadImage(name) {
        return new Promise((resolve, reject) => {
            if (G.resCache[name]) {
                resolve(G.resCache[name]);
                return;
            }
            const img = new Image();
            img.onload = () => {
                G.resCache[name] = img;
                resolve(img);
            };
            img.onerror = () => {
                // 尝试从原服务器加载
                const hex = computeHexname('image/' + name);
                const fallbackUrl = 'http://res.waveear.com/jianghuplus/png/' + hex + '.png';
                img.src = fallbackUrl;
            };
            img.src = getResUrl(name);
        });
    }

    function getCachedImage(name) {
        return G.resCache[name] || null;
    }

    function drawImage(ctx, name, x, y, w, h) {
        const img = getCachedImage(name);
        if (img) {
            ctx.drawImage(img, x, y, w || img.width, h || img.height);
        } else {
            // 占位渲染
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, w || 50, h || 50);
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(name, x + (w || 50) / 2, y + (h || 50) / 2);
            ctx.textAlign = 'start';
        }
    }

    // ============ 数据持久化 ============
    function saveGame() {
        const saveData = {
            金钱: G.金钱, 元宝: G.元宝, 等级: G.等级, 经验: G.经验,
            体力: G.体力, 威望: G.威望, 修为: G.修为,
            队伍上限: G.队伍上限, 队伍: G.队伍,
            人物: G.人物, 技能: G.技能, 装备: G.装备, 卦石: G.卦石,
            关卡进度: G.关卡进度, 普通关卡进度: G.普通关卡进度,
            精英关卡进度: G.精英关卡进度, 挑战关卡进度: G.挑战关卡进度,
            通天塔层数: G.通天塔层数, 通天塔今日次数: G.通天塔今日次数,
            通天塔今日上限: G.通天塔今日上限,
            古墓今日进度: G.古墓今日进度, 挑战通关: G.挑战通关,
            上次登录日期: G.上次登录日期,
            每日奖励已领: G.每日奖励已领 || '',
            邮件列表: G.邮件列表 || [],
            已兑换: G.已兑换 || [],
            充值记录: G.充值记录 || [],
            设置: G.设置,
            timestamp: Date.now()
        };
        localStorage.setItem('jianghu_plus_save', JSON.stringify(saveData));
    }

    function loadGame() {
        const saved = localStorage.getItem('jianghu_plus_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(G, {
                    金钱: data.金钱 || 0, 元宝: data.元宝 || 0,
                    等级: data.等级 || 1, 经验: data.经验 || 0,
                    体力: data.体力 || 50, 威望: data.威望 || 0,
                    修为: data.修为 || 0,
                    队伍上限: data.队伍上限 || 3, 队伍: data.队伍 || [],
                    人物: data.人物 || {}, 技能: data.技能 || {},
                    装备: data.装备 || {}, 卦石: data.卦石 || {},
                    关卡进度: data.关卡进度 || {},
                    普通关卡进度: data.普通关卡进度 || 0,
                    精英关卡进度: data.精英关卡进度 || 0,
                    挑战关卡进度: data.挑战关卡进度 || 0,
            通天塔层数: data.通天塔层数 || 0,
            通天塔今日次数: data.通天塔今日次数 || 0,
            通天塔今日上限: data.通天塔今日上限 || 1,
            古墓今日进度: data.古墓今日进度 || {},
            挑战通关: data.挑战通关 || 0,
            上次登录日期: data.上次登录日期 || '',
            每日奖励已领: data.每日奖励已领 || '',
            邮件列表: data.邮件列表 || [],
            已兑换: data.已兑换 || [],
            充值记录: data.充值记录 || [],
            设置: data.设置 || { 音乐: true, 音效: true },
                });
                // 每日重置
                const today = new Date().toDateString();
                if (G.上次登录日期 !== today) {
                    G.通天塔今日次数 = 0;
                    G.古墓今日进度 = {};
                    G.每日奖励已领 = '';
                    G.上次登录日期 = today;
                }
                return true;
            } catch (e) {
                console.error('存档加载失败:', e);
            }
        }
        return false;
    }

    // ============ 辅助函数 ============
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    // ============ 启动 ============
    function start() {
        initCanvas();
        loadGame();
        // 每日重置检查
        const today = new Date().toDateString();
        if (G.上次登录日期 !== today) {
            G.通天塔今日次数 = 0;
            G.古墓今日进度 = {};
            G.每日奖励已领 = '';
            G.上次登录日期 = today;
        }
        lastTime = performance.now();
        running = true;
        requestAnimationFrame(gameLoop);

        // 初始化资源管理器
        if (typeof ResManager !== 'undefined') {
            ResManager.onReady(() => {
                console.log('Resources loaded');
            });
        }
        // 初始化音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.init();
        }
    }

    // ============ 公开API ============
    return {
        G, 品质颜色, 品质名, 装备槽位, 人物类型, 武功类型,
        get W() { return W; },
        get H() { return H; },
        get ctx() { return ctx; },
        get canvas() { return canvas; },
        initCanvas, resizeCanvas,
        registerScene, switchScene,
        getResUrl, loadImage, getCachedImage, drawImage,
        saveGame, loadGame,
        randomInt, clamp,
        start, gameLoop
    };
})();
