/**
 * 霸气江湖加强版 - 战斗系统
 * 回合制战斗引擎
 */
const BattleSystem = (function() {
    'use strict';
    const G = GameEngine.G;
    const D = GameData;

    // 战斗状态
    let state = null;

    function startBattle(attackers, defenders, battleType) {
        state = {
            attackers: JSON.parse(JSON.stringify(attackers)), // 我方
            defenders: JSON.parse(JSON.stringify(defenders)), // 敌方
            battleType: battleType || 'normal', // 'normal', 'elite', 'boss'
            turn: 0,
            log: [],
            isOver: false,
            victor: null,
            currentFighter: null,
            atkIdx: 0,
            defIdx: 0,
            rewards: { gold: 0, exp: 0, items: [] },
        };

        // 初始化战斗日志
        addLog('战斗开始！');

        return state;
    }

    function addLog(msg) {
        if (state) {
            state.log.push(msg);
            if (state.log.length > 50) state.log.shift();
        }
    }

    function getSpeedOrder() {
        const fighters = [];
        state.attackers.forEach((a, i) => {
            if (a.hp > 0) fighters.push({ type: 'atk', idx: i, spd: a.spd || 10, char: a });
        });
        state.defenders.forEach((d, i) => {
            if (d.hp > 0) fighters.push({ type: 'def', idx: i, spd: d.spd || 10, char: d });
        });
        fighters.sort((a, b) => b.spd - a.spd);
        return fighters;
    }

    function calcDamage(attacker, defender, skill) {
        let baseDmg = skill.power || attacker.atk * 0.5;
        const atkType = skill.type || '外功';

        // 外功伤害 vs 外功防御，内功伤害 vs 内功防御
        if (atkType === '外功' || atkType === '特殊') {
            baseDmg += attacker.atk * 1.5;
            baseDmg -= defender.def * 0.6;
        }
        if (atkType === '内功' || atkType === '治疗') {
            baseDmg += (attacker.innerAtk || attacker.atk) * 1.5;
            baseDmg -= (defender.innerDef || defender.def) * 0.6;
        }
        if (atkType === '平衡') {
            baseDmg += attacker.atk * 0.8 + (attacker.innerAtk || attacker.atk) * 0.8;
            baseDmg -= defender.def * 0.4 - (defender.innerDef || defender.def) * 0.4;
        }

        // 最小伤害
        baseDmg = Math.max(baseDmg, 5);

        // 暴击
        let crit = false;
        if (Math.random() * 100 < (attacker.crit || 5)) {
            baseDmg *= 1.5;
            crit = true;
        }

        // 闪避
        let dodged = false;
        if (Math.random() * 100 < (defender.dodge || 3)) {
            baseDmg = 0;
            dodged = true;
        }

        // 格挡
        let blocked = false;
        if (!dodged && Math.random() * 100 < (defender.block || 5)) {
            baseDmg *= 0.5;
            blocked = true;
        }

        return { damage: Math.floor(baseDmg), crit, dodged, blocked };
    }

    function executeTurn() {
        if (!state || state.isOver) return null;

        state.turn++;
        const order = getSpeedOrder();
        if (order.length === 0) return null;

        const fighter = order[0];
        const events = [];

        if (fighter.type === 'atk') {
            // 我方攻击
            const atk = state.attackers[fighter.idx];
            const defIdx = Math.floor(Math.random() * state.defenders.filter(d => d.hp > 0).length);
            const livingDefs = state.defenders.map((d, i) => d.hp > 0 ? i : -1).filter(i => i >= 0);
            const targetIdx = livingDefs[Math.floor(Math.random() * livingDefs.length)];

            if (targetIdx !== undefined) {
                const def = state.defenders[targetIdx];
                const skill = getDefaultSkill(atk);
                const result = calcDamage(atk, def, skill);

                applyDamage(def, result.damage);

                let msg = `${atk.name}使用【${skill.name}】攻击${def.name}`;
                if (result.dodged) msg += ' - 闪避！';
                else if (result.blocked) msg += ` - 格挡！造成${result.damage}点伤害`;
                else if (result.crit) msg += ` - 暴击！造成${result.damage}点伤害`;
                else msg += ` - 造成${result.damage}点伤害`;

                if (def.hp <= 0) msg += `，${def.name}阵亡！`;

                addLog(msg);
                events.push({ type: 'attack', attacker: atk.name, defender: def.name, result, skill: skill.name });
            }
        } else {
            // 敌方攻击
            const def = state.defenders[fighter.idx];
            const livingAtks = state.attackers.map((a, i) => a.hp > 0 ? i : -1).filter(i => i >= 0);
            const targetIdx = livingAtks[Math.floor(Math.random() * livingAtks.length)];

            if (targetIdx !== undefined) {
                const atk = state.attackers[targetIdx];
                const skill = { name: '攻击', power: def.atk * 0.8, type: '外功' };
                const result = calcDamage(def, atk, skill);

                applyDamage(atk, result.damage);

                let msg = `${def.name}攻击${atk.name}`;
                if (result.dodged) msg += ' - 闪避！';
                else if (result.blocked) msg += ` - 格挡！造成${result.damage}点伤害`;
                else msg += ` - 造成${result.damage}点伤害`;

                if (atk.hp <= 0) msg += `，${atk.name}阵亡！`;

                addLog(msg);
                events.push({ type: 'defend', attacker: def.name, defender: atk.name, result, skill: '攻击' });
            }
        }

        // Check battle end
        const atkAlive = state.attackers.filter(a => a.hp > 0).length;
        const defAlive = state.defenders.filter(d => d.hp > 0).length;

        if (atkAlive === 0) {
            state.isOver = true;
            state.victor = 'defender';
            addLog('战斗失败...');
            events.push({ type: 'end', result: 'lose' });
        } else if (defAlive === 0) {
            state.isOver = true;
            state.victor = 'attacker';
            addLog('战斗胜利！');
            // Calculate rewards
            state.rewards = calculateRewards();
            events.push({ type: 'end', result: 'win', rewards: state.rewards });
        }

        return events;
    }

    function getDefaultSkill(char) {
        if (char.skills && char.skills.length > 0) {
            const skillId = char.skills[0];
            return D.SKILLS[skillId] || { name: '攻击', power: char.atk * 0.5, type: '外功' };
        }
        return { name: '攻击', power: char.atk * 0.5, type: '外功' };
    }

    function applyDamage(char, dmg) {
        char.hp = Math.max(0, char.hp - dmg);
    }

    function calculateRewards() {
        const totalLevel = state.defenders.reduce((s, d) => s + (d.level || 1), 0);
        return {
            gold: state.defenders.reduce((s, d) => s + (d.goldReward || totalLevel * 5), 0),
            exp: state.defenders.reduce((s, d) => s + (d.expReward || totalLevel * 3), 0),
            items: Math.random() < 0.3 ? [{ name: '装备碎片', qty: 1 }] : [],
        };
    }

    function buildCharacterForBattle(charData) {
        const baseStats = charData.base || {};
        const bonusStats = {};

        // Apply equipment bonuses
        if (charData.equipment) {
            const EQUIP_SLOTS = D.EQUIP_SLOTS;
            EQUIP_SLOTS.forEach(slot => {
                const equipId = charData.equipment[slot];
                if (equipId) {
                    const equip = D.EQUIPMENT[equipId] || G.装备[equipId];
                    if (equip && equip.stats) {
                        Object.keys(equip.stats).forEach(k => {
                            bonusStats[k] = (bonusStats[k] || 0) + equip.stats[k];
                        });
                    }
                }
            });
        }

        return {
            name: charData.name || charData.id,
            hp: baseStats.hp || 200,
            maxHp: baseStats.hp || 200,
            atk: (baseStats.atk || 20) + (bonusStats.atk || 0),
            def: (baseStats.def || 15) + (bonusStats.def || 0),
            innerAtk: (baseStats.innerAtk || baseStats.atk || 20) + (bonusStats.innerAtk || 0),
            innerDef: (baseStats.innerDef || baseStats.def || 15) + (bonusStats.innerDef || 0),
            spd: (baseStats.spd || 10) + (bonusStats.spd || 0),
            crit: (baseStats.crit || 5) + (bonusStats.crit || 0),
            dodge: (baseStats.dodge || 3) + (bonusStats.dodge || 0),
            block: (baseStats.block || 5) + (bonusStats.block || 0),
            combo: (baseStats.combo || 3) + (bonusStats.combo || 0),
            skills: charData.skills || [],
            level: charData.level || 1,
        };
    }

    function buildEnemy(npcData, level) {
        const lvl = npcData.level || level || 1;
        const scale = 1 + (lvl - 1) * 0.1;
        return {
            name: npcData.name,
            hp: Math.floor(npcData.hp * scale),
            maxHp: Math.floor(npcData.hp * scale),
            atk: Math.floor(npcData.atk * scale),
            def: Math.floor((npcData.def || npcData.atk * 0.4) * scale),
            innerAtk: Math.floor(npcData.atk * scale * 0.8),
            innerDef: Math.floor((npcData.def || npcData.atk * 0.4) * scale * 0.8),
            spd: 8 + Math.floor(Math.random() * 5),
            crit: 5,
            dodge: 3,
            block: 5,
            combo: 3,
            level: lvl,
            goldReward: npcData.gold || lvl * 10,
            expReward: npcData.exp || lvl * 5,
        };
    }

    function isOver() { return state ? state.isOver : true; }
    function getVictor() { return state ? state.victor : null; }
    function getState() { return state; }
    function getLog() { return state ? state.log : []; }
    function getRewards() { return state ? state.rewards : null; }

    return {
        startBattle, executeTurn, isOver, getVictor, getState, getLog, getRewards,
        buildCharacterForBattle, buildEnemy, getSpeedOrder,
    };
})();
