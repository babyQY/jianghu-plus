/**
 * LocalServer —— 本地伪服务器（单机版核心）
 * 职责：凭空造出一份完整初始存档，并处理原版 146 个协议，
 *      返回 {code, update:{路径:值}, remove:[...], jumpto:...} 增量给 dataChange。
 *
 * 约定：
 *   - code 缺省视为成功；code===100 在原版表示会话过期会触发重登，禁止返回。
 *   - 单机版理念：无限资源、去充值限制。充值类直接成功；消耗类不扣或返回上限。
 *
 * 战斗机制（逆向自 game-724）：
 *   - 请求战斗 → 设 .战前，清 .战况，跳「布阵界面」
 *   - 布阵界面「出战」→ 战斗 → update 含 .战况 时 dataChange 自动调 主窗体.updateStatus() 播放
 *   - 战况用 [["胜负",true]] 单 opcode → showResult → jumpPage(.战斗结果.结束)
 */
(function () {
    'use strict';

    var SAVE_KEY = 'jianghu_native_save_v2';

    // ============ 角色工厂 ============
    // 按等级与品质生成一份完整角色对象（字段取自原版 UI 数据绑定）
    function makeChar(name, icon, opts) {
        opts = opts || {};
        var lv = opts.等级 || 60;
        var q = opts.品质 == null ? 4 : opts.品质;          // 0白1绿2蓝3紫4橙5红
        var mul = 1 + q * 0.6;
        var base = function (n) { return Math.round(n * mul * (1 + lv * 0.08)); };
        return {
            名字: name,
            图标: icon || name,
            类型: opts.类型 || '平衡型',
            品质: q,
            等级: lv,
            等级上限: opts.等级上限 || 80,
            资质: opts.资质 || (q + 1) * 100,
            说明: opts.说明 || (name + '，江湖一代豪杰。'),
            卡牌: icon || name,

            生命: base(1200),
            攻击: base(160),
            防御: base(90),
            内力: base(140),
            速度: 100 + lv,
            命中: 1000,
            暴击: 200 + q * 50,
            闪避: 100 + q * 30,
            格挡: 100 + q * 30,
            罡气: 50 + q * 20,
            勾玉: q,
            战力: base(5000),

            装备: { 武器: '', 帽子: '', 衣服: '', 鞋子: '', 宝物: '', 披风: '' },
            技能: { 技能1: '', 技能2: '', 技能3: '', 技能4: '', 技能5: '', 技能6: '' },
            突破: { 内力: 0, 攻击: 0, 生命: 0, 防御: 0, 等级上限: 0, 金钱: 0, 星: 0 },
            缘分: {
                未激活缘分: {}, 激活缘分: {}, 说明: ''
            },
            卦石: {},
            魂魄: { 数量: 0 },
            转生魂魄: { 魂魄: { 数量: 0 } },
            培养: 0,
            培养上限: 100,
            升级进度: 0,

            // 列表项里部分绑定用 @.信息.图标，这里冗余一份
            信息: { 图标: icon || name, 名字: name, 等级: lv, 品质: q }
        };
    }

    // ============ 初始存档播种 ============
    function freshSave() {
        var roster = {};
        // 图标 = icon-<拼音>，须对应 assets 里实际存在的头像文件。
        // 目前本地资源仅含 4 个头像（guojing/yangguo/xiaolongnv/jinlun）。
        var starters = [
            ['帮主', 'icon-guojing', { 类型: '平衡型', 品质: 5, 说明: '一代帮主，威震江湖。' }],
            ['杨过', 'icon-yangguo', { 类型: '外功型', 品质: 5, 说明: '神雕大侠，玉女素心。' }],
            ['小龙女', 'icon-xiaolongnv', { 类型: '内功型', 品质: 5, 说明: '古墓传人，冰清玉洁。' }],
            ['金轮法王', 'icon-jinlun', { 类型: '防御型', 品质: 4, 说明: '蒙古国师，龙象般若。' }],
            ['郭靖二', 'icon-guojing', { 类型: '防御型', 品质: 4, 说明: '降龙十八掌，侠之大者。' }],
            ['杨过二', 'icon-yangguo', { 类型: '外功型', 品质: 4, 说明: '黯然销魂，独臂神剑。' }]
        ];
        var team = [];
        starters.forEach(function (s) {
            var c = makeChar(s[0], s[1], s[2]);
            roster[s[0]] = c;
            // 关键：队伍 存「人物的键名」，GExpand 会把 .队伍[i] 翻译成 .人物.<键名>
            if (team.length < 6) team.push(s[0]);
        });

        return {
            session_id: 'local',
            编号: '100001',
            名字: '帮主',
            等级: 60,
            create_time: Math.floor(Date.now() / 1000),
            serverID: 'app_1013',
            viplevel: 15,
            vip: 15,

            元宝: 99999999,
            金钱: 99999999,
            体力: 9999,
            体力上限: 9999,
            经验: 0,
            威望: 999999,

            队伍上限: 6,
            帮主升级: { 队伍上限: 6 },

            次数: {},
            每日次数: {},
            累积次数: {},

            队伍: team,
            人物: roster,
            装备: {},
            武功: {},
            道具: {},
            魂魄: {},
            卦石: {},
            材料: {},

            // 进度=100 → 下一关()=101（第一关）；进度为最高已通关编号
            普通关卡进度: { 进度: 100 },
            精英关卡进度: { 进度: 100 },
            挑战关卡进度: { 进度: 100 },
            特殊关卡进度: { 进度: 100 },
            每日任务进度: { 积分: 0 },

            每日奖励已领: ''
        };
    }

    var S = null;
    function load() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (raw) { S = JSON.parse(raw); return; }
        } catch (e) {}
        S = freshSave();
    }
    load();

    // ============ 工具：查关卡信息 ============
    // levelKey 形如 "普通关卡00101"：前7位是大关 key，后续是小关
    function findLevel(levelKey) {
        if (!levelKey) return null;
        var pools = ['普通关卡', '精英关卡', '特殊关卡', '挑战关卡'];
        for (var p = 0; p < pools.length; p++) {
            var pool = window.G && G[pools[p]];
            if (!pool) continue;
            for (var dk in pool) {
                var xks = pool[dk]['小关'];
                if (xks && xks[levelKey]) {
                    return { 池: pools[p], 大关: dk, 小关key: levelKey, 数据: xks[levelKey], 进度池: pools[p] + '进度' };
                }
            }
        }
        return null;
    }

    // ============ 协议处理表 ============
    var H = {};

    // 登录后 window.G 即为「活状态」（由 进入游戏 用 update '.':S 播种）。
    // 此后所有 handler 都读写 g()（=window.G），持久化也存 g()。
    function g() { return window.G; }

    // —— 登录 / 个人信息 ——
    H['进入游戏'] = function () { return { update: { '.': S }, jumpto: '首页' }; };
    H['个人信息'] = function () { return { update: { '.': S } }; };

    // —— 充值 / 资源（无限，直接成功） ——
    H['充值'] = function () { return {}; };
    H['购买体力'] = function () { return { update: { '.体力': g().体力上限 } }; };
    H['领取体力'] = function () { return { update: { '.体力': g().体力上限 } }; };
    H['金钱换元宝'] = function () { return {}; };
    H['查看特权'] = function () { return {}; };

    // —— 请求战斗：建立战前，进入布阵 ——
    function requestFight(levelKey) {
        var L = findLevel(levelKey);
        var info = L ? L.数据.信息 : { 经验: 100, 金钱: 100, 威望: 10, 体力: 1 };
        var item = L ? (L.数据.物品 || []) : [];
        return {
            update: {
                '.战前': {
                    编号: levelKey,
                    编号数字: L ? L.数据.编号 : 101,
                    信息: info,
                    物品: item,
                    背景: (info && info.背景) || '战斗背景1',
                    池: L ? L.进度池 : '普通关卡进度'
                }
            },
            remove: ['.战况'],
            jumpto: '布阵界面'
        };
    }
    H['请求战斗'] = function (p) { return requestFight(p.level || GGet(null, '.当前.小关')); };
    H['请求精英战斗'] = function (p) { return requestFight(p.level); };
    H['请求特殊战斗'] = function (p) { return requestFight(p.level); };
    H['请求多次战斗'] = function (p) { return requestFight(p.level); };

    // —— 战斗：判胜 + 发奖（无限资源，必胜）。读写活状态 g()=window.G ——
    function doFight() {
        var G = g();
        var pre = G.战前 || {};
        var info = pre.信息 || {};
        var exp = info.经验 || 0, money = info.金钱 || 0, wei = info.威望 || 0;
        var newExp = (G.经验 || 0) + exp;
        var newMoney = (G.金钱 || 0) + money;
        var newWei = (G.威望 || 0) + wei;

        // 推进关卡进度：进度 = max(当前进度, 本关编号)
        var poolName = pre.池 || '普通关卡进度';
        var num = pre.编号数字 || 0;
        var pool = G[poolName] || { 进度: 100 };
        if (num > (pool.进度 || 0)) pool.进度 = num;

        // 每个上阵角色的奖励展示（队伍存键名 → 取人物对象）
        var charRewards = (G.队伍 || []).map(function (k) {
            var c = (G.人物 && G.人物[k]) || {};
            return { 名字: c.名字, 图标: c.图标, 经验: exp };
        });

        var result = {
            结束: '战斗胜利', 胜利: true,
            经验: exp, 金钱: money, 威望: wei,
            物品: pre.物品 || [], 人物: charRewards
        };

        var up = {
            '.战况': [['胜负', true]],
            '.战斗动画': true,
            '.战斗结果': result,
            '.经验': newExp,
            '.金钱': newMoney,
            '.威望': newWei
        };
        up['.' + poolName] = pool;
        return { update: up };
    }
    H['战斗'] = function () { return doFight(); };
    H['多次战斗'] = function () { return doFight(); };

    // —— 布阵 ——
    H['保存阵容'] = function (p) {
        var team = g().队伍;
        if (p.team) { try { team = (typeof p.team === 'string') ? JSON.parse(p.team) : p.team; } catch (e) {} }
        return { update: { '.队伍': team } };
    };

    // —— 招募 / 点将：随机给一个角色 ——
    // 仅用已有头像的角色，保证卡面能渲染
    var POOL = [['杨过侠', 'icon-yangguo'], ['小龙女', 'icon-xiaolongnv'], ['郭大侠', 'icon-guojing'], ['金轮国师', 'icon-jinlun']];
    function grantRandomChar() {
        var pick = POOL[Math.floor(Math.random() * POOL.length)];
        var name = pick[0] + Math.floor(Math.random() * 1000);
        var c = makeChar(name, pick[1], { 品质: 4 + (Math.random() < 0.3 ? 1 : 0) });
        return {
            update: {
                ['.人物.' + name]: c,
                '.当前.招募结果': c
            }
        };
    }
    H['招募'] = function () { return grantRandomChar(); };
    H['点将'] = function () { return grantRandomChar(); };

    // —— 强化 / 升级（直接提升，不扣资源） ——
    H['升级装备'] = function () { return {}; };
    H['强化全身装备'] = function () { return {}; };
    H['一键强化装备'] = function () { return {}; };
    H['增强装备'] = function () { return {}; };
    H['升级技能'] = function () { return {}; };
    H['升级卦石'] = function () { return {}; };
    H['突破'] = function () { return {}; };
    H['请求突破'] = function () { return {}; };
    H['转生'] = function () { return {}; };

    // —— 商城 ——
    H['请求商城'] = function () { return {}; };
    H['购买商品'] = function () { return {}; };
    H['刷新商店'] = function () { return {}; };

    // —— 心跳 ——
    H['心跳协议'] = function () { return {}; };

    // ============ 对外接口 ============
    window.LocalServer = {
        handle: function (name, payload, a) {
            var fn = H[name];
            if (fn) {
                var r = fn(payload, a) || {};
                if (r.code === undefined) r.code = 0;
                return r;
            }
            console.warn('[LocalServer] 未实现协议（已默认成功）:', name, payload);
            return { code: 0 };
        },
        persist: function () {
            // 登录后 window.G 是活状态，持久化它；未登录时存种子 S
            try {
                var src = (window.G && window.G.人物) ? window.G : S;
                var snap = {};
                // 剔除引擎/瞬态字段，只存存档相关
                var SKIP = { 未定义: 1, 零: 1, res: 1, startpage: 1, 当前: 1, 战前: 1, 战况: 1, 战斗结果: 1, 战斗动画: 1, 回放: 1, 战况进度: 1 };
                for (var k in src) { if (!SKIP[k] && src.hasOwnProperty(k)) snap[k] = src[k]; }
                localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
            } catch (e) {}
        },
        _save: function () { return (window.G && window.G.人物) ? window.G : S; },
        _reset: function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = freshSave(); }
    };
})();
