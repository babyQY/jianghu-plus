#!/usr/bin/env python3
"""从 level-1106.js 和 relive-1093.js 提取游戏数据，生成 data.js"""
import re, json, sys, os

source_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'game_source')
output_path = os.path.join(os.path.dirname(__file__), 'src', 'data.js')

# ============ 解析 level-1106.js ============
with open(os.path.join(source_dir, 'level-1106.js'), 'r', encoding='utf-8') as f:
    level_content = f.read()

# 提取 G.普通关卡, G.精英关卡, G.特殊关卡, G.挑战关卡
def extract_js_var(content, var_name):
    """提取JS变量值"""
    pattern = var_name + r'\s*=\s*'
    idx = content.find(var_name + '=')
    if idx == -1:
        idx = content.find(var_name + ' =')
    if idx == -1:
        return None
    # 找到 = 后面的内容
    eq_idx = content.index('=', idx) + 1
    content = content[eq_idx:].strip()
    # 简单处理: 找到匹配的括号
    # 这里我们采用简单策略: eval 整个变量的JSON部分
    return None  # 太复杂, 换个方法

# 使用正则提取章节数据
def find_chapter_data(content, prefix, start_pattern):
    """提取章节数据"""
    chapters = []
    idx = 0
    while True:
        idx = content.find(start_pattern, idx)
        if idx == -1:
            break
        # 找编号
        num_match = re.search(r'"编号"\s*:\s*"(\d+)"', content[idx:idx+2000])
        name_match = re.search(r'"名字"\s*:\s*"([^"]+)"', content[idx:idx+2000])
        desc_match = re.search(r'"说明"\s*:\s*"([^"]*)"', content[idx:idx+2000])
        lvl_match = re.search(r'"等级"\s*:\s*(\d+)', content[idx:idx+2000])
        if num_match and name_match:
            chapters.append({
                'id': num_match.group(1),
                'name': name_match.group(1),
                'desc': desc_match.group(1) if desc_match else '',
                'level': int(lvl_match.group(1)) if lvl_match else 1,
            })
        idx += 2000
    return chapters

print("Extracting chapter data...")

# 普通关卡
normal_chapters = find_chapter_data(level_content, '', '"编号":"001"')
normal_chapters2 = find_chapter_data(level_content, '', '"编号":"002"')
# Better approach: find all chapters
all_chapters = []
idx = 0
while True:
    m = re.search(r'"编号"\s*:\s*"(\d{3})"\s*,\s*"名字"\s*:\s*"([^"]+)"', level_content[idx:])
    if not m:
        break
    idx += m.start() + 1
    cid = m.group(1)
    name = m.group(2)
    # 查找更多信息
    desc = ''
    level = 1
    desc_m = re.search(r'"说明"\s*:\s*"([^"]*)"', level_content[idx:idx+500])
    if desc_m: desc = desc_m.group(1)
    lvl_m = re.search(r'"等级"\s*:\s*(\d+)', level_content[idx:idx+500])
    if lvl_m: level = int(lvl_m.group(1))
    # 检查是否重复
    if not any(c['id'] == cid for c in all_chapters):
        all_chapters.append({'id': cid, 'name': name, 'desc': desc, 'level': level})

print(f"Found {len(all_chapters)} chapters")
for c in all_chapters[:30]:
    print(f"  [{c['id']}] {c['name']} (Lv.{c['level']}) - {c['desc'][:30]}")

# Extract relive data
with open(os.path.join(source_dir, 'relive-1093.js'), 'r', encoding='utf-8') as f:
    relive_content = f.read()

# Find character names from relive data
m = re.search(r'G\.转生\s*=\s*\{([^}]+)\}', relive_content)
if m:
    names_text = m.group(1)
    names = re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', names_text)
    print(f"\nFound {len(names)} rebirth entries")
    for n in names[:20]:
        print(f"  {n[0]} -> {n[1]}")

# Save extracted data to JS file
print("\nGenerating data.js...")

data_js = '''/**
 * 霸气江湖 - 游戏数据
 * 从 level-1106.js / relive-1093.js 提取
 */
const GameData = {
    // 章节数据（从源码提取）
    chapters: ''' + json.dumps(all_chapters[:100], ensure_ascii=False, indent=2) + ''',

    // 品质颜色映射
    qualityColors: {
        '白': '#aaaaaa', '绿': '#8BC34A', '蓝': '#2196F3',
        '紫': '#9C27B0', '橙': '#FF9800', '红': '#F44336'
    },
    qualityNames: ['白', '绿', '蓝', '紫', '橙', '红'],

    // 装备类型
    equipSlots: ['武器', '帽子', '衣服', '鞋子', '宝物', '披风', '暗器'],
    
    // 人物类型
    charTypes: ['外功型', '内功型', '平衡型', '防御型'],
    
    // 武功类型
    skillTypes: ['外功', '内功', '平衡', '治疗', '特殊'],
    
    // 战斗属性
    battleAttrs: ['外功', '内功', '外防', '内防', '生命', '速度', '暴击', '闪避', '格挡', '连击'],
};
'''

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(data_js)

print(f"\nData written to {output_path}")
print(f"File size: {os.path.getsize(output_path)} bytes")
