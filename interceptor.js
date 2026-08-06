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

// interceptor.js
(() => {
  const SILENT_WAV_BYTES = new Uint8Array([
    82,73,70,70,36,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,68,172,0,0,136,88,1,0,2,0,16,0,100,97,116,97,0,0,0,0
  ]);
  const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

  // ─── WEBSOCKET INTERCEPTOR & SPAM PLACE ────────────────────────────────────
  let activeSocket = null;
  let spamActive = false;
  let freePlaces = Array.from({ length: 30 }, (_, i) => i);

  const hookSocket = (ws) => {
    if (activeSocket === ws) return;
    activeSocket = ws;
    ws.addEventListener('message', (e) => {
      let d = e.data;
      if (typeof d !== 'string' || !d.includes('42[')) return;
      try {
        d = JSON.parse(d.slice(2));
        if (d[0] === 'settings' && d[1]?.places) updatePlaces(d[1].places);
        else if (d[0] === 'updatePlaces') updatePlaces(d[1]);
      } catch (err) {}
    });
    ws.addEventListener('close', () => { activeSocket = null; });
  };

  const updatePlaces = (data) => {
    if (!Array.isArray(data)) return;
    freePlaces = [];
    for (let i = 0; i < data.length; i++) {
      if (!data[i]) freePlaces.push(i);
    }
  };

  // Override de la classe WebSocket globale dans le MAIN world
  const _WS = window.WebSocket;
  window.WebSocket = function (...args) {
    const ws = new _WS(...args);
    hookSocket(ws);
    return ws;
  };
  window.WebSocket.prototype = _WS.prototype;

  const _send = window.WebSocket.prototype.send;
  window.WebSocket.prototype.send = new Proxy(_send, {
    apply: (tgt, thisArg, args) => {
      hookSocket(thisArg);
      return tgt.apply(thisArg, args);
    }
  });

  // Loop du Spam Place (20ms)
  setInterval(() => {
    if (spamActive && activeSocket && activeSocket.readyState === 1) {
      const target = freePlaces.length
        ? freePlaces[Math.floor(Math.random() * freePlaces.length)]
        : Math.floor(Math.random() * 20);
      activeSocket.send("42" + JSON.stringify(["updatePlace", { "place": target }]));
    }
  }, 20);

  // Écoute de l'événement en provenance de content.js
  window.addEventListener('WR_TOGGLE_SPAM', (e) => {
    if (e.detail && typeof e.detail.active === 'boolean') {
      spamActive = e.detail.active;
    }
  });

  // ─── AUDIO INTERCEPTOR ──────────────────────────────────────────────────
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

})();