#!/usr/bin/env python3
"""资源批量下载脚本 - 从霸气江湖服务器下载所有图片资源"""
import re
import urllib.parse
import subprocess
import os
import sys
import time

# ============ 资源命名规则 ============
charmap = list('0123456789ABCDEF')

def hexname(s):
    """将字符串编码为资源路径的hex格式"""
    a = urllib.parse.quote(s, safe='/')
    b = ''
    c = 0
    d = len(a)
    while c < d:
        e = a[c]
        if e == '%':
            b += a[c+1]
            b += a[c+2]
            c += 3
        elif e == '/':
            b += e
            c += 1
        else:
            ev = ord(e)
            b += charmap[ev // 16]
            b += charmap[ev % 16]
            c += 1
    return b

# ============ 提取资源名称 ============
RESHOST = 'http://res.waveear.com/jianghuplus/'
IMAGE_EXT = 'png'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'assets', 'images')

all_names = set()

source_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'game_source')
for fname in ['game-724.js', 'ui-1092.js', 'level-1106.js']:
    fpath = os.path.join(source_dir, fname)
    if not os.path.exists(fpath):
        print(f'Warning: {fpath} not found')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # getRes("image","xxx")
    matches = re.findall(r"getRes\s*\(\s*['\"]image['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)", content)
    all_names.update(matches)
    
    # {"image":"xxx"}
    if fname == 'ui-1092.js':
        matches2 = re.findall(r'"image":"([^"]+)"', content)
        all_names.update(matches2)

# Filter
filtered = set()
for n in all_names:
    if len(n) < 1 or len(n) > 120:
        continue
    if n.startswith('cc.') or n.startswith('function'):
        continue
    if n.startswith('{') or n.startswith('['):
        continue
    if n.isdigit():
        continue
    has_ch = bool(re.search(r'[\u4e00-\u9fff]', n))
    has_en = bool(re.search(r'[a-zA-Z]', n))
    if has_ch or has_en:
        filtered.add(n)

# Also add TNN items (battle text labels)
tnn_items = "文字_第一场 文字_第二场 文字_第三场 文字_第四场 文字_第五场 文字_第六场 文字_第七场 文字_第八场 文字_第九场 文字_第十场 文字_第十一场 文字_第十二场 文字_第十三场 文字_第十四场 文字_第十五场".split()
filtered.update(tnn_items)

# Also try to add character portraits, skill icons, equipment icons
# by examining the data patterns
with open(os.path.join(source_dir, 'level-1106.js'), 'r', encoding='utf-8') as f:
    content = f.read()
    # NPC names as potential portrait names
    icons = re.findall(r'"图标":"([^"]+)"', content)
    filtered.update(icons)

print(f'Total resources to download: {len(filtered)}')

# ============ 下载函数 ============
os.makedirs(OUTPUT_DIR, exist_ok=True)

success = 0
failed = 0
skipped = 0
total = len(filtered)

USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

for i, name in enumerate(sorted(filtered)):
    path_key = 'image/' + name
    hex_path = hexname(path_key)
    url = f'{RESHOST}{IMAGE_EXT}/{hex_path}.{IMAGE_EXT}'
    
    # Local filename: use hex path as filename (safe for all OS)
    local_name = hex_path.replace('/', '_') + f'.{IMAGE_EXT}'
    local_path = os.path.join(OUTPUT_DIR, local_name)
    
    # Also save name mapping
    mapping_path = os.path.join(OUTPUT_DIR, '_mapping.txt')
    
    # Skip if already exists
    if os.path.exists(local_path):
        skipped += 1
        continue
    
    # Download
    try:
        result = subprocess.run([
            'curl', '-s', '--connect-timeout', '8', '--max-time', '20',
            '-H', f'User-Agent: {USER_AGENT}',
            '-w', '%{http_code}:%{size_download}',
            '-o', local_path, url
        ], capture_output=True, text=True, timeout=25)
        
        status_info = result.stdout.strip()
        if ':' in status_info:
            code, size = status_info.split(':', 1)
            code = int(code)
            size = int(size)
        else:
            code = 0
            size = 0
        
        if code == 200 and size > 0:
            success += 1
            # Save mapping
            with open(mapping_path, 'a', encoding='utf-8') as f:
                f.write(f'{name}\t{local_name}\t{url}\n')
            if success % 50 == 0:
                print(f'Progress: {i+1}/{total} | Success: {success} | Failed: {failed} | Skipped: {skipped}')
        else:
            failed += 1
            # Remove zero-size file
            if os.path.exists(local_path) and os.path.getsize(local_path) == 0:
                os.remove(local_path)
    except Exception as e:
        failed += 1
        if os.path.exists(local_path):
            os.remove(local_path)

# ============ 结果汇总 ============
print(f'\n===== DOWNLOAD COMPLETE =====')
print(f'Total: {total}')
print(f'Success: {success}')
print(f'Failed: {failed}')
print(f'Skipped (already exist): {skipped}')
print(f'Output: {OUTPUT_DIR}')

# Also try downloading audio
audio_dir = os.path.join(os.path.dirname(__file__), 'assets', 'audio')
os.makedirs(audio_dir, exist_ok=True)

audio_urls = [
    (f'{RESHOST}mp3/6D75736963/616C6C32.mp3', 'music_all.mp3'),
]
for url, fname in audio_urls:
    local = os.path.join(audio_dir, fname)
    if not os.path.exists(local):
        subprocess.run(['curl', '-s', '--connect-timeout', '10', '--max-time', '60',
            '-H', f'User-Agent: {USER_AGENT}', '-o', local, url],
            timeout=65)
        print(f'Downloaded audio: {fname}')
