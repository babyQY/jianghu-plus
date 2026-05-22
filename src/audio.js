/**
 * 霸气江湖 - 音效管理器
 */
const AudioManager = (function() {
    'use strict';
    const G = GameEngine.G;

    let bgmAudio = null;
    let sfxPool = [];
    const MAX_SFX = 5;

    function init() {
        // 加载BGM
        bgmAudio = new Audio('assets/audio/music_all.mp3');
        bgmAudio.loop = true;
        bgmAudio.volume = 0.3;
        bgmAudio.preload = 'auto';

        // 允许用户交互后播放
        document.addEventListener('click', tryPlayBGM, { once: true });
        document.addEventListener('touchstart', tryPlayBGM, { once: true });
    }

    function tryPlayBGM() {
        if (G.设置.音乐 && bgmAudio && bgmAudio.paused) {
            bgmAudio.play().catch(() => {});
        }
    }

    function playBGM() {
        if (!bgmAudio) return;
        if (G.设置.音乐) {
            bgmAudio.play().catch(() => {});
        }
    }

    function stopBGM() {
        if (bgmAudio) {
            bgmAudio.pause();
        }
    }

    function toggleBGM() {
        if (G.设置.音乐) {
            playBGM();
        } else {
            stopBGM();
        }
    }

    function playSFX(type) {
        if (!G.设置.音效) return;

        // 用Web Audio API生成简单音效
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            switch(type) {
                case 'click':
                    playTone(ctx, 800, 0.05, 'sine', 0.3);
                    break;
                case 'battle':
                    playTone(ctx, 200, 0.15, 'sawtooth', 0.4);
                    setTimeout(() => playTone(ctx, 300, 0.1, 'square', 0.3), 150);
                    break;
                case 'win':
                    playTone(ctx, 523, 0.12, 'sine', 0.4);
                    setTimeout(() => playTone(ctx, 659, 0.12, 'sine', 0.4), 120);
                    setTimeout(() => playTone(ctx, 784, 0.2, 'sine', 0.5), 240);
                    break;
                case 'lose':
                    playTone(ctx, 300, 0.15, 'sawtooth', 0.3);
                    setTimeout(() => playTone(ctx, 200, 0.25, 'sawtooth', 0.25), 200);
                    break;
                case 'levelup':
                    playTone(ctx, 440, 0.08, 'sine', 0.3);
                    setTimeout(() => playTone(ctx, 554, 0.08, 'sine', 0.3), 80);
                    setTimeout(() => playTone(ctx, 659, 0.08, 'sine', 0.3), 160);
                    setTimeout(() => playTone(ctx, 880, 0.15, 'sine', 0.5), 240);
                    break;
            }

            // Cleanup context after sounds finish
            setTimeout(() => ctx.close(), 1000);
        } catch(e) {}
    }

    function playTone(ctx, freq, duration, type, volume) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    return {
        init, playBGM, stopBGM, toggleBGM, playSFX,
    };
})();
