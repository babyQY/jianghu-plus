/**
 * LocalServer —— 本地伪服务器（单机版核心）
 * 职责：凭空造出一份完整初始存档，并处理原版 146 个协议，
 *      返回 {code, update:{路径:值}, remove:[...], jumpto:...} 增量给 dataChange。
 *
 * 约定：
 *   - code 缺省视为成功；code===100 在原版表示会话过期会触发重登，禁止返回。
 *   - 单机版理念：无限资源、去充值限制。充值类直接成功并加满；消耗类不扣或返回上限。
 */
(function () {
    'use strict';

    var SAVE_KEY = 'jianghu_native_save';

    // ============ 初始存档播种（最小可用，后续按 UI 绑定逐步补全） ============
    function freshSave() {
        return {
            // —— 账号 / 区服 ——
            session_id: 'local',
            编号: '100001',
            名字: '帮主',
            等级: 1,
            create_time: Math.floor(Date.now() / 1000),
            serverID: 'app_1013',
            viplevel: 15,
            vip: 15,

            // —— 资源（无限） ——
            元宝: 99999999,
            金钱: 99999999,
            体力: 9999,
            体力上限: 9999,
            经验: 0,

            // —— 玩法计数 ——
            次数: {},
            每日次数: {},
            累积次数: {},

            // —— 队伍 / 人物 / 背包 ——
            队伍: [],
            人物: {},
            装备: {},
            武功: {},
            道具: {},
            魂魄: {},
            卦石: {},
            材料: {},

            // —— 进度 ——
            普通关卡进度: {},
            精英关卡进度: {},
            挑战关卡进度: {},
            特殊关卡进度: {},
            每日任务进度: { 积分: 0 },

            每日奖励已领: ''
        };
    }

    // 当前内存中的存档
    var S = null;

    function load() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (raw) { S = JSON.parse(raw); return; }
        } catch (e) {}
        S = freshSave();
    }
    load();

    // ============ 协议处理表 ============
    // 每个处理函数签名：(payload, a) => {update?, remove?, jumpto?} 或 undefined
    var H = {};

    // 登录 / 进入游戏：一次性下发整份存档，并跳转到主界面
    H['进入游戏'] = function () {
        return {
            update: { '.': S },
            jumpto: '首页'
        };
    };

    // 个人信息：原版每次进入主界面会拉一次，这里同样回传整份存档
    H['个人信息'] = function () {
        return { update: { '.': S } };
    };

    // 充值：单机版直接成功（元宝已无限，无需真正加），不弹支付
    H['充值'] = function () {
        return {};
    };

    // ============ 对外接口 ============
    window.LocalServer = {
        // 供 patch.js 调用
        handle: function (name, payload, a) {
            var fn = H[name];
            if (fn) {
                var r = fn(payload, a) || {};
                if (r.code === undefined) r.code = 0;
                return r;
            }
            // 未实现的协议：默认成功（占位，避免阻塞 UI），后续逐个补全
            console.warn('[LocalServer] 未实现协议（已默认成功）:', name, payload);
            return { code: 0 };
        },

        persist: function () {
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
        },

        // 调试用
        _save: function () { return S; },
        _reset: function () {
            S = freshSave();
            this.persist();
        }
    };
})();
