/**
 * 本地运行配置 —— 必须在 game-724.js 之前加载
 * 原版 index.html 中由页面提供的全局环境在此补齐
 */

// cocos2d-html5 启动配置（game-724.js 解析时即读取 document.ccConfig）
document.ccConfig = {
    COCOS2D_DEBUG: 0,
    box2d: false,
    chipmunk: false,
    showFPS: false,
    frameRate: 60,
    loadExtension: false,
    renderMode: 1,          // 强制 canvas 渲染
    tag: 'gameCanvas',
    SingleEngineFile: '',
    engineDir: ''
};

// 资源根路径（getRes 会被 patch.js 重写为本地映射，这里仅兜底）
var reshost = 'assets/';

// 单机版：预置登录令牌，跳过账号中心
try {
    if (!localStorage.ac_token) localStorage.ac_token = 'local_hero';
} catch (e) {}
