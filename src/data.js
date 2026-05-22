/**
 * 霸气江湖加强版 - 完整游戏数据
 * 从原始源码 level-1106.js, game-724.js, relive-1093.js 提取
 */
const GameData = (function() {
    'use strict';

    // ============ 品质系统 ============
    const QUALITY = {
        names: ['白', '绿', '蓝', '紫', '橙', '红'],
        colors: ['#aaa', '#8BC34A', '#2196F3', '#9C27B0', '#FF9800', '#F44336'],
        getColor: (q) => QUALITY.colors[q] || '#aaa',
        getName: (q) => QUALITY.names[q] || '白',
    };

    const EQUIP_SLOTS = ['武器', '帽子', '衣服', '鞋子', '宝物', '披风', '暗器'];
    const CHAR_TYPES = ['外功型', '内功型', '平衡型', '防御型'];
    const SKILL_TYPES = ['外功', '内功', '平衡', '治疗', '特殊'];

    // ============ 人物数据 ============
    const CHARACTERS = {
        // 主角（玩家帮主）
        '帮主': { id: '帮主', name: '帮主', quality: 3, type: '平衡型', desc: '江湖新秀，潜力无限', base: { hp: 300, atk: 30, def: 20, innerAtk: 30, innerDef: 20, spd: 10, crit: 5, dodge: 5, block: 5, combo: 5 }},
        // 初始弟子
        '郭大傻': { id: '郭大傻', name: '郭大傻', quality: 1, type: '防御型', desc: '忠厚老实，外功了得', base: { hp: 350, atk: 25, def: 30, innerAtk: 15, innerDef: 25, spd: 5, crit: 3, dodge: 3, block: 8, combo: 3 }},
        '黄灵蓉': { id: '黄灵蓉', name: '黄灵蓉', quality: 2, type: '内功型', desc: '聪慧过人，武功精妙', base: { hp: 250, atk: 20, def: 15, innerAtk: 40, innerDef: 20, spd: 12, crit: 8, dodge: 5, block: 3, combo: 5 }},
        '独孤冲': { id: '独孤冲', name: '独孤冲', quality: 2, type: '外功型', desc: '剑术超群，快意恩仇', base: { hp: 280, atk: 45, def: 18, innerAtk: 18, innerDef: 15, spd: 10, crit: 10, dodge: 4, block: 3, combo: 7 }},
        '东方无敌': { id: '东方无敌', name: '东方无敌', quality: 3, type: '平衡型', desc: '魔教教主，武功盖世', base: { hp: 320, atk: 35, def: 22, innerAtk: 35, innerDef: 22, spd: 15, crit: 7, dodge: 6, block: 4, combo: 6 }},
        '洪逍遥': { id: '洪逍遥', name: '洪逍遥', quality: 2, type: '内功型', desc: '逍遥自在，北冥神功', base: { hp: 260, atk: 18, def: 15, innerAtk: 42, innerDef: 22, spd: 11, crit: 6, dodge: 7, block: 2, combo: 5 }},
        '小宝': { id: '小宝', name: '小宝', quality: 1, type: '平衡型', desc: '机智过人，福缘深厚', base: { hp: 270, atk: 22, def: 18, innerAtk: 22, innerDef: 18, spd: 8, crit: 4, dodge: 8, block: 4, combo: 4 }},
        '张无情': { id: '张无情', name: '张无情', quality: 2, type: '防御型', desc: '内功深厚，防御惊人', base: { hp: 380, atk: 20, def: 35, innerAtk: 20, innerDef: 35, spd: 4, crit: 3, dodge: 2, block: 10, combo: 2 }},
        '风剑仙': { id: '风剑仙', name: '风剑仙', quality: 3, type: '外功型', desc: '独孤九剑，天下无双', base: { hp: 290, atk: 50, def: 18, innerAtk: 15, innerDef: 15, spd: 13, crit: 12, dodge: 6, block: 2, combo: 8 }},
        '小香儿': { id: '小香儿', name: '小香儿', quality: 1, type: '治疗型', desc: '温柔善良，医术高明', base: { hp: 240, atk: 12, def: 12, innerAtk: 28, innerDef: 18, spd: 9, crit: 3, dodge: 4, block: 2, combo: 3 }},
        '任逆天': { id: '任逆天', name: '任逆天', quality: 3, type: '内功型', desc: '吸星大法，霸道无比', base: { hp: 300, atk: 20, def: 18, innerAtk: 48, innerDef: 25, spd: 10, crit: 7, dodge: 4, block: 3, combo: 6 }},
        '龙玲珑': { id: '龙玲珑', name: '龙玲珑', quality: 2, type: '平衡型', desc: '古墓传人，玉女心经', base: { hp: 275, atk: 28, def: 20, innerAtk: 28, innerDef: 20, spd: 11, crit: 6, dodge: 5, block: 3, combo: 5 }},
        '林超贤': { id: '林超贤', name: '林超贤', quality: 1, type: '外功型', desc: '华山弟子，剑法精进', base: { hp: 260, atk: 35, def: 16, innerAtk: 14, innerDef: 14, spd: 10, crit: 7, dodge: 4, block: 3, combo: 5 }},
        '刁蛮郡主': { id: '刁蛮郡主', name: '刁蛮郡主', quality: 2, type: '内功型', desc: '郡主之尊，武功不俗', base: { hp: 250, atk: 18, def: 16, innerAtk: 38, innerDef: 20, spd: 10, crit: 5, dodge: 5, block: 3, combo: 4 }},
        '陈近南': { id: '陈近南', name: '陈近南', quality: 2, type: '平衡型', desc: '天地会总舵主，忠义无双', base: { hp: 300, atk: 30, def: 22, innerAtk: 25, innerDef: 22, spd: 8, crit: 5, dodge: 4, block: 5, combo: 4 }},
        '雪山姥姥': { id: '雪山姥姥', name: '雪山姥姥', quality: 1, type: '防御型', desc: '雪山派掌门，沉着冷静', base: { hp: 350, atk: 18, def: 32, innerAtk: 22, innerDef: 28, spd: 5, crit: 3, dodge: 2, block: 8, combo: 2 }},
        '白发顽童': { id: '白发顽童', name: '白发顽童', quality: 2, type: '平衡型', desc: '童心未泯，左右互搏', base: { hp: 280, atk: 32, def: 20, innerAtk: 30, innerDef: 20, spd: 12, crit: 8, dodge: 6, block: 3, combo: 6 }},
        '王神通': { id: '王神通', name: '王神通', quality: 2, type: '内功型', desc: '全真教掌门，道法自然', base: { hp: 270, atk: 20, def: 18, innerAtk: 42, innerDef: 24, spd: 9, crit: 6, dodge: 4, block: 3, combo: 5 }},
        '鸠小智': { id: '鸠小智', name: '鸠小智', quality: 3, type: '内功型', desc: '吐蕃国师，火焰刀法', base: { hp: 310, atk: 22, def: 20, innerAtk: 45, innerDef: 24, spd: 10, crit: 7, dodge: 4, block: 3, combo: 6 }},
        '扫地神僧': { id: '扫地神僧', name: '扫地神僧', quality: 4, type: '平衡型', desc: '少林绝顶高手，深不可测', base: { hp: 400, atk: 45, def: 35, innerAtk: 45, innerDef: 35, spd: 8, crit: 8, dodge: 5, block: 8, combo: 6 }},
        '张三丰': { id: '张三丰', name: '张三丰', quality: 4, type: '内功型', desc: '武当祖师，太极宗师', base: { hp: 380, atk: 38, def: 30, innerAtk: 55, innerDef: 35, spd: 7, crit: 7, dodge: 8, block: 6, combo: 5 }},
        '达摩': { id: '达摩', name: '达摩', quality: 5, type: '平衡型', desc: '少林祖师，武学之祖', base: { hp: 500, atk: 55, def: 40, innerAtk: 55, innerDef: 40, spd: 6, crit: 10, dodge: 5, block: 10, combo: 8 }},
    };

    // ============ 武功数据 ============
    const SKILLS = {
        '普通攻击': { id: '普通攻击', name: '普通攻击', quality: 0, type: '外功', desc: '基础的拳脚功夫', power: 30, mp: 0 },
        '铁砂掌': { id: '铁砂掌', name: '铁砂掌', quality: 1, type: '外功', desc: '刚猛的外家掌法', power: 55, mp: 10 },
        '追魂剑法': { id: '追魂剑法', name: '追魂剑法', quality: 1, type: '外功', desc: '快如闪电的剑术', power: 60, mp: 12 },
        '大力金刚指': { id: '大力金刚指', name: '大力金刚指', quality: 1, type: '外功', desc: '少林绝技', power: 65, mp: 15 },
        '霹雳剑法': { id: '霹雳剑法', name: '霹雳剑法', quality: 2, type: '外功', desc: '威势如雷的剑法', power: 80, mp: 18 },
        '烈焰刀': { id: '烈焰刀', name: '烈焰刀', quality: 2, type: '外功', desc: '火焰般的刀法', power: 85, mp: 20 },
        '泰山压顶': { id: '泰山压顶', name: '泰山压顶', quality: 2, type: '外功', desc: '力道千钧', power: 90, mp: 22 },
        '狮子吼': { id: '狮子吼', name: '狮子吼', quality: 2, type: '外功', desc: '少林绝学，声震四野', power: 88, mp: 20 },
        '空灵拳': { id: '空灵拳', name: '空灵拳', quality: 3, type: '外功', desc: '以柔克刚的拳法', power: 110, mp: 25 },
        '万剑诀': { id: '万剑诀', name: '万剑诀', quality: 3, type: '外功', desc: '剑宗至高绝学', power: 130, mp: 30 },
        '独孤九剑': { id: '独孤九剑', name: '独孤九剑', quality: 4, type: '外功', desc: '破尽天下武功', power: 160, mp: 35 },
        '升龙掌': { id: '升龙掌', name: '升龙掌', quality: 3, type: '外功', desc: '丐帮绝学，降龙十八掌', power: 140, mp: 32 },

        '紫霞功': { id: '紫霞功', name: '紫霞功', quality: 1, type: '内功', desc: '华山派内功心法', power: 55, mp: 10 },
        '峨眉心法': { id: '峨眉心法', name: '峨眉心法', quality: 1, type: '内功', desc: '峨眉派武学', power: 60, mp: 12 },
        '纯阳无极功': { id: '纯阳无极功', name: '纯阳无极功', quality: 2, type: '内功', desc: '武当内功心法', power: 80, mp: 18 },
        '金钟罩': { id: '金钟罩', name: '金钟罩', quality: 2, type: '内功', desc: '少林护体神功', power: 75, mp: 15, defense: 20 },
        '破功大法': { id: '破功大法', name: '破功大法', quality: 2, type: '内功', desc: '破解对手防御', power: 85, mp: 20 },
        '焚心掌': { id: '焚心掌', name: '焚心掌', quality: 3, type: '内功', desc: '焚心之痛，痛彻心扉', power: 105, mp: 25 },
        '向日神功': { id: '向日神功', name: '向日神功', quality: 3, type: '内功', desc: '魔教镇教神功', power: 120, mp: 28 },
        '先天功': { id: '先天功', name: '先天功', quality: 3, type: '内功', desc: '全真教最高心法', power: 115, mp: 26 },
        '北冥神功': { id: '北冥神功', name: '北冥神功', quality: 4, type: '内功', desc: '吸人内力为己用', power: 150, mp: 35 },
        '九阴真经': { id: '九阴真经', name: '九阴真经', quality: 4, type: '内功', desc: '武林至高宝典', power: 170, mp: 40 },
        '九阳真经': { id: '九阳真经', name: '九阳真经', quality: 5, type: '内功', desc: '至阳至刚的内功', power: 200, mp: 45 },

        '分筋错骨手': { id: '分筋错骨手', name: '分筋错骨手', quality: 1, type: '平衡', desc: '近身擒拿功夫', power: 55, mp: 10 },
        '三花聚顶': { id: '三花聚顶', name: '三花聚顶', quality: 2, type: '平衡', desc: '全真教绝学', power: 75, mp: 18 },
        '金刚不坏体': { id: '金刚不坏体', name: '金刚不坏体', quality: 3, type: '平衡', desc: '刀枪不入', power: 100, mp: 25, defense: 30 },
        '乾坤大挪移': { id: '乾坤大挪移', name: '乾坤大挪移', quality: 4, type: '平衡', desc: '转移伤害反击', power: 140, mp: 35 },

        '亦枯亦荣': { id: '亦枯亦荣', name: '亦枯亦荣', quality: 1, type: '治疗', desc: '枯荣转换，恢复生命', power: 40, mp: 15, heal: 80 },
        '美女心法': { id: '美女心法', name: '美女心法', quality: 2, type: '治疗', desc: '古墓派疗伤心法', power: 50, mp: 20, heal: 120 },
        '般若心经': { id: '般若心经', name: '般若心经', quality: 2, type: '治疗', desc: '佛门疗伤圣典', power: 55, mp: 22, heal: 150 },
        '神照经': { id: '神照经', name: '神照经', quality: 3, type: '治疗', desc: '起死回生的神功', power: 65, mp: 28, heal: 200 },

        '毒龙鞭法': { id: '毒龙鞭法', name: '毒龙鞭法', quality: 3, type: '特殊', desc: '鞭上淬毒', power: 100, mp: 25, poison: 3 },
        '化骨绵掌': { id: '化骨绵掌', name: '化骨绵掌', quality: 3, type: '特殊', desc: '阴毒掌法', power: 95, mp: 22, poison: 5 },
        '吸星大法': { id: '吸星大法', name: '吸星大法', quality: 4, type: '特殊', desc: '吸取对手内力', power: 130, mp: 30, drain: 15 },
        '七伤拳': { id: '七伤拳', name: '七伤拳', quality: 4, type: '特殊', desc: '伤敌一千自损八百', power: 160, mp: 35, selfDmg: 20 },
        '全真九剑': { id: '全真九剑', name: '全真九剑', quality: 2, type: '外功', desc: '全真教剑法绝学', power: 75, mp: 18 },
        '袈裟伏魔功': { id: '袈裟伏魔功', name: '袈裟伏魔功', quality: 2, type: '内功', desc: '佛门降魔功法', power: 78, mp: 18 },
        '擒龙功': { id: '擒龙功', name: '擒龙功', quality: 3, type: '外功', desc: '霸道掌法', power: 125, mp: 30 },
        '权倾朝野': { id: '权倾朝野', name: '权倾朝野', quality: 3, type: '平衡', desc: '王朝绝学', power: 115, mp: 28 },
        '真一指禅': { id: '真一指禅', name: '真一指禅', quality: 4, type: '外功', desc: '少林真传一指', power: 165, mp: 38 },
    };

    // ============ 装备数据 ============
    const EQUIPMENT = {
        // 武器
        '铁剑': { id: '铁剑', name: '铁剑', quality: 0, slot: '武器', stats: { atk: 10 } },
        '白虹剑': { id: '白虹剑', name: '白虹剑', quality: 1, slot: '武器', stats: { atk: 20 } },
        '珊瑚金杖': { id: '珊瑚金杖', name: '珊瑚金杖', quality: 2, slot: '武器', stats: { atk: 35, innerAtk: 10 } },
        '伏魔禅杖': { id: '伏魔禅杖', name: '伏魔禅杖', quality: 3, slot: '武器', stats: { atk: 55, innerAtk: 15 } },
        '绣花针': { id: '绣花针', name: '绣花针', quality: 3, slot: '武器', stats: { atk: 45, spd: 15 } },
        '屠龙刀': { id: '屠龙刀', name: '屠龙刀', quality: 4, slot: '武器', stats: { atk: 80, combo: 10 } },
        '倚天剑': { id: '倚天剑', name: '倚天剑', quality: 4, slot: '武器', stats: { atk: 75, crit: 15 } },
        // 帽子
        '斗笠': { id: '斗笠', name: '斗笠', quality: 0, slot: '帽子', stats: { def: 5 } },
        '侠士巾': { id: '侠士巾', name: '侠士巾', quality: 1, slot: '帽子', stats: { def: 12, innerDef: 5 } },
        '乾坤玉冠': { id: '乾坤玉冠', name: '乾坤玉冠', quality: 3, slot: '帽子', stats: { def: 30, innerDef: 20 } },
        // 衣服
        '布衣': { id: '布衣', name: '布衣', quality: 0, slot: '衣服', stats: { def: 5, innerDef: 3 } },
        '侠士袍': { id: '侠士袍', name: '侠士袍', quality: 1, slot: '衣服', stats: { def: 15, innerDef: 8 } },
        '游凰铠': { id: '游凰铠', name: '游凰铠', quality: 3, slot: '衣服', stats: { def: 35, innerDef: 25 } },
        '百战披风': { id: '百战披风', name: '百战披风', quality: 2, slot: '披风', stats: { def: 15, dodge: 5 } },
        '太和宝靴': { id: '太和宝靴', name: '太和宝靴', quality: 2, slot: '鞋子', stats: { spd: 10, dodge: 5 } },
        '燕国玉玺': { id: '燕国玉玺', name: '燕国玉玺', quality: 3, slot: '宝物', stats: { innerAtk: 20, innerDef: 15 } },
    };

    // ============ 关卡数据 ============
    const CHAPTERS = [
        { id: '001', name: '洛阳集市', desc: '新手教程，齐聚洛阳', level: 1, stages: 10 },
        { id: '002', name: '燕子坞', desc: '百花坞慕容家', level: 5, stages: 15 },
        { id: '003', name: '恶人谷', desc: '西夏武士与四大恶人', level: 10, stages: 20 },
        { id: '004', name: '孤山梅庄', desc: '麻将主题', level: 15, stages: 20 },
        { id: '005', name: '杏子林', desc: '丐帮大会', level: 20, stages: 20 },
        { id: '006', name: '少林寺', desc: '少林各殿', level: 25, stages: 25 },
        { id: '007', name: '醉仙楼', desc: '酒馆赌场', level: 35, stages: 20 },
        { id: '008', name: '绝情谷', desc: '公孙家与杨过', level: 40, stages: 20 },
        { id: '009', name: '光明顶', desc: '明教五行旗', level: 45, stages: 20 },
        { id: '010', name: '飘渺峰', desc: '灵鹫宫天山', level: 55, stages: 20 },
        { id: '011', name: '全真教', desc: '终南山重阳宫', level: 60, stages: 15 },
        { id: '012', name: '汝阳王府', desc: '王府侍卫', level: 65, stages: 15 },
        { id: '013', name: '黑木崖', desc: '魔教神教', level: 70, stages: 15 },
        { id: '014', name: '大宋皇宫', desc: '守城官兵', level: 50, stages: 25 },
        { id: '015', name: '侠骨柔情', desc: '武林大会', level: 55, stages: 25 },
        { id: '016', name: '龙脉宝藏', desc: '康熙天地会', level: 85, stages: 25 },
        { id: '017', name: '末世·洛阳集市', desc: '噩梦模式', level: 100, stages: 10 },
        { id: '018', name: '末世·燕子坞', desc: '噩梦模式', level: 105, stages: 15 },
        { id: '019', name: '末世·恶人谷', desc: '噩梦模式', level: 110, stages: 20 },
        { id: '020', name: '末世·孤山梅庄', desc: '噩梦模式', level: 115, stages: 20 },
        { id: '021', name: '末世·杏子林', desc: '玩家彩蛋', level: 110, stages: 15 },
        { id: '022', name: '末世·少林寺', desc: '玩家彩蛋', level: 130, stages: 20 },
        { id: '023', name: '末世·绝情谷', desc: '华山战场', level: 130, stages: 9 },
        { id: '024', name: '末世·醉仙楼', desc: '玩家彩蛋', level: 130, stages: 13 },
    ];

    // ============ NPC数据 ============
    const NPCS = [
        { name: '官兵', level: 1, hp: 100, atk: 10, def: 5, gold: 20, exp: 10 },
        { name: '恶霸', level: 2, hp: 150, atk: 15, def: 8, gold: 30, exp: 15 },
        { name: '西夏武士', level: 5, hp: 250, atk: 25, def: 12, gold: 40, exp: 25 },
        { name: '丐帮弟子', level: 8, hp: 300, atk: 30, def: 15, gold: 50, exp: 30 },
        { name: '峨眉弟子', level: 10, hp: 350, atk: 35, def: 18, gold: 60, exp: 40 },
        { name: '少林武僧', level: 12, hp: 400, atk: 40, def: 22, gold: 70, exp: 50 },
        { name: '魔教弟子', level: 15, hp: 500, atk: 50, def: 25, gold: 80, exp: 60 },
        { name: '王府侍卫', level: 18, hp: 600, atk: 55, def: 30, gold: 90, exp: 70 },
        { name: '汝阳精兵', level: 20, hp: 700, atk: 60, def: 35, gold: 100, exp: 80 },
        { name: '宋将', level: 22, hp: 800, atk: 70, def: 40, gold: 120, exp: 100 },
        { name: '东方无敌', level: 30, hp: 1500, atk: 120, def: 60, gold: 300, exp: 200 }, // Boss
        { name: '欧阳雄霸', level: 28, hp: 1200, atk: 100, def: 50, gold: 250, exp: 180 },
        { name: '觉悟大师', level: 25, hp: 1000, atk: 80, def: 55, gold: 200, exp: 150 },
        { name: '空见神僧', level: 32, hp: 1800, atk: 130, def: 70, gold: 350, exp: 220 },
        { name: '金毛狮王', level: 35, hp: 2000, atk: 150, def: 75, gold: 400, exp: 250 },
        { name: '达摩老祖', level: 50, hp: 5000, atk: 300, def: 150, gold: 1000, exp: 500 },
    ];

    // 通天塔高层专属NPC（每5层切换一组）
    const TOWER_NPCS = [
        { floorRange: [1, 5],   npcs: ['官兵', '恶霸', '丐帮弟子'], boss: '西夏武士' },
        { floorRange: [6, 10],  npcs: ['峨眉弟子', '少林武僧', '王府侍卫'], boss: '觉悟大师' },
        { floorRange: [11, 15], npcs: ['汝阳精兵', '宋将', '魔教弟子'], boss: '欧阳雄霸' },
        { floorRange: [16, 20], npcs: ['东方无敌', '空见神僧', '金毛狮王'], boss: '东方无敌' },
        { floorRange: [21, 30], npcs: ['金毛狮王', '达摩老祖', '东方无敌'], boss: '达摩老祖' },
    ];

    // 古墓Boss数据
    const GUMU_BOSSES = [
        { name: '黑风双煞', levels: [15, 25, 35], drops: ['分筋错骨手', '全真九剑', '铁砂掌'] },
        { name: '带头大哥', levels: [18, 28, 38], drops: ['袈裟伏魔功', '大力金刚指', '紫霞功'] },
        { name: '绝情师太', levels: [20, 30, 40], drops: ['峨眉心法', '霹雳剑法', '美女心法'] },
        { name: '觉悟大师', levels: [22, 32, 42], drops: ['亦枯亦荣', '铁砂掌', '般若心经'] },
        { name: '金毛狮王', levels: [25, 35, 45], drops: ['狮子吼', '金钟罩', '金刚不坏体'] },
        { name: '神雕侠侣', levels: [28, 38, 48], drops: ['焚心掌', '空灵拳', '九阴真经'] },
        { name: '东方无敌', levels: [30, 40, 50], drops: ['向日神功', '擒龙功', '吸星大法'] },
        { name: '达摩老祖', levels: [35, 45, 55], drops: ['权倾朝野', '真一指禅', '九阳真经'] },
    ];

    // ============ 商城物品 ============
    const SHOP_ITEMS = [
        { name: '体力丹', desc: '恢复50点体力', cost: 20, type: '道具', currency: '元宝' },
        { name: '招募令', desc: '招募随机弟子', cost: 100, type: '道具', currency: '元宝' },
        { name: '橙装碎片袋', desc: '随机橙色装备碎片', cost: 200, type: '道具', currency: '元宝' },
        { name: '经验圣水', desc: '增加1000经验', cost: 50, type: '道具', currency: '元宝' },
        { name: '改名令', desc: '给弟子改名', cost: 30, type: '道具', currency: '元宝' },
    ];

    return {
        QUALITY, EQUIP_SLOTS, CHAR_TYPES, SKILL_TYPES,
        CHARACTERS, SKILLS, EQUIPMENT,
        CHAPTERS, NPCS, SHOP_ITEMS,
        TOWER_NPCS, GUMU_BOSSES,
    };
})();
