// interceptor.js
(() => {
  const SILENT_WAV_BYTES = new Uint8Array([
    82,73,70,70,36,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,68,172,0,0,136,88,1,0,2,0,16,0,100,97,116,97,0,0,0,0
  ]);
  const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

  const getSoundRules = () => {
    try {
      return JSON.parse(localStorage.getItem('wr_soundRules') || '[]');
    } catch (e) {
      return [];
    }
  };

  const checkSoundRule = (url) => {
    if (!url) return { matched: false };
    const rules = getSoundRules();
    if (!rules || rules.length === 0) return { matched: false };

    const lowerUrl = String(url).toLowerCase();
    for (const rule of rules) {
      if (!rule.target) continue;
      const targetClean = rule.target.trim().toLowerCase();
      if (targetClean && lowerUrl.includes(targetClean)) {
        return {
          matched: true,
          replacement: rule.replacement ? rule.replacement : SILENT_AUDIO_URI
        };
      }
    }
    return { matched: false };
  };

  // 1. Intercept fetch (Web Audio / Modern preloader)
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    if (url) {
      const match = checkSoundRule(url);
      if (match.matched) {
        if (match.replacement === SILENT_AUDIO_URI) {
          return Promise.resolve(new Response(SILENT_WAV_BYTES.buffer, {
            status: 200,
            headers: { 'Content-Type': 'audio/wav' }
          }));
        }
        if (typeof input === 'string') {
          input = match.replacement;
        } else if (input && input.url) {
          input = new Request(match.replacement, input);
        }
      }
    }
    return originalFetch.call(this, input, init);
  };

  // 2. Intercept XMLHttpRequest
  const originalXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (typeof url === 'string') {
      const match = checkSoundRule(url);
      if (match.matched) {
        url = match.replacement;
      }
    }
    return originalXHR.call(this, method, url, ...rest);
  };

  // 3. Intercept window.Audio
  const OriginalAudio = window.Audio;
  window.Audio = function (src) {
    if (src) {
      const match = checkSoundRule(src);
      if (match.matched) {
        src = match.replacement;
      }
    }
    return new OriginalAudio(src);
  };
  window.Audio.prototype = OriginalAudio.prototype;

  // 4. Intercept HTMLMediaElement.prototype.src
  const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (originalSrcDescriptor && originalSrcDescriptor.set) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      get: originalSrcDescriptor.get,
      set: function (val) {
        const match = checkSoundRule(val);
        if (match.matched) {
          val = match.replacement;
        }
        return originalSrcDescriptor.set.call(this, val);
      },
      configurable: true,
      enumerable: true
    });
  }

  // 5. Intercept HTMLMediaElement.prototype.play
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (this.src) {
      const match = checkSoundRule(this.src);
      if (match.matched) {
        if (match.replacement === SILENT_AUDIO_URI) {
          this.muted = true;
          this.pause();
          return Promise.resolve();
        } else if (this.src !== match.replacement) {
          this.src = match.replacement;
        }
      }
    }
    return originalPlay.apply(this, arguments);
  };
})();