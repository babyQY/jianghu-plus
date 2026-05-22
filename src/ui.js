/**
 * 霸气江湖加强版 - UI渲染系统
 * Canvas 2D 武侠风格界面
 */
const UISystem = (function() {
    'use strict';
    const G = GameEngine.G;
    const D = GameData;
    let W, H, ctx;

    // 颜色主题
    const COLORS = {
        bg: '#1a0a00',
        panel: 'rgba(30, 15, 5, 0.95)',
        panelBorder: '#8B6914',
        gold: '#FFD700',
        goldDark: '#B8860B',
        text: '#F5E6C8',
        textDim: '#8B7355',
        accent: '#FF6347',
        red: '#F44336',
        green: '#4CAF50',
        blue: '#2196F3',
        purple: '#9C27B0',
        orange: '#FF9800',
        button: 'linear-gradient(#5C3A1E, #3E2310)',
        buttonHover: 'linear-gradient(#7D5A3E, #5E4320)',
    };

    // UI状态
    let currentScreen = 'main';
    let buttons = [];
    let scrollOffset = 0;
    let animationTime = 0;
    let selectedChar = null;
    let hoveredBtn = null;
    let notification = null; // { msg, timer, color }
    let designScale = 1;
    let designOffsetX = 0;
    let designOffsetY = 0;
    const DESIGN_W = 640;
    const DESIGN_H = 960;

    function updateSize(w, h) { W = w; H = h; }
    function setCtx(c) { ctx = c; }
    function getCtx() { return ctx; }

    function syncDesignSpace() {
        const scale = Math.min(W / DESIGN_W, H / DESIGN_H);
        designScale = scale;
        designOffsetX = (W - DESIGN_W * scale) / 2;
        designOffsetY = (H - DESIGN_H * scale) / 2;
    }

    function dx(v) { return designOffsetX + v * designScale; }
    function dy(v) { return designOffsetY + v * designScale; }
    function ds(v) { return v * designScale; }
    function inDesignRect(x, y, w, h) {
        return { x: dx(x), y: dy(y), w: ds(w), h: ds(h) };
    }
    function drawFitImage(name, x, y, w, h, mode) {
        const img = ResManager.getImage(name);
        if (!img) return false;
        const box = inDesignRect(x, y, w, h);
        const rw = img.width || w || 1;
        const rh = img.height || h || 1;
        const sx = box.w / rw;
        const sy = box.h / rh;
        let dw = box.w;
        let dh = box.h;
        let ox = box.x;
        let oy = box.y;
        if (mode === 'cover') {
            const s = Math.max(sx, sy);
            dw = rw * s;
            dh = rh * s;
            ox = box.x + (box.w - dw) / 2;
            oy = box.y + (box.h - dh) / 2;
        } else if (mode === 'contain') {
            const s = Math.min(sx, sy);
            dw = rw * s;
            dh = rh * s;
            ox = box.x + (box.w - dw) / 2;
            oy = box.y + (box.h - dh) / 2;
        }
        ctx.drawImage(img, ox, oy, dw, dh);
        return true;
    }
    function drawImageFit(name, x, y, w, h) {
        return drawFitImage(name, x, y, w, h, 'contain');
    }
    function drawDesignText(text, x, y, color, size, align, bold) {
        ctx.save();
        ctx.fillStyle = color || COLORS.text;
        ctx.font = `${bold ? 'bold ' : ''}${Math.max(10, ds(size || 14))}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = align || 'start';
        ctx.fillText(text, dx(x), dy(y));
        ctx.restore();
    }
    function addDesignButton(x, y, w, h, onClick, text) {
        const box = inDesignRect(x, y, w, h);
        buttons.push({ x: box.x, y: box.y, w: box.w, h: box.h, text, onClick, id: buttons.length });
    }
    function drawDesignPanel(x, y, w, h, title) {
        const box = inDesignRect(x, y, w, h);
        drawPanel(box.x, box.y, box.w, box.h, title);
    }
    function drawDesignButton(x, y, w, h, text, color, onClick) {
        const box = inDesignRect(x, y, w, h);
        return drawButton(box.x, box.y, box.w, box.h, text, color, onClick);
    }
    function drawDesignImageButton(imageName, x, y, w, h, onClick) {
        const box = inDesignRect(x, y, w, h);
        const id = buttons.length;
        if (!drawFitImage(imageName, x, y, w, h, 'contain')) {
            drawButton(box.x, box.y, box.w, box.h, imageName, COLORS.gold, onClick);
        }
        buttons.push({ x: box.x, y: box.y, w: box.w, h: box.h, text: imageName, onClick, id });
        return id;
    }
    function drawDesignImage(name, x, y, w, h, mode) {
        return drawFitImage(name, x, y, w, h, mode || 'contain');
    }

    function framePoint(x, y) {
        return { x: 320 + x, y: 480 - y };
    }

    function framePointWithOffset(x, y, ox, oy) {
        return framePoint((ox || 0) + (x || 0), (oy || 0) + (y || 0));
    }

    function drawFrameImageNode(node) {
        return drawFrameImageNodeAt(node, 0, 0);
    }

    function drawFrameImageNodeAt(node, ox, oy) {
        const img = ResManager.getImage(node.image);
        if (!img) return false;
        const p = framePointWithOffset(node.x || 0, node.y || 0, ox, oy);
        const w = (node.w || img.width || 1) * (node.sx || 1);
        const h = (node.h || img.height || 1) * (node.sy || 1);
        return drawDesignImage(node.image, p.x - w / 2, p.y - h / 2, w, h, 'contain');
    }

    function drawFrameLabelNode(node) {
        return drawFrameLabelNodeAt(node, 0, 0);
    }

    function drawFrameLabelNodeAt(node, ox, oy) {
        const p = framePointWithOffset(node.x || 0, node.y || 0, ox, oy);
        drawDesignText(node.label || '', p.x, p.y, node.color || '#ffffff', node.fontsize || 20, 'center', !!node.bold);
    }

    function addFrameButtonNode(node, onClick) {
        return addFrameButtonNodeAt(node, 0, 0, onClick);
    }

    function addFrameButtonNodeAt(node, ox, oy, onClick) {
        const p = framePointWithOffset(node.x || 0, node.y || 0, ox, oy);
        const w = (node.w || node.width || 100) * (node.sx || 1);
        const h = (node.h || node.height || 80) * (node.sy || 1);
        addDesignButton(p.x - w / 2, p.y - h / 2, w, h, onClick, node.name);
    }

    const HOME_FRAME_IMAGES = [
        { image: '彩虹', x: -150, y: 218 },
        { image: '光照', x: 79, y: -155, sx: 2.5625, sy: 6.125 },
        { image: '文字_福地', x: -195, y: 61 },
        { image: '文字_古墓', x: -237, y: -122 },
        { image: 'tile', x: 0, y: 363 },
        { image: '文字_聚贤堂', x: 14, y: 142 },
        { image: '文字_无限塔', x: 273, y: 121 },
        { image: '文字_练功房', x: 202, y: -187 },
    ];

    const HOME_FRAME_LABELS = [
        { label: '区', x: 284, y: 360, fontsize: 20, color: '#ffffff', bold: true },
        { label: '用户中心', x: 246, y: 446, fontsize: 20, color: '#ffffff', bold: true },
    ];

    const HOME_FRAME_BUTTONS = [
        { name: '聚贤堂', scene: 'char_select', x: 12, y: 45, w: 114, h: 74, sx: 2, sy: 2 },
        { name: '福地', scene: 'fudi', x: -240, y: 26, w: 140, h: 100 },
        { name: '通天塔', scene: 'tongtian', x: 238, y: 86, w: 107, h: 121, sy: 1.4375 },
        { name: '古墓', scene: 'gumu', x: -192, y: -154, w: 114, h: 114, sy: 1.4375 },
        { name: '比武厅', scene: 'biwu', x: 173, y: -244, w: 151, h: 100, sy: 1.4375 },
        { name: '奖励', scene: 'daily_reward', x: -265, y: 274, w: 120, h: 120, sx: 0.75, sy: 0.75, normal: '首页奖励' },
        { name: '奇遇', scene: 'qiyu', x: -52, y: 274, w: 120, h: 120, sx: 0.75, sy: 0.75, normal: '奇遇' },
        { name: '商城', scene: 'shop', x: 52, y: 271, w: 120, h: 120, sx: 0.75, sy: 0.75, normal: '商城1' },
        { name: '活动', scene: 'notice', x: 153, y: 275, w: 120, h: 120, sx: 0.75, sy: 0.75, normal: '首页活动图标无字' },
        { name: '每日任务', scene: 'daily_reward', x: -156, y: 275, w: 114, h: 114, sx: 0.75, sy: 0.75, normal: '任务' },
    ];

    const TOP_FRAME_IMAGES = [
        { image: 'gonggao_6', x: 0, y: 398 },
        { image: 'gonggao', x: 0, y: 446.5 },
        { image: 'gonggao_5', x: -273, y: 447.5 },
        { image: '等级经验条', x: -197, y: 369 },
        { image: '经验条_2', x: -165, y: 355 },
        { image: '经验条_1', x: -165, y: 355.5 },
        { image: 'yinyuanbao', x: 72, y: 356 },
        { image: 'jinyuanbao', x: 72, y: 390 },
        { image: '文字_体', x: 213, y: 390 },
        { image: 'c6', x: -30, y: 391 },
    ];

    const BOTTOM_FRAME_BUTTONS = [
        { name: '首页', normal: '首页', selected: '首页2', scene: 'main', x: -263, y: -430, w: 106, h: 100 },
        { name: '阵容', normal: '阵容', selected: '阵容2', scene: 'team', x: -158, y: -430, w: 106, h: 100 },
        { name: '江湖', normal: '文字_江湖2', selected: '江湖2', scene: 'chapter_select', x: -50, y: -430, w: 106, h: 100 },
        { name: '包裹', normal: '包裹', selected: '包裹2', scene: 'bag', x: 54, y: -430, w: 106, h: 100 },
        { name: '招募', normal: '招募', selected: '招募1', scene: 'card_draw', x: 159, y: -425, w: 106, h: 100 },
        { name: '其他', normal: '其他', selected: '其他2', scene: 'more_menu', x: 262, y: -430, w: 106, h: 100 },
    ];

    function drawOriginalTopBar() {
        TOP_FRAME_IMAGES.forEach(drawFrameImageNode);
        const maxExp = Math.max(1, G.等级 * 100);
        const exp = Math.max(0, Math.min(G.经验 || 0, maxExp));
        drawFrameLabelNode({ label: String(G.等级 || 1), x: -272, y: 367, fontsize: 34, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: '帮主', x: -230, y: 390, fontsize: 24, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: String(exp), x: -172.5, y: 355.5, fontsize: 18, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: '/', x: -166.5, y: 355, fontsize: 18, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: String(maxExp), x: -143, y: 355.5, fontsize: 18, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: String(G['金钱'] || 0), x: 101.5, y: 357, fontsize: 24, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: String(G['元宝'] || 0), x: 101, y: 391, fontsize: 24, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: String(G['体力'] || 0), x: 258, y: 390.5, fontsize: 24, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: '/', x: 265, y: 391, fontsize: 24, color: '#ffffff', bold: true });
        drawFrameLabelNode({ label: String(G['体力上限'] || 0), x: 291, y: 391, fontsize: 24, color: '#ffffff', bold: true });
        addDesignButton(26, 46, 94, 72, function() { currentScreen = 'master_upgrade'; }, '帮主');
    }

    function drawOriginalPageShell(title, selectedScene, onBack) {
        syncDesignSpace();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawFitImage('bg_1', 0, 0, DESIGN_W, DESIGN_H, 'cover');
        drawOriginalTopBar();
        drawOriginalBottomNav(selectedScene || '');
        if (title) drawDesignText(title, 320, 126, COLORS.gold, 24, 'center', true);
        if (onBack) {
            drawDesignImage('地图返回按钮', 20, 220, 100, 82, 'contain');
            addDesignButton(0, 200, 150, 120, onBack, '返回');
        }
    }

    function drawOriginalBottomNav(selectedScene) {
        drawFrameImageNode({ image: 'gonggao_4', x: 0, y: -429.5 });
        BOTTOM_FRAME_BUTTONS.forEach(item => {
            const image = item.scene === selectedScene ? (item.selected || item.normal) : item.normal;
            if (!drawFrameImageNode({ image, x: item.x, y: item.y })) {
                drawFrameLabelNode({ label: item.name, x: item.x, y: item.y - 10, fontsize: 20, color: COLORS.gold, bold: true });
            }
            addFrameButtonNode(item, () => currentScreen = item.scene);
        });
    }

    // ============ 辅助渲染函数 ============
    function drawPanel(x, y, w, h, title) {
        ctx.save();
        // 背景
        ctx.fillStyle = COLORS.panel;
        roundRect(x, y, w, h, 8);
        ctx.fill();

        // 边框
        ctx.strokeStyle = COLORS.panelBorder;
        ctx.lineWidth = 2;
        roundRect(x, y, w, h, 8);
        ctx.stroke();

        // 内边框
        ctx.strokeStyle = 'rgba(139, 105, 20, 0.3)';
        ctx.lineWidth = 1;
        roundRect(x + 4, y + 4, w - 8, h - 8, 4);
        ctx.stroke();

        if (title) {
            // 标题背景
            ctx.fillStyle = 'rgba(139, 105, 20, 0.3)';
            roundRect(x, y, w, 36, [8, 8, 0, 0]);
            ctx.fill();

            ctx.fillStyle = COLORS.gold;
            ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, x + w / 2, y + 25);
            ctx.textAlign = 'start';
        }
        ctx.restore();
    }

    function drawButton(x, y, w, h, text, color, onClick) {
        const id = buttons.length;
        const isHovered = hoveredBtn === id;

        ctx.save();
        // 按钮背景
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, isHovered ? '#7D5A3E' : '#5C3A1E');
        grad.addColorStop(1, isHovered ? '#5E4320' : '#3E2310');
        ctx.fillStyle = grad;
        roundRect(x, y, w, h, 6);
        ctx.fill();

        // 边框
        ctx.strokeStyle = color || COLORS.goldDark;
        ctx.lineWidth = 1.5;
        roundRect(x, y, w, h, 6);
        ctx.stroke();

        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(x + 2, y + 2, w - 4, h / 2 - 2, [4, 4, 0, 0]);
        ctx.fill();

        // 文字
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + h / 2 + 5);
        ctx.textAlign = 'start';

        ctx.restore();

        buttons.push({ x, y, w, h, text, onClick, id });
        return id;
    }

    function drawText(text, x, y, color, size, align) {
        ctx.save();
        ctx.fillStyle = color || COLORS.text;
        ctx.font = `${size || 14}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = align || 'start';
        ctx.fillText(text, x, y);
        ctx.textAlign = 'start';
        ctx.restore();
    }

    function roundRect(x, y, w, h, r) {
        if (Array.isArray(r)) {
            ctx.beginPath();
            ctx.moveTo(x + r[0], y);
            ctx.lineTo(x + w - r[1], y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
            ctx.lineTo(x + w, y + h - r[2]);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
            ctx.lineTo(x + r[3], y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
            ctx.lineTo(x, y + r[0]);
            ctx.quadraticCurveTo(x, y, x + r[0], y);
            ctx.closePath();
        } else {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    }

    // ============ 粒子效果 ============
    let particles = [];
    function emitParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                color: color || COLORS.gold,
                size: 2 + Math.random() * 3,
            });
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function renderParticles() {
        particles.forEach(p => {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // ============ 主界面 ============
    function renderMainScreen() {
        {
        syncDesignSpace();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawFitImage('首页背景', 0, 0, DESIGN_W, DESIGN_H, 'cover');
        HOME_FRAME_IMAGES.forEach(drawFrameImageNode);
        HOME_FRAME_LABELS.forEach(drawFrameLabelNode);

        drawOriginalTopBar();

        HOME_FRAME_BUTTONS.forEach(item => {
            if (item.normal) drawFrameImageNode({ image: item.normal, x: item.x, y: item.y, sx: item.sx || 1, sy: item.sy || 1 });
            addFrameButtonNode(item, () => currentScreen = item.scene);
        });
        addDesignButton(170, 596, 300, 156, () => currentScreen = 'chapter_select', '江湖');
        drawOriginalBottomNav('main');
        return;
        }
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        // Background image
        if (!ResManager.drawImage(ctx, 'jianghu-bg', 0, 0, W, H)) {
            // Fallback pattern
            ctx.fillStyle = 'rgba(139, 105, 20, 0.05)';
            for (let i = 0; i < 5; i++) {
                const bx = (i * W / 4);
                ctx.beginPath();
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx + 40, H);
                ctx.lineTo(bx - 40, H);
                ctx.fill();
            }
        }

        // 顶部信息栏
        const topBarH = 90;
        drawPanel(5, 5, W - 10, topBarH, '');

        // 头像区域
        ctx.fillStyle = COLORS.goldDark;
        ctx.beginPath();
        ctx.arc(35, 45, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.stroke();
        drawText('侠', 23, 52, COLORS.gold, 22, 'center');

        // 点击头像去帮主升级
        buttons.push({ x: 5, y: 5, w: 70, h: 90, text: '帮主', onClick: () => { currentScreen = 'master_upgrade'; }});

        drawText(`帮主 Lv.${G.等级}`, 75, 28, COLORS.gold, 16);
        const expPercent = G.经验 / (G.等级 * 100);
        ctx.fillStyle = '#333';
        ctx.fillRect(75, 35, 150, 8);
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(75, 35, 150 * expPercent, 8);

        // 资源
        drawText(`💰${G.金钱}`, 240, 28, COLORS.gold, 13);
        drawText(`💎${G.元宝}`, 320, 28, COLORS.orange, 13);
        drawText(`⚡${G.体力}/${G.体力上限}`, 240, 52, COLORS.blue, 13);
        drawText(`⭐${G.威望}`, 320, 52, COLORS.purple, 13);
        drawText(`修${G.修为}`, 400, 52, COLORS.textDim, 12);

        // 7大模块按钮
        const modules = [
            { name: '福地', icon: '🎁', desc: '祈福·摇奖·挑战', color: COLORS.goldDark, scene: 'fudi' },
            { name: '聚贤堂', icon: '👥', desc: '弟子列表', color: COLORS.blue, scene: 'juxian' },
            { name: '通天塔', icon: '🗼', desc: '爬塔试炼', color: COLORS.purple, scene: 'tongtian' },
            { name: '古墓', icon: '⚰️', desc: '掉落武功', color: COLORS.orange, scene: 'gumu' },
            { name: '比武厅', icon: '⚔️', desc: 'PVP对战', color: COLORS.red, scene: 'biwu' },
            { name: '江湖', icon: '🏔️', desc: '闯关推图', color: COLORS.green, scene: 'jianghu' },
            { name: '奇遇', icon: '🎪', desc: '随机事件', color: COLORS.gold, scene: 'qiyu' },
        ];

        const cols = 3;
        const btnW = (W - 30) / cols;
        const btnH = 90;
        const startX = 10;
        const startY = 105;

        modules.forEach((mod, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (btnW + 5);
            const y = startY + row * (btnH + 5);

            ctx.save();
            ctx.fillStyle = 'rgba(30,15,5,0.9)';
            roundRect(x, y, btnW, btnH, 10);
            ctx.fill();
            ctx.strokeStyle = mod.color;
            ctx.lineWidth = 2;
            roundRect(x, y, btnW, btnH, 10);
            ctx.stroke();

            drawText(mod.icon, x + btnW / 2, y + 35, mod.color, 28, 'center');
            drawText(mod.name, x + btnW / 2, y + 60, COLORS.gold, 16, 'center');
            drawText(mod.desc, x + btnW / 2, y + 80, COLORS.textDim, 10, 'center');
            ctx.restore();

            buttons.push({ x, y, w: btnW, h: btnH, text: mod.name, onClick: () => onModuleClick(mod) });
        });

        // 底部功能按钮 - 两排
        var bottomBtns = [
            // 第一排
            { name:'阵容', icon:'🛡️', scene:'zhenrong' },
            { name:'包裹', icon:'🎒', scene:'bag' },
            { name:'抽卡', icon:'🎴', scene:'card_draw' },
            { name:'扫荡', icon:'⚡', scene:'sweep' },
            // 第二排
            { name:'图鉴', icon:'📚', scene:'tujian' },
            { name:'排行', icon:'🏆', scene:'rank' },
            { name:'邮件', icon:'📧', scene:'mail' },
            { name:'活动', icon:'🎪', scene:'notice' },
            // 第三排
            { name:'强化', icon:'🔧', scene:'equip_enhance' },
            { name:'技能', icon:'📖', scene:'skill_upgrade' },
            { name:'转生', icon:'🔄', scene:'rebirth' },
            { name:'更多', icon:'⋯', scene:'more_menu' },
        ];

        var bStartY = startY + 3 * (btnH + 5) + 5;
        var bBtnW = (W - 25) / 4;
        var bRowH = 42;

        bottomBtns.forEach(function(btn, i) {
            var col = i % 4;
            var row = Math.floor(i / 4);
            var x = 8 + col * (bBtnW + 3);
            var y = bStartY + row * (bRowH + 3);
            drawButton(x, y, bBtnW, bRowH, btn.icon + ' ' + btn.name, COLORS.panelBorder, function() { onBottomBtnClick(btn); });
        });
    }

    function onModuleClick(mod) {
        emitParticles(W / 2, H / 2, 30, mod.color);
        switch (mod.scene) {
            case 'jianghu': currentScreen = 'chapter_select'; break;
            case 'juxian': currentScreen = 'char_select'; break;
            case 'fudi': currentScreen = 'fudi'; break;
            case 'tongtian': currentScreen = 'tongtian'; break;
            case 'gumu': currentScreen = 'gumu'; break;
            case 'biwu': currentScreen = 'biwu'; break;
            case 'qiyu': currentScreen = 'qiyu'; break;
            case 'card_draw': currentScreen = 'card_draw'; break;
            case 'master_upgrade': currentScreen = 'master_upgrade'; break;
            default: currentScreen = 'coming_soon'; break;
        }
    }

    function onBottomBtnClick(btn) {
        switch (btn.scene) {
            case 'zhenrong': currentScreen = 'team'; break;
            case 'bag': currentScreen = 'bag'; break;
            case 'card_draw': currentScreen = 'card_draw'; break;
            case 'sweep': currentScreen = 'sweep'; break;
            case 'tujian': currentScreen = 'tujian'; break;
            case 'rank': currentScreen = 'rank'; break;
            case 'mail': currentScreen = 'mail'; break;
            case 'notice': currentScreen = 'notice'; break;
            case 'shop': currentScreen = 'shop'; break;
            case 'settings': currentScreen = 'settings'; break;
            case 'equip_enhance': currentScreen = 'equip_enhance'; break;
            case 'skill_upgrade': currentScreen = 'skill_upgrade'; break;
            case 'rebirth': currentScreen = 'rebirth'; break;
            case 'more_menu': currentScreen = 'more_menu'; break;
        }
    }

    // ============ 更多菜单 ============
    function renderMoreMenu() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '更多功能');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        var items = [
            { name:'商城', icon:'🏪', screen:'shop', color:COLORS.orange },
            { name:'充值', icon:'💎', screen:'recharge', color:COLORS.purple },
            { name:'兑换', icon:'🎁', screen:'redeem', color:COLORS.gold },
            { name:'设置', icon:'⚙️', screen:'settings', color:COLORS.textDim },
            { name:'每日奖励', icon:'📅', screen:'daily_reward', color:COLORS.green },
            { name:'帮助', icon:'❓', screen:'coming_soon', color:COLORS.blue },
        ];

        items.forEach(function(item,i) {
            var y = 110 + i * 65;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 55, 8); ctx.fill();
            ctx.strokeStyle = item.color;
            roundRect(15, y, W-30, 55, 8); ctx.stroke();
            drawText(item.icon+' '+item.name, 35, y+36, item.color, 16);
            drawButton(W-90, y+10, 65, 30, '进入', item.color, function() {
                currentScreen = item.screen;
            });
        });
    }

    // ============ 关卡选择界面 ============
    function renderChapterSelect() {
        {
        renderJianghuChapterList();
        return;
        }
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        drawPanel(5, 5, W - 10, 50, '江湖 - 选择关卡');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        const chapters = D.CHAPTERS;
        const scrollY = 100;
        const chapterH = 55;

        drawPanel(5, scrollY - 5, W - 10, H - scrollY - 5, '');

        chapters.forEach((ch, i) => {
            const y = scrollY + i * chapterH;
            if (y > H - 20) return;

            const unlocked = G.等级 >= ch.level || (G.关卡进度 && G.关卡进度[ch.id]);
            ctx.save();
            ctx.fillStyle = unlocked ? (i % 2 === 0 ? 'rgba(50,30,10,0.8)' : 'rgba(40,22,8,0.8)') : 'rgba(20,15,10,0.8)';
            ctx.fillRect(10, y, W - 20, chapterH);

            if (unlocked) {
                ctx.strokeStyle = 'rgba(139,105,20,0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(10, y, W - 20, chapterH);
            }

            drawText(`${i + 1}.`, 20, y + 25, COLORS.gold, 14);
            drawText(ch.name, 60, y + 20, unlocked ? COLORS.gold : COLORS.textDim, 16);
            drawText(ch.desc, 60, y + 40, unlocked ? COLORS.textDim : '#555', 11);
            drawText(`Lv.${ch.level}`, W - 80, y + 25, unlocked ? COLORS.blue : '#555', 13);

            if (unlocked) {
                drawButton(W - 140, y + 8, 55, 35, '进入', COLORS.gold, () => startChapter(ch));
            }

            ctx.restore();
        });
    }

    function startChapter(chapter) {
        window._jianghuChapter = chapter;
        window._jianghuStage = 0;
        currentScreen = 'jianghu_detail';
    }

    function renderJianghuChapterList() {
        syncDesignSpace();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawFitImage('bg_1', 0, 0, DESIGN_W, DESIGN_H, 'cover');
        drawFitImage('江湖关卡背景_1', 0, 126, DESIGN_W, 660, 'cover');
        drawOriginalTopBar();
        drawOriginalBottomNav('chapter_select');
        drawDesignText('江湖关卡', 320, 124, COLORS.gold, 24, 'center', true);
        drawDesignText('选择章节', 320, 150, '#ead7ad', 13, 'center', false);

        const chapters = D.CHAPTERS;
        let y = 178;
        chapters.forEach((ch, i) => {
            if (y > 742) return;
            const unlocked = (G.等级 || 0) >= ch.level || (G.关卡进度 && G.关卡进度[ch.id]);
            ctx.save();
            ctx.fillStyle = unlocked ? 'rgba(48, 31, 14, 0.82)' : 'rgba(24, 18, 12, 0.78)';
            ctx.strokeStyle = unlocked ? '#b8860b' : '#5a4630';
            ctx.lineWidth = ds(2);
            roundRect(dx(24), dy(y), ds(592), ds(76), ds(4));
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            drawDesignText(ch.name, 44, y + 27, unlocked ? COLORS.gold : COLORS.textDim, 16, 'left', true);
            drawDesignText(ch.desc || '', 44, y + 51, unlocked ? '#ead7ad' : '#666', 11, 'left', false);
            drawDesignText('Lv.' + ch.level, 530, y + 30, unlocked ? COLORS.blue : '#666', 14, 'center', true);
            if (unlocked) {
                drawDesignImage('进入挑战按钮_1', 470, y + 8, 126, 58, 'contain');
                addDesignButton(468, y + 4, 136, 66, () => { window._jianghuChapter = ch; window._jianghuStage = 0; currentScreen = 'jianghu_detail'; }, ch.name);
            }
            y += 84;
        });
    }

    function startJianghuStage(chapter, stageIndex) {
        G.体力 = Math.max(0, (G.体力 || 0) - 5);
        window._currentChapter = chapter;
        window._currentStage = stageIndex || 0;
        currentScreen = 'battle_prep';
    }

    function renderJianghuDetail() {
        const chapter = window._jianghuChapter || D.CHAPTERS[0];
        const currentStage = window._jianghuStage || 0;
        syncDesignSpace();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawFitImage('bg_1', 0, 0, DESIGN_W, DESIGN_H, 'cover');
        drawFitImage('江湖关卡背景_1', 0, 126, DESIGN_W, 660, 'cover');
        drawOriginalTopBar();
        drawOriginalBottomNav('chapter_select');
        drawDesignImage('地图返回按钮', 20, 218, 96, 84, 'contain');
        addDesignButton(0, 190, 150, 130, () => { currentScreen = 'chapter_select'; }, '返回');
        drawDesignText(chapter.name, 320, 126, COLORS.gold, 24, 'center', true);
        drawDesignText(chapter.desc || '', 320, 154, '#ead7ad', 13, 'center', false);

        const stages = Math.max(1, chapter.stages || 10);
        for (let i = 0; i < Math.min(stages, 8); i++) {
            const x = 60 + (i % 2) * 272;
            const y = 244 + Math.floor(i / 2) * 100;
            const open = i <= currentStage;
            ctx.save();
            ctx.fillStyle = open ? 'rgba(48, 31, 14, 0.82)' : 'rgba(24, 18, 12, 0.78)';
            ctx.strokeStyle = open ? '#b8860b' : '#5a4630';
            ctx.lineWidth = ds(2);
            roundRect(dx(x), dy(y), ds(252), ds(86), ds(6));
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            drawDesignText('第' + (i + 1) + '关', x + 22, y + 30, open ? COLORS.gold : COLORS.textDim, 18, 'left', true);
            drawDesignText(open ? '可挑战' : '未开启', x + 22, y + 58, open ? '#ead7ad' : '#666', 13, 'left', false);
            if (open) {
                drawDesignImage('进入挑战按钮_1', x + 142, y + 18, 96, 44, 'contain');
                addDesignButton(x + 138, y + 12, 108, 58, () => startJianghuStage(chapter, i), 'stage-' + i);
            }
        }
    }

    // ============ 战斗准备/战斗界面 ============
    function renderBattlePrep() {
        const chapter = window._currentChapter;
        if (!chapter) { currentScreen = 'chapter_select'; return; }

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        drawPanel(5, 5, W - 10, 50, `即将挑战: ${chapter.name}`);
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'chapter_select'; });

        // 显示我方阵容
        const team = getBattleTeam();
        drawText('我方阵容:', 20, 115, COLORS.gold, 14);
        team.forEach((char, i) => {
            drawText(`${char.name} HP:${char.hp} ATK:${char.atk}`, 30, 140 + i * 25, COLORS.text, 13);
        });

        // 预计敌人
        const enemyLevel = chapter.level;
        const randomNPC = D.NPCS[Math.floor(Math.random() * D.NPCS.length)];
        const enemy = BattleSystem.buildEnemy(randomNPC, enemyLevel);
        drawText('预计敌人:', 20, 115 + team.length * 25 + 20, COLORS.red, 14);
        drawText(`${enemy.name} Lv.${enemyLevel} HP:${enemy.hp}`, 30, 115 + team.length * 25 + 45, COLORS.text, 13);

        // 战斗按钮
        drawButton(W / 2 - 50, H - 100, 100, 45, '开始战斗!', COLORS.accent, () => {
            startBattle(chapter, team);
        });
    }

    function getBattleTeam() {
        const team = [];
        // 始终包含帮主
        team.push(BattleSystem.buildCharacterForBattle({
            name: '帮主', base: { hp: 300 + G.等级 * 50, atk: 30 + G.等级 * 5, def: 20 + G.等级 * 3, innerAtk: 25 + G.等级 * 4, innerDef: 18 + G.等级 * 3, spd: 10, crit: 5, dodge: 5, block: 5, combo: 3 },
            equipment: G.人物['帮主'] ? G.人物['帮主'].装备 : {}
        }));

        // 添加队伍中的角色
        G.队伍.forEach(charId => {
            const charData = G.人物[charId];
            if (charData) {
                const base = D.CHARACTERS[charId];
                if (base) {
                    team.push(BattleSystem.buildCharacterForBattle(Object.assign({}, base, { equipment: charData.装备 || {}, skills: charData.技能 || [], level: charData.等级 || 1 })));
                }
            }
        });

        return team;
    }

    function startBattle(chapter, team) {
        const enemyLevel = chapter.level;
        const numEnemies = Math.min(team.length, 3);
        const enemies = [];
        for (let i = 0; i < numEnemies; i++) {
            const npc = D.NPCS[Math.floor(Math.random() * Math.min(D.NPCS.length, 5 + Math.floor(enemyLevel / 5)))];
            enemies.push(BattleSystem.buildEnemy(npc, enemyLevel));
        }

        BattleSystem.startBattle(team, enemies, 'normal');
        currentScreen = 'battle';
        window._battlePhase = 'fighting';
        window._battleTimer = 0;
        window._battleAnim = null;
        window._battleSource = 'jianghu';
        window._battleResultPlayed = false;
    }

    function renderBattle() {
        const state = BattleSystem.getState();
        if (!state) { currentScreen = 'main'; return; }

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, W, H);

        // Battle background image
        if (!ResManager.drawImage(ctx, 'jianghu-bg', 0, 0, W, H)) {
            ctx.fillStyle = 'rgba(20,10,0,0.3)';
            ctx.fillRect(0, 0, W, H);
        }

        // Battle effect animation (attack effects)
        if (window._battleEffectTimer && window._battleEffectTimer > 0) {
            const category = window._battleEffectCat || 'dandao';
            const frames = ResManager.getEffectFrames(category);
            if (frames.length > 0) {
                const frameIdx = Math.floor((1 - window._battleEffectTimer / 0.5) * frames.length) % frames.length;
                const frame = frames[frameIdx];
                if (frame) {
                    ctx.save();
                    ctx.globalAlpha = window._battleEffectTimer;
                    ctx.drawImage(frame, 50, 100, W - 100, 200);
                    ctx.restore();
                }
            }
        }

        // Turn counter
        drawText(`第 ${state.turn} 回合`, W / 2, 25, COLORS.gold, 16, 'center');

        // Enemy side (top)
        const defY = 60;
        state.defenders.forEach((d, i) => {
            const x = 30 + i * (W - 60) / state.defenders.length;
            const alive = d.hp > 0;
            ctx.save();
            ctx.globalAlpha = alive ? 1 : 0.4;

            // Enemy card
            ctx.fillStyle = alive ? 'rgba(80,20,20,0.8)' : 'rgba(40,10,10,0.8)';
            roundRect(x, defY, 100, 80, 8);
            ctx.fill();
            ctx.strokeStyle = COLORS.red;
            roundRect(x, defY, 100, 80, 8);
            ctx.stroke();

            // 敌方头像
            if (!ResManager.drawImage(ctx, d.name, x + 30, defY + 5, 40, 40)) {
                ctx.fillStyle = '#600';
                ctx.beginPath(); ctx.arc(x + 50, defY + 25, 18, 0, Math.PI * 2); ctx.fill();
                drawText('敌', x + 50, defY + 30, '#faa', 11, 'center');
            }
            drawText(d.name, x + 50, defY + 58, COLORS.red, 10, 'center');
            // HP bar
            var hpRatio = d.hp / d.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(x + 10, defY + 66, 80, 6);
            ctx.fillStyle = hpRatio > 0.5 ? COLORS.green : hpRatio > 0.2 ? COLORS.orange : COLORS.red;
            ctx.fillRect(x + 10, defY + 66, 80 * hpRatio, 6);
            drawText(d.hp + '/' + d.maxHp, x + 50, defY + 79, '#aaa', 9, 'center');

            ctx.restore();
        });

        // Allied side (bottom)
        var atkY = H - 180;
        state.attackers.forEach(function(a, i) {
            var x = 30 + i * (W - 60) / state.attackers.length;
            var alive = a.hp > 0;
            ctx.save();
            ctx.globalAlpha = alive ? 1 : 0.4;

            ctx.fillStyle = alive ? 'rgba(20,50,20,0.8)' : 'rgba(10,25,10,0.8)';
            roundRect(x, atkY, 100, 80, 8);
            ctx.fill();
            ctx.strokeStyle = COLORS.green;
            roundRect(x, atkY, 100, 80, 8);
            ctx.stroke();

            // 我方头像
            if (!ResManager.drawImage(ctx, a.name, x + 30, atkY + 5, 40, 40)) {
                ctx.fillStyle = '#060';
                ctx.beginPath(); ctx.arc(x + 50, atkY + 25, 18, 0, Math.PI * 2); ctx.fill();
                drawText('侠', x + 50, atkY + 30, '#afa', 11, 'center');
            }
            drawText(a.name, x + 50, atkY + 58, COLORS.green, 10, 'center');
            var hpRatio = a.hp / a.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(x + 10, atkY + 66, 80, 6);
            ctx.fillStyle = hpRatio > 0.5 ? COLORS.green : hpRatio > 0.2 ? COLORS.orange : COLORS.red;
            ctx.fillRect(x + 10, atkY + 66, 80 * hpRatio, 6);
            drawText(a.hp + '/' + a.maxHp, x + 50, atkY + 79, '#aaa', 9, 'center');

            ctx.restore();
        });

        // Battle log
        const logY = defY + 100;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(5, logY, W - 10, atkY - logY - 10);
        ctx.strokeStyle = 'rgba(139,105,20,0.3)';
        ctx.strokeRect(5, logY, W - 10, atkY - logY - 10);

        const log = BattleSystem.getLog();
        const visibleLog = log.slice(-8);
        visibleLog.forEach((msg, i) => {
            drawText(msg, 15, logY + 15 + i * 18, i === visibleLog.length - 1 ? COLORS.text : COLORS.textDim, 11);
        });

        // Battle controls
        if (!state.isOver) {
            drawButton(W / 2 - 50, H - 60, 100, 40, '攻击!', COLORS.gold, () => {
                BattleSystem.executeTurn();
            });
        } else {
            const won = state.victor === 'attacker';
            // Play SFX on first frame of result
            if (!window._battleResultPlayed) {
                AudioManager.playSFX(won ? 'win' : 'lose');
                window._battleResultPlayed = true;
            }
            drawPanel(W / 2 - 100, H / 2 - 60, 200, 120, won ? '战斗胜利!' : '战斗失败...');
            drawText(won ? '🎉' : '💀', W / 2, H / 2 - 10, won ? COLORS.gold : COLORS.red, 30, 'center');
            if (won && state.rewards) {
                drawText(`金币: +${state.rewards.gold}  经验: +${state.rewards.exp}`, W / 2, H / 2 + 20, COLORS.gold, 12, 'center');
            }

            drawButton(W / 2 - 40, H / 2 + 40, 80, 35, '确定', COLORS.gold, () => {
                if (won && state.rewards) {
                    G.金钱 += state.rewards.gold;
                    G.经验 += state.rewards.exp;
                    while (G.经验 >= G.等级 * 100) {
                        G.经验 -= G.等级 * 100;
                        G.等级++;
                    }
                    const source = window._battleSource;
                    if (source === 'tongtian') {
                        G.通天塔层数 = (G.通天塔层数 || 0) + 1;
                        G.通天塔今日次数 = (G.通天塔今日次数 || 0) + 1;
                        const floor = G.通天塔层数;
                        G.金钱 += floor * 20;
                        if (floor % 3 === 0) {
                            showNotification(`通关第${floor}层! 获得魂魄奖励!`, COLORS.purple);
                        } else {
                            showNotification(`通关第${floor}层! +${floor * 20}金币`, COLORS.gold);
                        }
                    } else if (source === 'gumu') {
                        const dropRate = window._battleDropRate || 0.3;
                        if (Math.random() < dropRate) {
                            const boss = window._battleGumuBoss;
                            if (boss && boss.drops) {
                                const skillName = boss.drops[Math.floor(Math.random() * boss.drops.length)];
                                // Find skill by name
                                let skillId = null;
                                for (const [id, skill] of Object.entries(D.SKILLS)) {
                                    if (skill.name === skillName) { skillId = id; break; }
                                }
                                if (skillId) {
                                    G.技能[skillId] = G.技能[skillId] || { 数量: 0 };
                                    G.技能[skillId].数量++;
                                    showNotification(`古墓掉落: ${skillName}!`, COLORS.purple);
                                }
                            } else {
                                const skills = Object.keys(D.SKILLS).filter(k => D.SKILLS[k].quality >= 1 && D.SKILLS[k].quality <= 4);
                                const skill = skills[Math.floor(Math.random() * skills.length)];
                                G.技能[skill] = G.技能[skill] || { 数量: 0 };
                                G.技能[skill].数量++;
                                showNotification(`古墓掉落: ${D.SKILLS[skill].name}!`, COLORS.purple);
                            }
                        }
                    } else if (source === 'jianghu') {
                        const ch = window._currentChapter;
                        if (ch) {
                            G.关卡进度 = G.关卡进度 || {};
                            G.关卡进度[ch.id] = true;
                        }
                    } else {
                        const ch = window._currentChapter;
                        if (ch) {
                            G.关卡进度 = G.关卡进度 || {};
                            G.关卡进度[ch.id] = true;
                        }
                    }
                    window._battleSource = null;
                    emitParticles(W / 2, H / 2, 30, COLORS.gold);
                }
                GameEngine.saveGame();
                currentScreen = 'chapter_select';
                window._battlePhase = null;
            });
        }
    }

    // ============ 阵容管理界面 ============
    function renderTeamScreen() {
        {
        drawOriginalPageShell('', 'team');
        const teamSlots = G.队伍上限 || 3;
        G.队伍 = G.队伍 || [];
        G.人物 = G.人物 || {};
        const teamList = G.队伍;
        const charMap = G.人物;
        const slots = [
            [-210, 185], [-70, 185], [70, 185], [210, 185],
            [-210, 12], [-70, 12], [70, 12], [210, 12],
        ];
        const unlockLevels = [0, 0, 5, 11, 21, 31, 41, 51];
        slots.forEach(function(pos, i) {
            const p = framePoint(pos[0], pos[1]);
            drawDesignImage('头像凹槽', p.x - 58, p.y - 58, 116, 116, 'contain');
            const charId = teamList[i];
            if (charId) {
                const char = charMap[charId] || {};
                drawDesignText(charId.slice(0, 4), p.x, p.y + 6, COLORS.gold, 14, 'center', true);
                drawDesignText('Lv.' + (char.等级 || char.绛夌骇 || 1), p.x, p.y + 34, COLORS.blue, 12, 'center', true);
                drawDesignText('点击可下阵', p.x, p.y + 62, COLORS.textDim, 10, 'center', false);
            } else if (i < teamSlots) {
                drawDesignImage('加号', p.x - 28, p.y - 28, 56, 56, 'contain');
            } else {
                drawDesignImage('锁', p.x - 28, p.y - 28, 56, 56, 'contain');
                drawDesignText(unlockLevels[i] + '级开启', p.x, p.y + 80, '#ff0000', 22, 'center', true);
            }
            addDesignButton(p.x - 52, p.y - 52, 104, 104, function() {
                if (charId) {
                    if (selectedChar && selectedChar !== charId) {
                        const a = teamList.indexOf(selectedChar);
                        const b = teamList.indexOf(charId);
                        if (a >= 0 && b >= 0) {
                            const tmp = teamList[a];
                            teamList[a] = teamList[b];
                            teamList[b] = tmp;
                            GameEngine.saveGame();
                            showNotification('阵位已交换', COLORS.green);
                        } else {
                            selectedChar = charId;
                        }
                    } else {
                        selectedChar = charId;
                        showNotification('已选中: ' + charId, COLORS.gold);
                    }
                } else if (i < teamSlots) {
                    showNotification('请选择左侧弟子上阵', COLORS.gold);
                } else {
                    showNotification(unlockLevels[i] + '级开启', COLORS.red);
                }
            }, 'slot-' + i);
        });
        drawFrameLabelNode({ label: '点击弟子头像可查看其详细信息。', x: 0.5, y: 260, fontsize: 24, color: '#000000' });
        drawFrameImageNode({ image: '调序按钮_1', x: -149.5, y: -179 });
        drawFrameImageNode({ image: '布阵按钮2_1', x: 149.5, y: -179 });
        addFrameButtonNode({ name: '调序', x: -149.5, y: -179, w: 150, h: 80 }, function() { showNotification('调序', COLORS.gold); });
        addFrameButtonNode({ name: '布阵', x: 149.5, y: -179, w: 150, h: 80 }, function() { showNotification('布阵已保存', COLORS.green); GameEngine.saveGame(); });
        drawDesignImage('gonggao_3', 0, 710, 640, 84, 'cover');
        drawDesignText(`上阵 ${teamList.length}/${teamSlots}`, 320, 675, COLORS.gold, 20, 'center', true);
        Object.keys(charMap).slice(0, 4).forEach((charId, i) => {
            const x = 34 + i * 150;
            drawDesignPanel(x, 718, 126, 50, '');
            drawDesignText(charId.slice(0, 4), x + 48, 748, COLORS.text, 14, 'center', true);
            addDesignButton(x, 718, 126, 50, function() {
                if (teamList.includes(charId)) {
                    teamList.splice(teamList.indexOf(charId), 1);
                    showNotification('已下阵', COLORS.green);
                } else if (teamList.length < teamSlots) {
                    teamList.push(charId);
                    showNotification('已上阵', COLORS.green);
                } else {
                    showNotification('上阵位已满', COLORS.red);
                }
                GameEngine.saveGame();
            }, 'char-' + i);
        });
        return;
        }
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        drawPanel(5, 5, W - 10, 50, '阵容管理');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        const teamSlots = G.队伍上限;
        drawText(`上阵位: ${G.队伍.length}/${teamSlots}`, W / 2, 90, COLORS.gold, 14, 'center');

        // 显示队伍
        const teamY = 105;
        drawPanel(10, teamY, W - 20, teamSlots * 70 + 20, '当前队伍');

        for (let i = 0; i < teamSlots; i++) {
            const y = teamY + 30 + i * 70;
            const charId = G.队伍[i];
            if (charId) {
                const char = G.人物[charId];
                const base = D.CHARACTERS[charId];
                ctx.fillStyle = i % 2 === 0 ? 'rgba(50,30,10,0.5)' : 'rgba(40,22,8,0.5)';
                roundRect(20, y, W - 40, 60, 8);
                ctx.fill();

                drawText(charId, 35, y + 20, COLORS.gold, 16);
                if (base) drawText(base.type || '', 35, y + 40, COLORS.textDim, 11);
                drawText(`Lv.${char.等级 || 1}`, W - 120, y + 20, COLORS.blue, 13);
            } else {
                ctx.fillStyle = 'rgba(30,20,10,0.5)';
                ctx.strokeStyle = 'rgba(139,105,20,0.3)';
                roundRect(20, y, W - 40, 60, 8);
                ctx.fill();
                ctx.stroke();
                drawText('空位', W / 2, y + 35, COLORS.textDim, 14, 'center');
            }
        }

        // 角色列表
        drawText('已有弟子:', 20, teamY + teamSlots * 70 + 40, COLORS.gold, 13);
        const charKeys = Object.keys(G.人物);
        let charY = teamY + teamSlots * 70 + 60;
        charKeys.forEach(charId => {
            if (charY + 40 > H - 20) return;
            const char = G.人物[charId];
            const inTeam = G.队伍.includes(charId);
            ctx.fillStyle = inTeam ? 'rgba(50,80,50,0.4)' : 'rgba(30,20,10,0.5)';
            roundRect(20, charY, W - 40, 35, 6);
            ctx.fill();
            drawText(`${charId} ${inTeam ? '(已上阵)' : ''}`, 35, charY + 24, COLORS.text, 13);
            if (!inTeam && G.队伍.length < G.队伍上限) {
                drawButton(W - 100, charY + 3, 70, 28, '上阵', COLORS.green, () => {
                    G.队伍.push(charId);
                    GameEngine.saveGame();
                });
            }
            charY += 42;
        });
    }

    // ============ 包裹界面 ============
    function renderBagScreen() {
        {
        drawOriginalPageShell('', 'bag');
        const bagItems = [
            { label: '装备', image: '装备背景', fallback: '侠士袍图标', x: -200, y: 80 },
            { label: '武功', image: '武功按钮_1', fallback: '推荐武功', x: 0, y: 80 },
            { label: '魂魄', image: '魂魄按钮1_2', fallback: '魂魄兑换字', x: 200, y: 80 },
            { label: '道具', image: '道具按钮_1', fallback: '体力丹图标', x: -200, y: -100 },
            { label: '卦石', image: '卦石按钮1', fallback: '卦石系统_罗盘', x: 0, y: -100 },
            { label: '材料', image: '材料页签_1', fallback: '橙色材料包图标', x: 200, y: -100 },
        ];
        bagItems.forEach(function(item) {
            const p = framePoint(item.x, item.y);
            const ok = drawDesignImage(item.image, p.x - 74, p.y - 74, 148, 148, 'contain') ||
                drawDesignImage(item.fallback, p.x - 54, p.y - 54, 108, 108, 'contain');
            if (!ok) {
                drawDesignPanel(p.x - 68, p.y - 68, 136, 136, '');
            }
            drawDesignText(item.label, p.x, p.y + 72, '#4f0000', 24, 'center', true);
            addDesignButton(p.x - 68, p.y - 68, 136, 136, function() {
                showNotification(item.label, COLORS.gold);
            }, item.label);
        });
        return;
        }
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        drawPanel(5, 5, W - 10, 50, '包裹');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        // Tabs
        const tabs = ['装备', '技能', '魂魄', '道具'];
        const tabW = (W - 30) / 4;
        let itemY = 65;

        for (let i = 0; i < tabs.length; i++) {
            drawButton(8 + i * tabW, itemY, tabW - 3, 30, tabs[i], COLORS.goldDark);
        }

        itemY = 105;
        const items = Object.keys(G.装备).length + Object.keys(G.技能).length + 1;
        drawText(`共有 ${items} 件物品`, 20, itemY, COLORS.textDim, 12);

        // Show equipment
        let y = itemY + 20;
        const equipKeys = Object.keys(G.装备);
        equipKeys.forEach(id => {
            if (y + 35 > H - 20) return;
            const equip = G.装备[id];
            const equipData = D.EQUIPMENT[id];
            ctx.fillStyle = 'rgba(30,20,10,0.5)';
            roundRect(20, y, W - 40, 30, 6);
            ctx.fill();
            const name = equipData ? equipData.name : id;
            const qColor = equipData ? D.QUALITY.getColor(equipData.quality || 0) : '#aaa';
            drawText(name, 35, y + 22, qColor, 13);
            drawText(`x${equip.数量 || 1}`, W - 60, y + 22, COLORS.textDim, 12);
            y += 36;
        });

        // Show skills
        const skillKeys = Object.keys(G.技能).slice(0, 10);
        skillKeys.forEach(id => {
            if (y + 35 > H - 20) return;
            const skill = G.技能[id];
            const skillData = D.SKILLS[id];
            ctx.fillStyle = 'rgba(30,20,10,0.5)';
            roundRect(20, y, W - 40, 30, 6);
            ctx.fill();
            const name = skillData ? skillData.name : id;
            const qColor = skillData ? D.QUALITY.getColor(skillData.quality || 0) : '#aaa';
            drawText(name, 35, y + 22, qColor, 13);
            drawText(`x${skill.数量 || 1}`, W - 60, y + 22, COLORS.textDim, 12);
            y += 36;
        });
    }

    // ============ 商城界面 ============
    function renderShopScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        drawPanel(5, 5, W - 10, 50, '商城');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText(`元宝: ${G.元宝}`, W - 100, 40, COLORS.orange, 13);

        const items = D.SHOP_ITEMS;
        items.forEach((item, i) => {
            const y = 105 + i * 65;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 55, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(139,105,20,0.4)';
            roundRect(15, y, W - 30, 55, 8);
            ctx.stroke();

            drawText(item.name, 30, y + 22, COLORS.gold, 15);
            drawText(item.desc, 30, y + 42, COLORS.textDim, 11);
            const SHOP_ITEMS = [
        { name: '体力丹', desc: '恢复50点体力', cost: 20, type: '道具', currency: '元宝' },
        { name: '招募令', desc: '随机招募一名弟子', cost: 100, type: '道具', currency: '元宝' },
        { name: '橙装碎片袋', desc: '随机橙色装备碎片', cost: 200, type: '道具', currency: '元宝' },
        { name: '经验圣水', desc: '增加1000经验', cost: 50, type: '道具', currency: '元宝' },
    ];

    const canBuy = G.元宝 >= item.cost;
            drawButton(W - 90, y + 10, 70, 35, `💎${item.cost}`, canBuy ? COLORS.orange : '#555', canBuy ? () => {
                if (G.元宝 >= item.cost) {
                    G.元宝 -= item.cost;
                    if (item.name === '体力丹') G.体力 = Math.min(G.体力 + 50, G.体力上限);
                    if (item.name === '经验圣水') {
                        G.经验 += 1000;
                        while (G.经验 >= G.等级 * 100) { G.经验 -= G.等级 * 100; G.等级++; }
                    }
                    if (item.name === '招募令') {
                        const chars = Object.keys(D.CHARACTERS).filter(c => c !== '帮主' && !G.人物[c]);
                        if (chars.length > 0) {
                            const newChar = chars[Math.floor(Math.random() * chars.length)];
                            G.人物[newChar] = { 等级: 1, 技能: [], 装备: {}, 数量: 1 };
                            showNotification(`招募到: ${newChar}!`, COLORS.gold);
                        } else {
                            showNotification('所有角色已招募!', COLORS.textDim);
                        }
                    }
                    GameEngine.saveGame();
                }
            } : null);
        });
    }

    // ============ 设置界面 ============
    function renderSettingsScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        drawPanel(5, 5, W - 10, 50, '设置');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText(`音乐: ${G.设置.音乐 ? '开' : '关'}`, 30, 120, COLORS.text, 16);
        drawButton(W - 100, 105, 70, 35, G.设置.音乐 ? '关闭' : '开启', COLORS.blue, () => {
            G.设置.音乐 = !G.设置.音乐;
            GameEngine.saveGame();
        });

        drawText(`音效: ${G.设置.音效 ? '开' : '关'}`, 30, 180, COLORS.text, 16);
        drawButton(W - 100, 165, 70, 35, G.设置.音效 ? '关闭' : '开启', COLORS.blue, () => {
            G.设置.音效 = !G.设置.音效;
            GameEngine.saveGame();
        });

        drawButton(W / 2 - 60, 240, 120, 45, '保存进度', COLORS.gold, () => {
            GameEngine.saveGame();
            drawText('已保存!', W / 2, 310, COLORS.green, 14, 'center');
        });

        drawButton(W / 2 - 60, 300, 120, 45, '重置进度', COLORS.red, () => {
            if (confirm('确定要重置所有游戏进度吗？')) {
                localStorage.removeItem('jianghu_plus_save');
                location.reload();
            }
        });

        // New game with demo data
        drawButton(W / 2 - 60, 360, 120, 45, '新游戏(带初始数据)', COLORS.green, () => {
            initializeDemoData();
            GameEngine.saveGame();
            location.reload();
        });
    }

    function initializeDemoData() {
        // Clear
        G.队伍 = [];
        G.人物 = {};
        G.技能 = {};
        G.装备 = {};
        G.关卡进度 = {};

        // Add starter characters with equipment
        const starters = [
            { id: '黄灵蓉', skills: ['紫霞功', '分筋错骨手'], equip: { '武器': '白虹剑', '衣服': '侠士袍' } },
            { id: '郭大傻', skills: ['铁砂掌'], equip: { '武器': '铁剑', '衣服': '布衣' } },
            { id: '独孤冲', skills: ['追魂剑法', '空灵拳'], equip: { '武器': '珊瑚金杖', '帽子': '侠士巾' } },
            { id: '小宝', skills: ['分筋错骨手'], equip: { '帽子': '斗笠' } },
            { id: '风剑仙', skills: ['霹雳剑法', '万剑诀'], equip: { '武器': '倚天剑' } },
            { id: '东方无敌', skills: ['向日神功', '焚心掌'], equip: { '衣服': '游凰铠' } },
        ];

        starters.forEach((s, i) => {
            G.人物[s.id] = {
                等级: Math.floor(Math.random() * 5) + 1,
                技能: s.skills,
                装备: s.equip,
                数量: 1,
            };
            if (i < 3) G.队伍.push(s.id);
        });

        // Add skills to inventory
        const extraSkills = ['紫霞功', '铁砂掌', '追魂剑法', '分筋错骨手', '纯阳无极功', '三花聚顶',
            '烈焰刀', '狮子吼', '峨眉心法', '金钟罩', '般若心经', '美女心法', '毒龙鞭法'];
        extraSkills.forEach(s => {
            G.技能[s] = { 数量: Math.floor(Math.random() * 3) + 1 };
        });

        // Add equipment to inventory
        const extraEquip = ['铁剑', '白虹剑', '侠士巾', '侠士袍', '珊瑚金杖', '斗笠', '布衣',
            '游凰铠', '太和宝靴', '百战披风', '乾坤玉冠', '燕国玉玺', '屠龙刀'];
        extraEquip.forEach(e => {
            G.装备[e] = { 数量: Math.floor(Math.random() * 2) + 1 };
        });

        G.金钱 = 2000;
        G.元宝 = 100;
        G.等级 = 5;
        G.经验 = 200;
        G.体力 = G.体力上限;
        G.队伍上限 = 5;
        G.修为 = 500;
        G.通天塔层数 = 1;
        G.通天塔今日次数 = 0;
        G.通天塔今日上限 = 1;
    }

    // ============ 福地界面 ============
    function renderFudiScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '福地');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        // 祈福按钮
        const btnW = (W - 30);
        drawButton(15, 110, btnW, 60, '🙏 祈福 - 消耗10元宝获取随机奖励', COLORS.gold, () => {
            if (G.元宝 >= 10) {
                G.元宝 -= 10;
                const rewards = ['金钱', '经验', '装备', '技能'];
                const reward = rewards[Math.floor(Math.random() * rewards.length)];
                let msg = '';
                switch(reward) {
                    case '金钱': G.金钱 += Math.floor(Math.random() * 500 + 100); msg = `获得${G.金钱}金币`; break;
                    case '经验': G.经验 += Math.floor(Math.random() * 300 + 50); msg = '获得经验'; break;
                    case '装备': msg = '获得随机装备碎片'; break;
                    case '技能': msg = '获得随机技能书'; break;
                }
                emitParticles(W/2, 140, 30, COLORS.gold);
                GameEngine.saveGame();
            }
        });

        // 摇奖按钮
        drawButton(15, 185, btnW, 60, '🎰 摇奖 - 消耗20元宝获取大量金币', COLORS.orange, () => {
            if (G.元宝 >= 20) {
                G.元宝 -= 20;
                const gold = Math.floor(Math.random() * 2000 + 500);
                G.金钱 += gold;
                emitParticles(W/2, 215, 40, COLORS.gold);
                GameEngine.saveGame();
            }
        });

        // 挑战关卡按钮
        drawButton(15, 260, btnW, 60, '⚔️ 挑战关卡 - 消耗5体力获取经验和金币', COLORS.green, () => {
            if (G.体力 >= 5) {
                G.体力 -= 5;
                G.金钱 += Math.floor(Math.random() * 200 + 50);
                G.经验 += Math.floor(Math.random() * 100 + 30);
                while (G.经验 >= G.等级 * 100) {
                    G.经验 -= G.等级 * 100;
                    G.等级++;
                }
                emitParticles(W/2, 290, 25, COLORS.green);
                GameEngine.saveGame();
            }
        });

        drawText(`元宝: ${G.元宝} | 体力: ${G.体力}`, W/2, 360, COLORS.text, 14, 'center');
    }

    // ============ 比武界面 ============
    function renderBiwuScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '比武厅');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        // Generate AI opponents
        if (!window._biwuOpponents) {
            window._biwuOpponents = [];
            for (let i = 0; i < 5; i++) {
                const enemyLvl = Math.max(1, G.等级 + Math.floor(Math.random() * 6) - 3);
                window._biwuOpponents.push({
                    name: `武者${['甲','乙','丙','丁','戊'][i]}`,
                    level: enemyLvl,
                    power: enemyLvl * 50 + Math.floor(Math.random() * 100),
                });
            }
        }

        const opponents = window._biwuOpponents;
        opponents.forEach((opp, i) => {
            const y = 105 + i * 65;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 55, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(139,105,20,0.4)';
            roundRect(15, y, W - 30, 55, 8);
            ctx.stroke();

            drawText(opp.name, 30, y + 22, COLORS.gold, 16);
            drawText(`Lv.${opp.level}  战力: ${opp.power}`, 30, y + 42, COLORS.textDim, 12);
            drawButton(W - 90, y + 10, 70, 35, '挑战', COLORS.accent, () => {
                startBiwuBattle(opp);
            });
        });

        drawButton(W/2 - 60, 105 + opponents.length * 65 + 15, 120, 40, '刷新对手', COLORS.blue, () => {
            window._biwuOpponents = null;
            currentScreen = 'biwu';
        });
    }

    function startBiwuBattle(opp) {
        const team = getBattleTeam();
        const enemies = [];
        const numEnemies = Math.min(team.length, 3);
        for (let i = 0; i < numEnemies; i++) {
            const npcIdx = Math.floor(Math.random() * Math.min(D.NPCS.length, 5));
            enemies.push(BattleSystem.buildEnemy(D.NPCS[npcIdx], opp.level));
        }

        BattleSystem.startBattle(team, enemies, 'pvp');
        currentScreen = 'battle';
        window._battlePhase = 'fighting';
        window._battleTimer = 0;
        window._battleResultPlayed = false;
    }

    // ============ 装备管理界面 ============
    function renderEquipScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, `装备管理 - ${selectedChar || ''}`);
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'team'; });

        if (!selectedChar || !G.人物[selectedChar]) {
            currentScreen = 'team';
            return;
        }

        const charData = G.人物[selectedChar];
        charData.装备 = charData.装备 || {};

        const slots = D.EQUIP_SLOTS;
        const slotH = 55;
        const startY = 105;

        slots.forEach((slot, i) => {
            const y = startY + i * (slotH + 5);
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, slotH, 6);
            ctx.fill();
            ctx.strokeStyle = 'rgba(139,105,20,0.3)';
            roundRect(15, y, W - 30, slotH, 6);
            ctx.stroke();

            drawText(slot, 30, y + 22, COLORS.gold, 14);

            const equipId = charData.装备[slot];
            if (equipId) {
                const equipData = D.EQUIPMENT[equipId];
                const eqName = equipData ? equipData.name : equipId;
                const qColor = equipData ? D.QUALITY.getColor(equipData.quality || 0) : '#aaa';
                drawText(eqName, 120, y + 22, qColor, 13);
                drawButton(W - 100, y + 10, 70, 30, '卸下', COLORS.red, () => {
                    if (G.装备[equipId]) G.装备[equipId].数量 = (G.装备[equipId].数量 || 0) + 1;
                    else G.装备[equipId] = { 数量: 1 };
                    delete charData.装备[slot];
                    GameEngine.saveGame();
                });
            } else {
                drawText('未装备', 120, y + 22, COLORS.textDim, 12);
            }
        });

        // Available equipment list
        const availableY = startY + slots.length * (slotH + 5) + 10;
        drawText('可用装备:', 20, availableY, COLORS.gold, 12);

        const availEquip = Object.keys(G.装备).filter(id => (G.装备[id].数量 || 0) > 0);
        let ey = availableY + 25;
        availEquip.forEach(equipId => {
            if (ey + 30 > H - 20) return;
            const equipData = D.EQUIPMENT[equipId];
            if (!equipData) return;

            const qColor = D.QUALITY.getColor(equipData.quality || 0);
            ctx.fillStyle = 'rgba(30,20,10,0.5)';
            roundRect(20, ey, W - 40, 28, 5);
            ctx.fill();
            drawText(`${equipData.name} (${equipData.slot}) x${G.装备[equipId].数量}`, 35, ey + 20, qColor, 12);
            drawButton(W - 75, ey + 2, 55, 24, '装备', COLORS.green, () => {
                charData.装备[equipData.slot] = equipId;
                G.装备[equipId].数量--;
                if (G.装备[equipId].数量 <= 0) delete G.装备[equipId];
                GameEngine.saveGame();
            });
            ey += 33;
        });
    }

    // ============ 角色选择列表 ============
    function renderCharacterSelect() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '聚贤堂 - 弟子列表');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        const chars = Object.keys(G.人物);
        let y = 105;
        chars.forEach(charId => {
            if (y + 70 > H - 20) return;
            const char = G.人物[charId];
            const base = D.CHARACTERS[charId];

            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 60, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(139,105,20,0.4)';
            roundRect(15, y, W - 30, 60, 8);
            ctx.stroke();

            drawText(charId, 30, y + 22, COLORS.gold, 16);
            if (base) {
                const qColor = D.QUALITY.getColor(base.quality || 0);
                drawText(`${base.type || '未知'} | 品质:${D.QUALITY.getName(base.quality || 0)}`, 30, y + 42, qColor, 11);
            }

            // 详情按钮
            drawButton(W - 260, y + 10, 70, 35, '详情', COLORS.gold, () => {
                selectedChar = charId;
                currentScreen = 'char_detail';
            });
            // 装备管理按钮
            drawButton(W - 180, y + 10, 70, 35, '装备', COLORS.green, () => {
                selectedChar = charId;
                currentScreen = 'equip';
            });
            // 上阵/下阵按钮
            const inTeam = G.队伍.includes(charId);
            drawButton(W - 100, y + 10, 70, 35, inTeam ? '下阵' : '上阵', inTeam ? COLORS.red : COLORS.blue, () => {
                if (inTeam) {
                    G.队伍 = G.队伍.filter(id => id !== charId);
                } else if (G.队伍.length < G.队伍上限) {
                    G.队伍.push(charId);
                }
                GameEngine.saveGame();
            });

            y += 70;
        });

        if (chars.length === 0) {
            drawText('暂无弟子，去商城招募吧!', W/2, 200, COLORS.textDim, 14, 'center');
        }
    }

    // ============ 通知消息 ============
    function showNotification(msg, color) {
        notification = { msg, color: color || COLORS.gold, timer: 2.0 };
    }

    // ============ 通天塔界面 ============
    function renderTongtianScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '通天塔');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        const todayCount = G.通天塔今日次数 || 0;
        const todayMax = G.通天塔今日上限 || 1;
        const floor = G.通天塔层数 || 1;
        const canChallenge = todayCount < todayMax && G.体力 >= 5;

        drawText(`当前层数: 第 ${floor} 层`, W/2, 110, COLORS.gold, 18, 'center');
        drawText(`今日挑战: ${todayCount}/${todayMax}`, W/2, 135, COLORS.text, 14, 'center');

        // 奖励说明
        drawPanel(15, 160, W - 30, 80, '奖励说明');
        drawText('每通关1层: 获得银两奖励', 30, 195, COLORS.textDim, 13);
        drawText('每通关3层: 获得弟子魂魄', 30, 215, COLORS.purple, 13);

        if (canChallenge) {
            drawButton(W/2 - 80, 260, 160, 50, '⚡ 挑战本层 (消耗5体力)', COLORS.gold, () => {
                G.体力 -= 5;
                startTongtianBattle();
            });
        } else if (todayCount >= todayMax) {
            drawText('今日挑战次数已用完', W/2, 280, COLORS.accent, 14, 'center');
            drawButton(W/2 - 50, 300, 100, 35, '💎 重置次数', COLORS.orange, () => {
                if (G.元宝 >= 30) {
                    G.元宝 -= 30;
                    G.通天塔今日次数 = 0;
                    G.通天塔今日上限++;
                    showNotification('已重置次数!', COLORS.gold);
                    GameEngine.saveGame();
                }
            });
        } else {
            drawText('体力不足，请休息后继续', W/2, 280, COLORS.accent, 14, 'center');
        }

        // 历史最高
        drawText(`历史最高记录: ${floor}层`, W/2, 350, COLORS.textDim, 12, 'center');
    }

    function startTongtianBattle() {
        const team = getBattleTeam();
        const floor = G.通天塔层数 || 1;
        const enemies = [];
        
        // 根据层数选择敌人组
        let towerGroup = D.TOWER_NPCS[0];
        for (const group of D.TOWER_NPCS) {
            if (floor >= group.floorRange[0] && floor <= group.floorRange[1]) {
                towerGroup = group;
                break;
            }
        }
        if (floor > 30) towerGroup = D.TOWER_NPCS[D.TOWER_NPCS.length - 1];
        
        const isBossFloor = floor % 5 === 0; // 每5层Boss
        const numEnemies = Math.min(isBossFloor ? 1 : (2 + Math.floor(floor / 10)), team.length);
        
        for (let i = 0; i < numEnemies; i++) {
            const npcName = isBossFloor ? towerGroup.boss : towerGroup.npcs[i % towerGroup.npcs.length];
            const npcData = D.NPCS.find(n => n.name === npcName) || D.NPCS[Math.floor(Math.random() * 5)];
            enemies.push(BattleSystem.buildEnemy(npcData, floor * 3));
        }

        BattleSystem.startBattle(team, enemies, 'tower');
        currentScreen = 'battle';
        window._battlePhase = 'fighting';
        window._battleTimer = 0;
        window._battleSource = 'tongtian';
        window._battleResultPlayed = false;
    }

    // ============ 古墓界面 ============
    function renderGumuScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '古墓');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText('挑战古墓NPC，随机掉落武功秘籍', W/2, 110, COLORS.textDim, 14, 'center');

        const difficulties = [
            { name: '普通', color: COLORS.green, dropRate: '较低', level: 1 },
            { name: '困难', color: COLORS.blue, dropRate: '中等', level: 3 },
            { name: '英雄', color: COLORS.purple, dropRate: '最高', level: 5 },
        ];

        difficulties.forEach((diff, i) => {
            const y = 140 + i * 90;
            ctx.fillStyle = 'rgba(30,20,10,0.8)';
            roundRect(20, y, W - 40, 75, 10);
            ctx.fill();
            ctx.strokeStyle = diff.color;
            ctx.lineWidth = 2;
            roundRect(20, y, W - 40, 75, 10);
            ctx.stroke();

            drawText(diff.name, 40, y + 30, diff.color, 18);
            drawText(`掉落几率: ${diff.dropRate}`, 40, y + 50, COLORS.textDim, 12);
            drawText('每个弟子每天可挑战1次', 40, y + 65, COLORS.textDim, 10);

            const canDo = G.体力 >= 3;
            drawButton(W - 100, y + 15, 70, 35, '挑战', canDo ? diff.color : '#555', canDo ? () => {
                G.体力 -= 3;
                startGumuBattle(diff);
            } : null);
        });
    }

    function startGumuBattle(diff) {
        const team = getBattleTeam();
        const enemies = [];
        
        // 根据难度选择古墓Boss
        const bossPool = D.GUMU_BOSSES;
        const boss = bossPool[Math.floor(Math.random() * bossPool.length)];
        const levelIdx = diff.level === 1 ? 0 : (diff.level === 3 ? 1 : 2);
        const bossLevel = boss.levels[levelIdx];
        const npcData = D.NPCS.find(n => n.name === boss.name) || D.NPCS[Math.floor(Math.random() * D.NPCS.length)];
        
        enemies.push(BattleSystem.buildEnemy(npcData, bossLevel));
        // 添加小怪
        for (let i = 0; i < Math.min(2, team.length - 1); i++) {
            const npc = D.NPCS[Math.floor(Math.random() * 4)];
            enemies.push(BattleSystem.buildEnemy(npc, bossLevel - 3));
        }

        BattleSystem.startBattle(team, enemies, 'gumu');
        currentScreen = 'battle';
        window._battlePhase = 'fighting';
        window._battleTimer = 0;
        window._battleSource = 'gumu';
        window._battleDropRate = diff.level / 5;
        window._battleGumuBoss = boss; // 存储Boss数据用于掉落
        window._battleResultPlayed = false;
    }

    // ============ 奇遇界面 ============
    function renderQiyuScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '奇遇');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        const events = [
            { name: '遇到江湖散人', desc: '他愿意教你一招半式', reward: '技能书', cost: 0, color: COLORS.blue },
            { name: '发现宝藏洞穴', desc: '里面有些银两和一个宝箱', reward: '金币500+装备', cost: 10, color: COLORS.gold },
            { name: '救助受伤老者', desc: '老者感激，赠你灵丹', reward: '经验200', cost: 5, color: COLORS.green },
            { name: '误入神秘阵法', desc: '触发转生之力', reward: '转生魂魄', cost: 15, color: COLORS.purple },
            { name: '山贼拦路', desc: '击败山贼获得战利品', reward: '金币300', cost: 8, color: COLORS.accent },
            { name: '武林奇人传功', desc: '直接提升你的修为', reward: '修为+50', cost: 12, color: COLORS.orange },
        ];

        drawText('随机江湖奇遇', W/2, 100, COLORS.gold, 16, 'center');

        events.forEach((ev, i) => {
            const y = 125 + i * 95;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 80, 10);
            ctx.fill();
            ctx.strokeStyle = ev.color;
            ctx.lineWidth = 1;
            roundRect(15, y, W - 30, 80, 10);
            ctx.stroke();

            drawText(ev.name, 30, y + 22, ev.color, 16);
            drawText(ev.desc, 30, y + 42, COLORS.textDim, 12);
            drawText(`收益: ${ev.reward}`, 30, y + 60, COLORS.gold, 11);

            const canDo = G.体力 >= ev.cost;
            drawButton(W - 90, y + 15, 65, 35, `体力${ev.cost}`, canDo ? ev.color : '#555', canDo ? () => {
                handleQiyuEvent(ev);
            } : null);
        });
    }

    function handleQiyuEvent(ev) {
        G.体力 -= ev.cost;
        switch(ev.reward) {
            case '技能书':
                const skills = Object.keys(D.SKILLS).filter(k => D.SKILLS[k].quality >= 1 && D.SKILLS[k].quality <= 3);
                const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                G.技能[randomSkill] = G.技能[randomSkill] || { 数量: 0 };
                G.技能[randomSkill].数量++;
                showNotification(`获得: ${D.SKILLS[randomSkill].name}!`, COLORS.blue);
                break;
            case '金币500+装备':
                G.金钱 += 500;
                showNotification('获得500金币!', COLORS.gold);
                break;
            case '经验200':
                G.经验 += 200;
                while (G.经验 >= G.等级 * 100) { G.经验 -= G.等级 * 100; G.等级++; }
                showNotification('获得200经验!', COLORS.green);
                break;
            case '转生魂魄':
                showNotification('获得转生魂魄之力!', COLORS.purple);
                break;
            case '金币300':
                G.金钱 += 300;
                showNotification('获得300金币!', COLORS.gold);
                break;
            case '修为+50':
                G.修为 += 50;
                showNotification('修为+50!', COLORS.orange);
                break;
        }
        emitParticles(W/2, 200, 25, ev.color);
        GameEngine.saveGame();
    }

    // ============ 装备强化界面 ============
    function renderEquipEnhanceScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '装备强化');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'team'; });

        // 显示所有角色的装备
        const charIds = G.队伍.concat(Object.keys(G.人物).filter(id => !G.队伍.includes(id))).slice(0, 6);
        let y = 105;

        charIds.forEach(charId => {
            if (y + 80 > H - 20) return;
            const charData = G.人物[charId];
            if (!charData) return;
            charData.装备 = charData.装备 || {};

            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 70, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(139,105,20,0.4)';
            roundRect(15, y, W - 30, 70, 8);
            ctx.stroke();

            drawText(charId, 30, y + 22, COLORS.gold, 14);
            const equipIds = Object.values(charData.装备);
            drawText(`${equipIds.length}件装备`, 30, y + 44, COLORS.textDim, 11);

            if (equipIds.length > 0) {
                drawButton(W - 100, y + 15, 70, 35, '一键强化', COLORS.gold, () => {
                    const cost = equipIds.length * 200;
                    if (G.金钱 >= cost) {
                        G.金钱 -= cost;
                        charData.强化等级 = (charData.强化等级 || 0) + 1;
                        showNotification(`${charId}装备强化+${charData.强化等级}!`, COLORS.gold);
                        emitParticles(W/2, y + 35, 20, COLORS.gold);
                        GameEngine.saveGame();
                    } else {
                        showNotification('金币不足!', COLORS.accent);
                    }
                });
            }

            y += 80;
        });

        if (charIds.length === 0) {
            drawText('暂无角色，去招募吧!', W/2, 200, COLORS.textDim, 14, 'center');
        }
    }

    // ============ 技能升级界面 ============
    function renderSkillUpgradeScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '技能升级');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        const skillIds = Object.keys(G.技能).filter(id => G.技能[id].数量 > 0);
        let y = 105;

        skillIds.forEach(skillId => {
            if (y + 55 > H - 20) return;
            const skillData = D.SKILLS[skillId];
            if (!skillData) return;

            const skillInv = G.技能[skillId];
            skillInv.等级 = skillInv.等级 || 1;

            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 48, 8);
            ctx.fill();
            const qColor = D.QUALITY.getColor(skillData.quality || 0);
            ctx.strokeStyle = qColor;
            roundRect(15, y, W - 30, 48, 8);
            ctx.stroke();

            drawText(skillData.name, 30, y + 32, qColor, 15);
            drawText(`Lv.${skillInv.等级} x${skillInv.数量} 威力:${Math.floor(skillData.power * (1 + (skillInv.等级-1)*0.2))}`, 200, y + 32, COLORS.text, 12);

            const cost = skillInv.等级 * 100;
            drawButton(W - 100, y + 8, 70, 30, `升级 💰${cost}`, cost <= G.金钱 ? COLORS.green : '#555', cost <= G.金钱 ? () => {
                G.金钱 -= cost;
                skillInv.等级++;
                showNotification(`${skillData.name} 升至 Lv.${skillInv.等级}!`, qColor);
                GameEngine.saveGame();
            } : null);

            y += 56;
        });

        if (skillIds.length === 0) {
            drawText('暂无技能，去商城/关卡获取吧!', W/2, 200, COLORS.textDim, 14, 'center');
        }
    }

    // ============ 转生界面 ============
    function renderRebirthScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '转生殿');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText('转生提升角色品质与属性', W/2, 100, COLORS.gold, 14, 'center');
        drawText(`当前修为: ${G.修为}`, W/2, 120, COLORS.textDim, 13, 'center');

        // 转生数据
        const rebirthData = [
            { from: '若仙姐姐', to: '神若仙姐姐', cost: 100 },
            { from: '鳌拜', to: '神鳌拜', cost: 150 },
            { from: '空见神僧', to: '神空见神僧', cost: 200 },
            { from: '独孤冲', to: '神独孤冲', cost: 250 },
            { from: '东方无敌', to: '神东方无敌', cost: 300 },
            { from: '洪逍遥', to: '神洪逍遥', cost: 200 },
            { from: '龙玲珑', to: '神龙玲珑', cost: 250 },
            { from: '郭大傻', to: '神郭大傻', cost: 180 },
            { from: '黄灵蓉', to: '神黄灵蓉', cost: 220 },
        ];

        // 只显示玩家拥有的角色
        const ownedRebirths = rebirthData.filter(r => G.人物[r.from]);

        let y = 145;
        if (ownedRebirths.length === 0) {
            drawText('暂无可转生的角色', W/2, 200, COLORS.textDim, 14, 'center');
            drawText('拥有角色后可以来此转生', W/2, 220, COLORS.textDim, 12, 'center');
        }

        ownedRebirths.forEach(r => {
            if (y + 55 > H - 20) return;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 48, 8);
            ctx.fill();
            ctx.strokeStyle = COLORS.purple;
            roundRect(15, y, W - 30, 48, 8);
            ctx.stroke();

            drawText(r.from, 30, y + 32, COLORS.gold, 15);
            drawText(`→ ${r.to}`, 120, y + 32, COLORS.purple, 13);

            const canDo = G.修为 >= r.cost;
            drawButton(W - 100, y + 8, 70, 30, `转生 ${r.cost}修`, canDo ? COLORS.purple : '#555', canDo ? () => {
                G.修为 -= r.cost;
                // 转换角色数据
                const charData = G.人物[r.from];
                G.人物[r.to] = {
                    等级: charData.等级 || 1,
                    技能: charData.技能 || [],
                    装备: charData.装备 || {},
                    数量: 1,
                    转生次数: (charData.转生次数 || 0) + 1,
                };
                delete G.人物[r.from];
                // 更新队伍
                const idx = G.队伍.indexOf(r.from);
                if (idx >= 0) G.队伍[idx] = r.to;
                showNotification(`${r.from} → ${r.to} 转生成功!`, COLORS.purple);
                emitParticles(W/2, y + 24, 30, COLORS.purple);
                GameEngine.saveGame();
            } : null);

            y += 56;
        });
    }

    // ============ 封面/加载界面 ============
    function renderCoverScreen() {
        {
        syncDesignSpace();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawFitImage('封面2', 0, 0, DESIGN_W, DESIGN_H, 'cover');
        drawDesignImage('霸气江湖logo2', 85, 88, 470, 260, 'contain');
        drawDesignImage('边框底纹', 20, 675, 600, 62, 'contain');
        drawDesignImage('边框细线', 70, 660, 500, 22, 'contain');
        drawDesignImage('边框细线', 70, 728, 500, 22, 'contain');
        drawDesignText('霸气001', 320, 712, '#ffffff', 32, 'center', true);
        drawDesignText('点击选区', 505, 712, '#00ff00', 24, 'center', true);

        const prog = Math.max(0, Math.min(1, ResManager.getProgress()));
        drawDesignImage('进度条2', 160, 770, 320, 30, 'contain');
        ctx.save();
        ctx.fillStyle = '#6f0d0d';
        roundRect(dx(178), dy(778), ds(284 * prog), ds(12), ds(6));
        ctx.fill();
        ctx.restore();
        drawDesignText(`正在更新资源... ${Math.floor(prog * 100)}%`, 320, 812, '#ffffff', 18, 'center', true);

        drawDesignImage('进入游戏背景2', 48, 828, 544, 88, 'contain');
        drawDesignImage('进入游戏文字', 190, 844, 260, 48, 'contain');
        addDesignButton(0, 0, 640, 960, function() {
            currentScreen = 'main';
            AudioManager.playBGM();
        }, '进入游戏');
        return;
        }
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        // 加载背景
        ResManager.drawImage(ctx, 'loading', 0, 0, W, H);
        ResManager.drawImage(ctx, 'jianghuxiaoxia', W/2 - 120, H/3 - 80, 240, 160);

        // 标题
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 28px "Microsoft YaHei",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('霸气江湖', W/2, H/2 - 20);
        ctx.fillText('威力加强版', W/2, H/2 + 20);
        ctx.textAlign = 'start';

        // 加载进度
        var prog = ResManager.getProgress();
        var barW = 200, barH = 10;
        var barX = W/2 - barW/2, barY = H/2 + 60;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(barX, barY, barW * prog, barH);

        ctx.fillStyle = COLORS.textDim;
        ctx.font = '12px "Microsoft YaHei",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载中... ' + Math.floor(prog * 100) + '%', W/2, barY + 30);
        ctx.textAlign = 'start';

        // 加载完成后显示进入按钮
        if (prog >= 0.5) {
            drawButton(W/2 - 50, H/2 + 100, 100, 40, '进入游戏', COLORS.gold, function() {
                currentScreen = 'main';
                AudioManager.playBGM();
            });
        }
    }

    // ============ 抽卡界面 ============
    function renderCardDrawScreen() {
        {
        drawOriginalPageShell('', 'card_draw');
        drawDesignImage('招募背景', 0, 140, 640, 530, 'cover');
        drawDesignImage('圆月', 470, 150, 220, 220, 'contain');
        drawDesignImage('卡牌背光', 320, 500, 180, 180, 'contain');
        drawDesignImage('六脉神剑_9', 320, 500, 180, 180, 'contain');
        drawDesignImage('星_1', 320, 500, 180, 180, 'contain');
        drawDesignImage('六脉神剑_12', 320, 500, 180, 180, 'contain');
        drawDesignImage('爆气_1', 320, 500, 220, 220, 'contain');
        drawDesignImage('太极剑法_19', 320, 500, 220, 220, 'contain');
        drawDesignImage('吸血_2', 320, 500, 220, 220, 'contain');
        drawDesignImage('文字_必出紫卡', 320, 320, 240, 72, 'contain');
        drawDesignImage('文字_白绿卡', 140, 320, 240, 72, 'contain');
        drawDesignImage('文字_蓝紫卡', 500, 320, 240, 72, 'contain');
        drawDesignImage('招募按钮2_1', 130, 822, 150, 80, 'contain');
        drawDesignImage('招募按钮2_1', 320, 822, 150, 80, 'contain');
        drawDesignImage('招募按钮2_1', 510, 822, 150, 80, 'contain');
        addDesignButton(58, 778, 145, 92, function() { showNotification('普通招募', COLORS.green); }, '普通招募');
        addDesignButton(245, 778, 150, 92, function() { showNotification('高级招募', COLORS.blue); }, '高级招募');
        addDesignButton(435, 778, 150, 92, function() { showNotification('至尊招募', COLORS.purple); }, '至尊招募');
        return;
        }
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '抽卡 - 招募弟子');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, function() { currentScreen = 'main'; });

        var drawOptions = [
            { name: '普通招募', cost: 0, desc: '免费(每日3次)', quality: [0, 2], color: COLORS.green },
            { name: '高级招募', cost: 50, desc: '消耗50元宝', quality: [1, 3], color: COLORS.blue },
            { name: '至尊招募', cost: 200, desc: '消耗200元宝 必出橙', quality: [2, 5], color: COLORS.purple },
        ];

        drawOptions.forEach(function(opt, i) {
            var y = 110 + i * 90;
            ctx.fillStyle = 'rgba(30,20,10,0.8)';
            roundRect(15, y, W - 30, 75, 10);
            ctx.fill();
            ctx.strokeStyle = opt.color;
            ctx.lineWidth = 2;
            roundRect(15, y, W - 30, 75, 10);
            ctx.stroke();

            drawText(opt.name, 35, y + 30, opt.color, 18);
            drawText(opt.desc, 35, y + 52, COLORS.textDim, 12);

            var canDraw = opt.cost === 0 ? true : G.元宝 >= opt.cost;
            drawButton(W - 90, y + 15, 65, 35, opt.cost === 0 ? '免费' : '💎' + opt.cost, canDraw ? opt.color : '#555', canDraw ? function() {
                if (opt.cost > 0) G.元宝 -= opt.cost;
                // 随机角色
                var chars = Object.keys(D.CHARACTERS).filter(function(c) {
                    return c !== '帮主' && !G.人物[c] && D.CHARACTERS[c].quality >= opt.quality[0] && D.CHARACTERS[c].quality <= opt.quality[1];
                });
                if (chars.length === 0) chars = Object.keys(D.CHARACTERS).filter(function(c) { return c !== '帮主'; });
                var pick = chars[Math.floor(Math.random() * chars.length)];
                G.人物[pick] = G.人物[pick] || { 等级: 1, 技能: [], 装备: {}, 数量: 1 };
                if (!G.人物[pick].技能) G.人物[pick].技能 = [];
                if (!G.人物[pick].装备) G.人物[pick].装备 = {};
                emitParticles(W/2, y + 40, 40, opt.color);
                showNotification('招募到: ' + pick + '!', opt.color);
                GameEngine.saveGame();
            } : null);
        });

        drawText('已有弟子: ' + Object.keys(G.人物).length + ' 位', W/2, 400, COLORS.textDim, 13, 'center');
    }

    // ============ 帮主升级界面 ============
    function renderMasterUpgradeScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '帮主升级');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, function() { currentScreen = 'main'; });

        drawText('帮主 Lv.' + G.等级, W/2, 110, COLORS.gold, 20, 'center');
        var needExp = G.等级 * 100;
        var prog = G.经验 / needExp;
        ctx.fillStyle = '#333';
        ctx.fillRect(30, 130, W - 60, 12);
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(30, 130, (W - 60) * Math.min(1, prog), 12);
        drawText('经验: ' + G.经验 + ' / ' + needExp, W/2, 160, COLORS.text, 13, 'center');

        // 属性面板
        drawPanel(15, 180, W - 30, 130, '帮主属性');
        var stats = [
            ['外功', 30 + G.等级 * 5], ['内功', 25 + G.等级 * 4],
            ['外防', 20 + G.等级 * 3], ['内防', 18 + G.等级 * 3],
            ['生命', 300 + G.等级 * 50], ['速度', 10 + G.等级]
        ];
        stats.forEach(function(s, i) {
            var col = i % 2, row = Math.floor(i / 2);
            drawText(s[0] + ': ' + s[1], 30 + col * 180, 215 + row * 30, COLORS.text, 13);
        });

        // 升级消耗
        if (prog >= 1) {
            drawButton(W/2 - 60, 330, 120, 45, '升 级', COLORS.gold, function() {
                G.经验 -= needExp;
                G.等级++;
                G.体力 = G.体力上限;
                G.队伍上限 = Math.min(8, G.队伍上限 + (G.等级 % 5 === 0 ? 1 : 0));
                emitParticles(W/2, 350, 50, COLORS.gold);
                AudioManager.playSFX('levelup');
                showNotification('帮主升至 Lv.' + G.等级 + '!', COLORS.gold);
                GameEngine.saveGame();
            });
        }

        drawText('体力: ' + G.体力 + '/' + G.体力上限 + ' | 上阵位: ' + G.队伍上限, W/2, 400, COLORS.textDim, 13, 'center');
    }

    // ============ 角色详情弹窗 ============
    function renderCharDetailScreen() {
        var charId = selectedChar;
        if (!charId || !G.人物[charId]) { currentScreen = 'char_select'; return; }

        var charData = G.人物[charId];
        var base = D.CHARACTERS[charId];
        charData.装备 = charData.装备 || {};
        charData.技能 = charData.技能 || [];

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '弟子详情 - ' + charId);
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, function() { currentScreen = 'char_select'; });

        // 角色立绘 - 尝试多个可能的资源名
        var portraitNames = [charId, 'icon-' + charId.toLowerCase(), 'jishi-juese1', 'jishi-juese2', 'jishi-juese3'];
        var hasPortrait = false;
        for (var p = 0; p < portraitNames.length; p++) {
            if (ResManager.drawImage(ctx, portraitNames[p], W - 130, 65, 120, 160)) {
                hasPortrait = true; break;
            }
        }
        if (!hasPortrait) {
            // Fallback: 头像圆
            ctx.fillStyle = D.QUALITY.getColor(base ? base.quality : 0);
            ctx.beginPath();
            ctx.arc(W - 70, 145, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(charId.charAt(0), W - 70, 153);
            ctx.textAlign = 'start';
        }

        var y = 105;
        if (base) {
            var qName = D.QUALITY.getName(base.quality || 0);
            var qColor = D.QUALITY.getColor(base.quality || 0);
            drawText('品质: ' + qName + ' | 类型: ' + (base.type || '未知') + ' | Lv.' + (charData.等级 || 1), 20, y, qColor, 15);
            y += 25;
            drawText(base.desc || '', 20, y, COLORS.textDim, 12);
            y += 30;

            // 属性
            drawPanel(15, y, W - 30, 90, '基础属性');
            var stats = base.base || {};
            var attrs = [
                ['生命', stats.hp || 200], ['外功', stats.atk || 20], ['外防', stats.def || 15],
                ['内功', stats.innerAtk || 20], ['内防', stats.innerDef || 15], ['速度', stats.spd || 10]
            ];
            attrs.forEach(function(a, i) {
                var col = i % 2, row = Math.floor(i / 2);
                drawText(a[0] + ': ' + a[1], 35 + col * 160, y + 30 + row * 22, COLORS.text, 12);
            });
            y += 105;
        }

        // 装备
        drawText('装备:', 20, y, COLORS.gold, 13);
        y += 22;
        D.EQUIP_SLOTS.forEach(function(slot) {
            var equipId = charData.装备[slot];
            var eqName = equipId ? ((D.EQUIPMENT[equipId] && D.EQUIPMENT[equipId].name) || equipId) : '无';
            drawText(slot + ': ' + eqName, 35, y, COLORS.textDim, 12);
            y += 20;
        });

        // 技能
        drawText('技能:', 20, y + 5, COLORS.gold, 13);
        y += 28;
        if (charData.技能.length === 0) {
            drawText('未学习技能', 35, y, COLORS.textDim, 11);
        } else {
            charData.技能.forEach(function(skillId) {
                var skillData = D.SKILLS[skillId];
                var sn = skillData ? skillData.name : skillId;
                var sc = skillData ? D.QUALITY.getColor(skillData.quality || 0) : '#aaa';
                drawText(sn, 35, y, sc, 12);
                y += 20;
            });
        }

        // 炼化按钮
        y = Math.max(y + 20, H - 120);
        drawButton(20, y, 100, 40, '装备管理', COLORS.green, function() { currentScreen = 'equip'; });
        drawButton(W - 120, y, 100, 40, '炼化弟子', COLORS.accent, function() {
            if (confirm('确定要炼化 ' + charId + ' 吗? 将获得修为和材料。')) {
                G.修为 += 50 + (charData.等级 || 1) * 10;
                var teamIdx = G.队伍.indexOf(charId);
                if (teamIdx >= 0) G.队伍.splice(teamIdx, 1);
                delete G.人物[charId];
                showNotification(charId + ' 已炼化，修为+50', COLORS.gold);
                selectedChar = null;
                currentScreen = 'char_select';
                GameEngine.saveGame();
            }
        });
    }

    // ============ 每日奖励界面 ============
    function renderDailyRewardScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '每日奖励');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, function() { currentScreen = 'main'; });

        var today = new Date().getDay();
        G.每日奖励已领 = G.每日奖励已领 || '';

        var rewards = [
            { day: '周一', item: '金币 500', color: COLORS.gold },
            { day: '周二', item: '元宝 30', color: COLORS.orange },
            { day: '周三', item: '体力丹 x2', color: COLORS.green },
            { day: '周四', item: '修为 100', color: COLORS.purple },
            { day: '周五', item: '技能书', color: COLORS.blue },
            { day: '周六', item: '金币 1000', color: COLORS.gold },
            { day: '周日', item: '元宝 50', color: COLORS.orange },
        ];

        drawText('每日登录奖励', W/2, 100, COLORS.gold, 16, 'center');

        rewards.forEach(function(r, i) {
            var y = 125 + i * 55;
            var isToday = i === today;
            ctx.fillStyle = isToday ? 'rgba(60,40,15,0.9)' : 'rgba(30,20,10,0.7)';
            roundRect(15, y, W - 30, 48, 8);
            ctx.fill();
            if (isToday) {
                ctx.strokeStyle = COLORS.gold;
                ctx.lineWidth = 2;
                roundRect(15, y, W - 30, 48, 8);
                ctx.stroke();
            }

            drawText(r.day, 30, y + 32, isToday ? COLORS.gold : COLORS.textDim, 15);
            drawText(r.item, 120, y + 32, r.color, 14);
            var claimed = G.每日奖励已领.indexOf('' + i) >= 0;

            if (isToday && !claimed) {
                drawButton(W - 90, y + 8, 65, 30, '领取', COLORS.gold, function() {
                    G.每日奖励已领 += i;
                    switch(r.item) {
                        case '金币 500': G.金钱 += 500; break;
                        case '金币 1000': G.金钱 += 1000; break;
                        case '元宝 30': G.元宝 += 30; break;
                        case '元宝 50': G.元宝 += 50; break;
                        case '修为 100': G.修为 += 100; break;
                        case '体力丹 x2': G.体力 = Math.min(G.体力 + 100, G.体力上限); break;
                    }
                    showNotification(r.day + '奖励已领取!', r.color);
                    GameEngine.saveGame();
                });
            } else if (claimed) {
                drawText('已领', W - 60, y + 32, COLORS.textDim, 13);
            }
        });
    }

    // ============ 图鉴界面 ============
    function renderTujianScreen() {
        if (!window._tujianTab) window._tujianTab = 'char';
        syncDesignSpace();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawFitImage('bg_1', 0, 0, DESIGN_W, DESIGN_H, 'cover');
        drawOriginalTopBar();
        drawOriginalBottomNav('more_menu');
        drawDesignText('图鉴', 320, 124, COLORS.gold, 24, 'center', true);

        const tabs = [
            { key: 'char', label: '弟子', normal: '弟子按钮_2', selected: '弟子按钮_1', x: -232 },
            { key: 'equip', label: '装备', normal: '装备按钮_2', selected: '装备按钮_1', x: -96 },
            { key: 'skill', label: '武功', normal: '武功按钮_2', selected: '武功按钮_1', x: 41 },
        ];
        tabs.forEach(function(tab) {
            const img = window._tujianTab === tab.key ? tab.selected : tab.normal;
            if (!drawFrameImageNode({ image: img, x: tab.x, y: 327 })) {
                drawFrameLabelNode({ label: tab.label, x: tab.x, y: 327, fontsize: 20, color: COLORS.gold, bold: true });
            }
            addFrameButtonNode({ name: tab.key, x: tab.x, y: 327, w: 114, h: 69 }, function() {
                window._tujianTab = tab.key;
                window._tujianItem = null;
            });
        });

        const detail = window._tujianTab === 'char'
            ? {
                title: '弟子图鉴',
                items: Object.keys(D.CHARACTERS).filter(c => c !== '帮主').map(cid => {
                    const data = D.CHARACTERS[cid];
                    return { id: cid, name: data.name || cid, desc: data.type || '', quality: data.quality || 0, owned: !!G.人物[cid] };
                })
            }
            : window._tujianTab === 'skill'
            ? {
                title: '武功图鉴',
                items: Object.keys(D.SKILLS).map(sid => {
                    const data = D.SKILLS[sid];
                    return { id: sid, name: data.name || sid, desc: data.type || '', quality: data.quality || 0, owned: !!G.技能[sid] };
                })
            }
            : {
                title: '装备图鉴',
                items: Object.keys(D.EQUIPMENT).map(eid => {
                    const data = D.EQUIPMENT[eid];
                    return { id: eid, name: data.name || eid, desc: data.slot || '', quality: data.quality || 0, owned: !!(G.装备[eid] && G.装备[eid].数量 > 0) };
                })
            };

        ctx.save();
        ctx.fillStyle = 'rgba(31, 19, 9, 0.76)';
        ctx.strokeStyle = 'rgba(139,105,20,0.55)';
        ctx.lineWidth = ds(2);
        roundRect(dx(18), dy(160), ds(604), ds(612), ds(6));
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const ownedCount = detail.items.filter(item => item.owned).length;
        drawDesignText(detail.title, 320, 188, COLORS.gold, 20, 'center', true);
        drawDesignText('拥有: ' + ownedCount + '/' + detail.items.length, 320, 214, '#ead7ad', 13, 'center', false);

        detail.items.slice(0, 10).forEach(function(item, i) {
            const x = 34 + (i % 2) * 292;
            const y = 238 + Math.floor(i / 2) * 96;
            const qColor = D.QUALITY.getColor(item.quality || 0);
            ctx.save();
            ctx.fillStyle = item.owned ? 'rgba(58, 40, 18, 0.84)' : 'rgba(24, 18, 12, 0.78)';
            ctx.strokeStyle = item.owned ? '#b8860b' : '#5a4630';
            ctx.lineWidth = ds(2);
            roundRect(dx(x), dy(y), ds(272), ds(78), ds(5));
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            drawDesignText(item.name, x + 16, y + 29, item.owned ? qColor : COLORS.textDim, 15, 'left', true);
            drawDesignText(item.desc, x + 16, y + 54, item.owned ? '#ead7ad' : '#666', 11, 'left', false);
            drawDesignText(item.owned ? '已拥有' : D.QUALITY.getName(item.quality || 0), x + 226, y + 31, item.owned ? COLORS.green : qColor, 12, 'center', true);
            addDesignButton(x, y, 272, 78, function() {
                window._tujianItem = item;
                showNotification(item.name, item.owned ? COLORS.green : COLORS.textDim);
            }, item.id);
        });
    }

    // ============ 排行榜界面 ============
    function renderRankScreen() {
        if (!window._rankTab) window._rankTab = 'level';
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '名人堂 - 排行榜');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        var rankTabs = ['level','tower','wealth','biwu'];
        var rankNames = { level:'关卡进度', tower:'通天塔', wealth:'财富排行', biwu:'比武胜场' };
        rankTabs.forEach(function(t,i) {
            drawButton(80 + i*88, 60, 80, 35, rankNames[t], window._rankTab===t ? COLORS.gold : COLORS.textDim, function() {
                window._rankTab = t;
            });
        });

        var y = 105;
        var data = [];
        if (window._rankTab === 'level') {
            data.push({name:'帮主', val:G.等级, desc:'Lv.'+G.等级});
            Object.keys(G.人物).forEach(function(cid) {
                data.push({name:cid, val:G.人物[cid].等级||1, desc:'Lv.'+(G.人物[cid].等级||1)});
            });
        } else if (window._rankTab === 'tower') {
            data.push({name:'帮主', val:G.通天塔层数||0, desc:'第'+(G.通天塔层数||0)+'层'});
        } else if (window._rankTab === 'wealth') {
            data.push({name:'帮主', val:G.金钱, desc:'💰'+G.金钱});
        } else {
            data.push({name:'帮主', val:G.挑战通关||0, desc:'胜'+(G.挑战通关||0)+'场'});
        }
        data.sort(function(a,b){return b.val-a.val;});
        data.forEach(function(item,i) {
            if (y + 45 > H - 20) return;
            var colors = [COLORS.gold, '#C0C0C0', '#CD7F32'];
            var medal = i < 3 ? ['🥇','🥈','🥉'][i] : '  ';
            ctx.fillStyle = i%2===0 ? 'rgba(40,30,15,0.7)' : 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 40, 6); ctx.fill();
            drawText(medal + ' ' + (i+1) + '. ' + item.name, 30, y+28, i<3?colors[i]:COLORS.text, 14);
            drawText(item.desc, W-100, y+28, COLORS.textDim, 13);
            y += 48;
        });
    }

    // ============ 邮件界面 ============
    function renderMailScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '邮件');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        G.邮件列表 = G.邮件列表 || [];
        // 自动生成一些系统邮件
        if (G.邮件列表.length === 0) {
            G.邮件列表 = [
                { title:'欢迎来到霸气江湖', content:'恭喜你成为一代帮主！特赠100元宝作为见面礼。', reward:'元宝', rewardVal:100, read:false },
                { title:'每日签到奖励', content:'每日登录即可领取丰厚奖励，不要错过哦！', reward:'金币', rewardVal:200, read:false },
                { title:'新手礼包', content:'完成首次战斗即可领取新手礼包。', reward:'经验', rewardVal:500, read:false },
            ];
        }

        if (G.邮件列表.length === 0) {
            drawText('📭 暂无邮件', W/2, 200, COLORS.textDim, 16, 'center');
        }

        var y = 105;
        G.邮件列表.forEach(function(mail,i) {
            if (y + 60 > H - 20) return;
            ctx.fillStyle = mail.read ? 'rgba(25,18,8,0.7)' : 'rgba(50,35,15,0.9)';
            roundRect(15, y, W-30, 52, 8); ctx.fill();
            if (!mail.read) {
                ctx.strokeStyle = COLORS.gold;
                roundRect(15, y, W-30, 52, 8); ctx.stroke();
            }
            drawText((mail.read?'':'📩 ')+mail.title, 30, y+22, mail.read?COLORS.textDim:COLORS.gold, 14);
            drawText(mail.content.substring(0,20)+'...', 30, y+42, COLORS.textDim, 11);

            if (mail.reward && !mail.rewardClaimed) {
                drawButton(W-90, y+8, 65, 30, '领取', COLORS.gold, function() {
                    mail.rewardClaimed = true;
                    mail.read = true;
                    if (mail.reward==='元宝') G.元宝 += mail.rewardVal;
                    if (mail.reward==='金币') G.金钱 += mail.rewardVal;
                    if (mail.reward==='经验') { G.经验 += mail.rewardVal; while(G.经验>=G.等级*100){G.经验-=G.等级*100;G.等级++;} }
                    showNotification('领取: '+mail.reward+'+'+mail.rewardVal, COLORS.gold);
                    GameEngine.saveGame();
                });
            } else if (mail.rewardClaimed) {
                drawText('已领', W-70, y+28, COLORS.textDim, 13);
            }
            y += 60;
        });
    }

    // ============ 公告/活动界面 ============
    function renderNoticeScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '活动公告');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        // 公告
        var notices = [
            { title:'🎉 新服开启', content:'霸气江湖单机版正式上线！所有功能免费畅玩。', color:COLORS.gold },
            { title:'📢 版本更新', content:'v1.0.0 版本已包含全部24章主线、通天塔、古墓、比武等玩法。', color:COLORS.blue },
            { title:'💡 小贴士', content:'每日登录可领取奖励，完成奇遇可获得稀有技能。', color:COLORS.green },
        ];

        var y = 105;
        drawText('📋 系统公告', 20, y, COLORS.gold, 15);
        y += 25;

        notices.forEach(function(n) {
            if (y + 55 > H - 20) return;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 48, 8); ctx.fill();
            ctx.strokeStyle = n.color;
            roundRect(15, y, W-30, 48, 8); ctx.stroke();
            drawText(n.title, 30, y+22, n.color, 14);
            drawText(n.content, 30, y+40, COLORS.textDim, 11);
            y += 56;
        });

        // 活动
        y += 10;
        drawText('🎪 当前活动', 20, y, COLORS.gold, 15);
        y += 25;

        var events = [
            { name:'每日签到', desc:'每天登录领取奖励', btn:'前往', screen:'daily_reward', color:COLORS.green },
            { name:'充值返利', desc:'充值任意元宝送好礼', btn:'前往', screen:'recharge', color:COLORS.orange },
            { name:'兑换有礼', desc:'输入兑换码赢大奖', btn:'前往', screen:'redeem', color:COLORS.purple },
        ];

        events.forEach(function(ev) {
            if (y + 50 > H - 20) return;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 42, 8); ctx.fill();
            drawText(ev.name, 30, y+17, ev.color, 15);
            drawText(ev.desc, 30, y+34, COLORS.textDim, 11);
            drawButton(W-90, y+6, 65, 28, ev.btn, ev.color, function() {
                currentScreen = ev.screen;
            });
            y += 50;
        });

        const exchange = [
            { code:'JIANGHU666', reward:'元宝100+金币500', action: function() { G.元宝 += 100; G.金钱 += 500; } , color:COLORS.gold },
            { code:'BAQI888', reward:'体力丹x3', action: function() { G.体力 = Math.min(G.体力 + 150, G.体力上限); } , color:COLORS.green },
            { code:'WELCOME', reward:'经验500', action: function() { G.经验 += 500; while (G.经验 >= G.等级 * 100) { G.经验 -= G.等级 * 100; G.等级++; } } , color:COLORS.blue },
            { code:'VIP999', reward:'招募令x1', action: function() { var ch=Object.keys(D.CHARACTERS).filter(function(c){return c!=='帮主'&&!G.人物[c];}); if(ch.length>0){var nc=ch[Math.floor(Math.random()*ch.length)]; G.人物[nc]={等级:1,技能:[],装备:{},数量:1}; } } , color:COLORS.purple },
        ];
        y += 12;
        drawText('🎁 活动兑换', 20, y, COLORS.gold, 15);
        y += 24;
        G.已兑换 = G.已兑换 || [];
        exchange.forEach(function(item) {
            if (y + 46 > H - 20) return;
            const used = G.已兑换.indexOf(item.code) >= 0;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 40, 8); ctx.fill();
            drawText(item.code, 30, y+17, item.color, 14);
            drawText(item.reward, 30, y+32, COLORS.textDim, 11);
            if (!used) {
                drawButton(W-100, y+6, 70, 28, '兑换', item.color, function() {
                    if (G.已兑换.indexOf(item.code) >= 0) return;
                    G.已兑换.push(item.code);
                    item.action();
                    GameEngine.saveGame();
                    showNotification(item.code + ' 兑换成功', item.color);
                });
            } else {
                drawText('已兑换', W-80, y+25, COLORS.textDim, 12);
            }
            y += 48;
        });
    }

    // ============ 兑换礼包界面 ============
    function renderRedeemScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '兑换礼包');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText('输入兑换码领取奖励', W/2, 110, COLORS.gold, 16, 'center');
        drawText('预设兑换码:', W/2, 150, COLORS.textDim, 13, 'center');

        var codes = [
            { code:'JIANGHU666', reward:'元宝100+金币500', color:COLORS.gold },
            { code:'BAQI888', reward:'体力丹x3', color:COLORS.green },
            { code:'WELCOME', reward:'经验500', color:COLORS.blue },
            { code:'VIP999', reward:'招募令x1', color:COLORS.purple },
        ];

        G.已兑换 = G.已兑换 || [];

        codes.forEach(function(c,i) {
            var y = 180 + i * 55;
            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 48, 8); ctx.fill();
            drawText(c.code, 30, y+20, c.color, 15);
            drawText('奖励: '+c.reward, 30, y+38, COLORS.textDim, 11);

            var used = G.已兑换.indexOf(c.code) >= 0;
            if (!used) {
                drawButton(W-100, y+8, 70, 30, '兑换', c.color, function() {
                    G.已兑换.push(c.code);
                    switch(c.code) {
                        case 'JIANGHU666': G.元宝+=100; G.金钱+=500; break;
                        case 'BAQI888': G.体力=Math.min(G.体力+150, G.体力上限); break;
                        case 'WELCOME': G.经验+=500; while(G.经验>=G.等级*100){G.经验-=G.等级*100;G.等级++;} break;
                        case 'VIP999': var ch=Object.keys(D.CHARACTERS).filter(function(c){return c!=='帮主'&&!G.人物[c];}); if(ch.length>0){var nc=ch[Math.floor(Math.random()*ch.length)]; G.人物[nc]={等级:1,技能:[],装备:{},数量:1};} break;
                    }
                    showNotification(c.code+' 兑换成功! '+c.reward, c.color);
                    GameEngine.saveGame();
                });
            } else {
                drawText('已兑换', W-80, y+28, COLORS.textDim, 13);
            }
        });

        // 手动输入（简化：点击预设码即输入）
        drawText('💡 点击兑换码按钮即可使用', W/2, 180 + codes.length*55 + 20, COLORS.textDim, 11, 'center');
    }

    // ============ 充值界面 ============
    function renderRechargeScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '充值中心');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText('💎 元宝: ' + G.元宝, W/2, 100, COLORS.orange, 20, 'center');
        drawText('单机版 - 免费获取元宝', W/2, 125, COLORS.textDim, 13, 'center');

        var packs = [
            { name:'小额元宝', amount:10, desc:'适合日常使用', color:COLORS.green },
            { name:'中额元宝', amount:50, desc:'推荐选择', color:COLORS.blue },
            { name:'大额元宝', amount:200, desc:'最超值', color:COLORS.purple },
            { name:'至尊元宝', amount:500, desc:'至尊享受', color:COLORS.orange },
        ];

        packs.forEach(function(p,i) {
            var y = 150 + i * 85;
            ctx.fillStyle = 'rgba(30,20,10,0.8)';
            roundRect(15, y, W-30, 70, 10); ctx.fill();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            roundRect(15, y, W-30, 70, 10); ctx.stroke();

            drawText(p.name, 35, y+28, p.color, 18);
            drawText(p.desc, 35, y+50, COLORS.textDim, 12);
            drawText('💎 +' + p.amount, W-170, y+28, p.color, 16);

            drawButton(W-95, y+15, 65, 35, '领取', p.color, function() {
                G.元宝 += p.amount;
                G.充值记录 = G.充值记录 || [];
                G.充值记录.push({ name:p.name, amount:p.amount, time:new Date().toLocaleString() });
                emitParticles(W/2, y+35, 40, p.color);
                showNotification('获得 +'+p.amount+' 元宝!', p.color);
                GameEngine.saveGame();
            });
        });

        // 充值记录
        G.充值记录 = G.充值记录 || [];
        if (G.充值记录.length > 0) {
            drawText('📋 充值记录', 20, 150 + packs.length*85 + 10, COLORS.textDim, 12);
            var ry = 150 + packs.length*85 + 35;
            G.充值记录.slice(-3).reverse().forEach(function(r) {
                drawText(r.time + ' ' + r.name + ' +'+r.amount+'元宝', 30, ry, COLORS.textDim, 11);
                ry += 18;
            });
        }
    }

    // ============ 扫荡界面 ============
    function renderSweepScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(5, 5, W - 10, 50, '扫荡');
        drawButton(10, 60, 60, 35, '← 返回', COLORS.textDim, () => { currentScreen = 'main'; });

        drawText('已通关关卡可一键扫荡获取奖励', W/2, 100, COLORS.textDim, 14, 'center');
        drawText('消耗: 每关5体力', W/2, 120, COLORS.textDim, 12, 'center');
        drawText('体力: ' + G.体力 + '/' + G.体力上限, W/2, 140, COLORS.blue, 13, 'center');

        var completed = Object.keys(G.关卡进度 || {}).filter(function(id) {
            return G.关卡进度[id];
        });

        if (completed.length === 0) {
            drawText('暂无已通关关卡', W/2, 250, COLORS.textDim, 15, 'center');
            drawText('先去 江湖→闯关 通关再来吧!', W/2, 275, COLORS.textDim, 13, 'center');
            return;
        }

        drawText('可扫荡关卡: ' + completed.length + ' 个', W/2, 165, COLORS.gold, 13, 'center');

        var y = 185;
        var chapters = D.CHAPTERS;
        completed.forEach(function(cid) {
            var ch = chapters.find(function(c) { return c.id === cid; });
            if (!ch || y + 55 > H - 60) return;

            ctx.fillStyle = 'rgba(30,20,10,0.7)';
            roundRect(15, y, W-30, 48, 8); ctx.fill();
            drawText(ch.name, 30, y+18, COLORS.gold, 14);
            drawText('Lv.'+ch.level+' | '+ch.stages+'关', 30, y+36, COLORS.textDim, 11);

            drawButton(W-140, y+8, 55, 30, '单次扫荡', COLORS.blue, function() {
                if (G.体力 >= 5) {
                    G.体力 -= 5;
                    G.金钱 += ch.level * 20;
                    G.经验 += ch.level * 10;
                    while(G.经验 >= G.等级*100){G.经验-=G.等级*100;G.等级++;}
                    showNotification(ch.name+' 扫荡完成! +'+(ch.level*20)+'金币', COLORS.gold);
                    GameEngine.saveGame();
                } else {
                    showNotification('体力不足!', COLORS.accent);
                }
            });

            drawButton(W-75, y+8, 55, 30, '十连扫荡', COLORS.orange, function() {
                if (G.体力 >= 50) {
                    G.体力 -= 50;
                    G.金钱 += ch.level * 200;
                    G.经验 += ch.level * 100;
                    while(G.经验 >= G.等级*100){G.经验-=G.等级*100;G.等级++;}
                    showNotification(ch.name+' 十连扫荡完成! +'+(ch.level*200)+'金币', COLORS.gold);
                    GameEngine.saveGame();
                } else {
                    showNotification('体力不足(需要50)!', COLORS.accent);
                }
            });

            y += 56;
        });

        drawText('💡 体力不足可通过 商城/福地 获取', W/2, y+10, COLORS.textDim, 11, 'center');
    }

    // ============ 通用界面 ============
    function renderComingSoon() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        drawPanel(W / 2 - 100, H / 2 - 40, 200, 80, '开发中');
        drawText('🚧 功能开发中...', W / 2, H / 2 + 10, COLORS.textDim, 14, 'center');
        drawButton(W / 2 - 30, H / 2 + 30, 60, 30, '返回', COLORS.textDim, () => { currentScreen = 'main'; });
    }

    // ============ 主渲染函数 ============
    function render() {
        ctx = GameEngine.ctx;
        W = GameEngine.W;
        H = GameEngine.H;
        buttons = [];

        ctx.save();
        switch (currentScreen) {
            case 'cover': renderCoverScreen(); break;
            case 'main': renderMainScreen(); break;
            case 'chapter_select': renderChapterSelect(); break;
            case 'jianghu_detail': renderJianghuDetail(); break;
            case 'battle_prep': renderBattlePrep(); break;
            case 'battle': renderBattle(); break;
            case 'team': renderTeamScreen(); break;
            case 'bag': renderBagScreen(); break;
            case 'shop': renderShopScreen(); break;
            case 'settings': renderSettingsScreen(); break;
            case 'fudi': renderFudiScreen(); break;
            case 'biwu': renderBiwuScreen(); break;
            case 'equip': renderEquipScreen(); break;
            case 'equip_enhance': renderEquipEnhanceScreen(); break;
            case 'skill_upgrade': renderSkillUpgradeScreen(); break;
            case 'char_select': renderCharacterSelect(); break;
            case 'char_detail': renderCharDetailScreen(); break;
            case 'tongtian': renderTongtianScreen(); break;
            case 'gumu': renderGumuScreen(); break;
            case 'qiyu': renderQiyuScreen(); break;
            case 'rebirth': renderRebirthScreen(); break;
            case 'card_draw': renderCardDrawScreen(); break;
            case 'master_upgrade': renderMasterUpgradeScreen(); break;
            case 'daily_reward': renderDailyRewardScreen(); break;
            case 'tujian': renderTujianScreen(); break;
            case 'rank': renderRankScreen(); break;
            case 'mail': renderMailScreen(); break;
            case 'notice': renderNoticeScreen(); break;
            case 'redeem': renderRedeemScreen(); break;
            case 'recharge': renderRechargeScreen(); break;
            case 'sweep': renderSweepScreen(); break;
            case 'more_menu': renderMoreMenu(); break;
            case 'coming_soon': renderComingSoon(); break;
            default: renderMainScreen(); break;
        }

        // 渲染通知消息
        if (notification && notification.timer > 0) {
            ctx.save();
            const alpha = Math.min(1, notification.timer);
            const nw = ctx.measureText(notification.msg).width + 40;
            const nx = W/2 - nw/2, ny = H/2 - 50;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            roundRect(nx, ny, nw, 40, 10);
            ctx.fill();
            ctx.strokeStyle = notification.color;
            roundRect(nx, ny, nw, 40, 10);
            ctx.stroke();
            ctx.fillStyle = notification.color;
            ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(notification.msg, W/2, ny + 28);
            ctx.textAlign = 'start';
            ctx.restore();
        }

        renderParticles();
        ctx.restore();
    }

    function update(dt) {
        animationTime += dt;
        updateParticles(dt);

        // 通知计时器
        if (notification && notification.timer > 0) {
            notification.timer -= dt;
        }

        // Auto-battle
        if (currentScreen === 'battle' && window._battlePhase === 'fighting') {
            const state = BattleSystem.getState();
            if (state && !state.isOver) {
                window._battleTimer = (window._battleTimer || 0) + dt;
                if (window._battleTimer > 0.8) {
                    window._battleTimer = 0;
                    const events = BattleSystem.executeTurn();
                    // Trigger battle effect
                    window._battleEffectTimer = 0.5;
                    window._battleEffectCat = ['dandao', 'daoguang', 'sudu', 'xuan', 'bang'][Math.floor(Math.random() * 5)];
                    AudioManager.playSFX('battle');
                }
            }
        }

        // Battle effect timer
        if (window._battleEffectTimer && window._battleEffectTimer > 0) {
            window._battleEffectTimer -= dt;
        }
    }

    function onClick(x, y) {
        for (let i = buttons.length - 1; i >= 0; i--) {
            const btn = buttons[i];
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                if (btn.onClick) {
                    btn.onClick();
                    emitParticles(x, y, 8, COLORS.gold);
                }
                return;
            }
        }
    }

    function onTouchStart(x, y) {
        onClick(x, y);
    }

    return {
        render, update, onClick, onTouchStart,
        updateSize, setCtx,
        initializeDemoData,
        get currentScreen() { return currentScreen; },
        set currentScreen(v) { currentScreen = v; },
    };
})();
