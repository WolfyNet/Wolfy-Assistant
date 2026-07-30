(() => {
  console.log('🐺 Wolfy Assistant chargé !');

  // ─── STATE ────────────────────────────────────────────────────────────────
  const STATE = {
    isOpen: false,
    players: [],
    excluded: new Set(),
    lastResult: null,
    autoNext: localStorage.getItem('wr_autoNext') === 'true',
  };

  // ─── STYLES CSS INJECTION ────────────────────────────────────────────────
  const injectStyles = () => {
    if (document.getElementById('wr-styles')) return;

    const style = document.createElement('style');
    style.id = 'wr-styles';
    style.textContent = `
      #wr-root input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border: 2px solid #5c5270;
        border-radius: 5px;
        outline: none;
        cursor: pointer;
        position: relative;
        background: #1e1b2e;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      #wr-root input[type="checkbox"]:hover {
        border-color: #8a73ff;
      }

      #wr-root input[type="checkbox"]:checked {
        background: #7c4dff;
        border-color: #7c4dff;
      }

      #wr-root input[type="checkbox"]:checked::after {
        content: '✓';
        position: absolute;
        color: #ffffff;
        font-size: 13px;
        font-weight: bold;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -55%);
      }

      .wr-player-item, .wr-setting-item {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        padding: 4px 6px;
        border-radius: 4px;
        transition: background 0.15s ease;
      }

      .wr-player-item:hover, .wr-setting-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .wr-player-item.is-excluded span {
        opacity: 0.5;
        text-decoration: line-through;
      }
    `;
    document.head.appendChild(style);
  };

  // ─── LOG DES MORTS ────────────────────────────────────────────────────────
  const DEATH_LOG = [];

  const addDeathEntry = (name, role, message) => {
    if (DEATH_LOG.some(e => e.name === name)) return;
    const now  = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    DEATH_LOG.unshift({ name, role: role || null, message, time });
    renderDeathLog();
  };

// ─── AUTO NEXT GAME (UNIVERSEL & PARFAITEMENT SIMULÉ) ─────────────────────
  let isClickingNext = false;

  const simulateHumanClick = (element) => {
    if (!element) return;
    
    // Pour React, un clic scripté est ignoré si 'buttons' n'est pas 1 (clic gauche).
    const eventOptions = {
      view: window,
      bubbles: true,
      cancelable: true,
      button: 0,   // Bouton principal (gauche)
      buttons: 1,  // Clic maintenu (crucial pour tromper React)
      composed: true
    };

    ['pointerover', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(eventType => {
      element.dispatchEvent(new MouseEvent(eventType, eventOptions));
    });
  };

  const tryAutoNext = () => {
    if (!STATE.autoNext || isClickingNext) return;

    // Utilisation de XPath : la méthode la plus rapide et puissante pour trouver un texte exact,
    // peu importe sa balise ou sa classe CSS (Spectateur, Fin de partie, etc.)
    const findExactTextNode = (text) => {
      const xpath = `//text()[normalize-space(.)='${text}']/parent::*`;
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };

    // On cherche "Partie suivante" (ou "Rejouer" au cas où l'interface change)
    const targetText = findExactTextNode('Partie suivante') || findExactTextNode('Rejouer');

    if (!targetText) return;

    isClickingNext = true;
    console.log('[Wolfy] 🎯 Bouton détecté (Spectateur ou Fin de jeu), tentative de clic...');

    // On remonte au bouton parent (soit un <button>, soit un div avec une classe "Button" ou "button")
    const buttonDiv = targetText.closest('button, [class*="Button"], [class*="button"]') || targetText;

    // On simule le clic humain sur le texte ET sur le parent
    simulateHumanClick(targetText);
    if (buttonDiv !== targetText) simulateHumanClick(buttonDiv);

    // Verrou de 3 secondes pour ne pas spammer pendant l'écran de chargement
    setTimeout(() => {
      isClickingNext = false;
    }, 3000);
  };

  // ─── OBSERVER DU DOM ─────────────────────────────────────────────────────
  const tryParseDeath = (node) => {
    const deathBox = node.matches?.('[data-sentry-component="Death"]')
      ? node
      : node.querySelector?.('[data-sentry-component="Death"]');

    const target = deathBox || node.querySelector?.('[class*="__death"]');
    if (!target) return;

    const nameEl = target.querySelector('[class*="__username"]');
    if (!nameEl) return;
    const name = nameEl.textContent.trim();
    if (!name) return;

    const roleEl = target.querySelector('[class*="__role"]');
    const role   = roleEl ? roleEl.textContent.trim() : null;

    const infoEl  = target.querySelector('[class*="__infoMessage"]') || target;
    const message = infoEl.textContent.trim();

    addDeathEntry(name, role, message);
  };

  const startDOMObserver = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          tryParseDeath(node);
        });
      });
      tryAutoNext();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(tryAutoNext, 800);
  };

  // ─── PLAYER SCAN ──────────────────────────────────────────────────────────
  const scanPlayersFromDOM = () => {
    const elements = document.querySelectorAll('[class*="Character-module"][class*="username"]');
    const foundPlayers = Array.from(elements)
      .map(el => el.textContent.trim())
      .filter(name => name.length > 0);

    STATE.players = [...new Set(foundPlayers)];

    for (const excludedName of STATE.excluded) {
      if (!STATE.players.includes(excludedName)) STATE.excluded.delete(excludedName);
    }
  };

  // ─── DRAW ─────────────────────────────────────────────────────────────────
  const drawRandomPlayer = () => {
    const eligiblePlayers = STATE.players.filter(p => !STATE.excluded.has(p));
    if (eligiblePlayers.length === 0) {
      STATE.lastResult = 'Aucun joueur éligible';
      render();
      return;
    }

    let turns = 0;
    const resultEl = document.querySelector('.wr-result');
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * eligiblePlayers.length);
      if (resultEl) resultEl.textContent = eligiblePlayers[idx];
      turns++;
      if (turns > 10) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * eligiblePlayers.length);
        STATE.lastResult = eligiblePlayers[finalIndex];
        render();
      }
    }, 50);
  };

  // ─── RENDER DEATH LOG ─────────────────────────────────────────────────────
  const renderDeathLog = () => {
    const container = document.querySelector('.wr-death-list');
    if (!container) return;

    if (DEATH_LOG.length === 0) {
      container.innerHTML = `<div class="wr-empty-state">Aucune mort détectée pour l'instant.<br>Le log se remplit automatiquement.</div>`;
      return;
    }

    container.innerHTML = DEATH_LOG.map((entry, i) => `
      <div class="wr-death-row" style="--delay:${i * 40}ms">
        <span class="wr-death-skull">💀</span>
        <div class="wr-death-details">
          <div class="wr-death-header">
            <span class="wr-death-name">${entry.name}</span>
            ${entry.role ? `<span class="wr-death-role">${entry.role}</span>` : ''}
            <span class="wr-death-time">${entry.time}</span>
          </div>
          <div class="wr-death-msg">${entry.message}</div>
        </div>
      </div>
    `).join('');
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const render = () => {
    const root = document.getElementById('wr-root');
    if (!root) return;

    root.className = STATE.isOpen ? 'is-open' : '';

    const listContainer   = root.querySelector('.wr-players');
    const resultContainer = root.querySelector('.wr-result');
    const drawBtn         = root.querySelector('.wr-draw-btn');

    if (STATE.players.length === 0) {
      listContainer.innerHTML = `<div class="wr-empty-state">Aucun joueur détecté sur le plateau. Lance une partie et actualise.</div>`;
      drawBtn.disabled = true;
    } else {
      drawBtn.disabled = false;
      listContainer.innerHTML = STATE.players.map(player => {
        const isExcluded = STATE.excluded.has(player);
        return `
          <label class="wr-player-item ${isExcluded ? 'is-excluded' : ''}">
            <input type="checkbox" value="${player}" ${!isExcluded ? 'checked' : ''}>
            <span>${player}</span>
          </label>`;
      }).join('');
    }

    resultContainer.textContent = STATE.lastResult || '...';
    renderDeathLog();
  };

  // ─── UI INJECTION ─────────────────────────────────────────────────────────
  const injectUI = () => {
    if (document.getElementById('wr-root')) return;

    injectStyles();

    const root = document.createElement('div');
    root.id = 'wr-root';
    root.innerHTML = `
      <div class="wr-panel">
        <div class="wr-header">
          <h2>Wolfy Tools</h2>
          <button class="wr-refresh" title="Actualiser la liste">↻</button>
        </div>

        <div class="wr-tabs">
          <button class="wr-tab is-active" data-tab="draw"     title="Tirage">🎲</button>
          <button class="wr-tab"           data-tab="deaths"   title="Log des morts">💀</button>
          <button class="wr-tab"           data-tab="settings" title="Paramètres">⚙️</button>
        </div>

        <!-- DRAW -->
        <div class="wr-tab-panel" data-panel="draw">
          <div class="wr-players"></div>
          <div class="wr-action-area">
            <div class="wr-result">...</div>
            <button class="wr-draw-btn">Tirer au sort</button>
          </div>
        </div>

        <!-- DEATHS -->
        <div class="wr-tab-panel" data-panel="deaths" style="display:none;">
          <div class="wr-death-list"></div>
          <div class="wr-action-area">
            <button class="wr-clear-deaths-btn">🗑 Effacer le log</button>
          </div>
        </div>

        <!-- SETTINGS -->
        <div class="wr-tab-panel" data-panel="settings" style="display:none;">
          <div class="wr-settings-list" style="padding: 10px;">
            <label class="wr-setting-item">
              <input type="checkbox" id="wr-auto-next" ${STATE.autoNext ? 'checked' : ''}>
              <span>Partie suivante automatique</span>
            </label>
          </div>
        </div>
      </div>

      <button class="wr-toggle" title="Ouvrir/Fermer Wolfy Tools">📜</button>
    `;

    document.body.appendChild(root);

    root.querySelector('.wr-refresh').addEventListener('click', () => {
      scanPlayersFromDOM();
      STATE.lastResult = null;
      render();
    });

    root.querySelector('.wr-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.wr-tab');
      if (!tab) return;
      const targetTab = tab.dataset.tab;
      root.querySelectorAll('.wr-tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === targetTab));
      root.querySelectorAll('.wr-tab-panel').forEach(p => {
        p.style.display = p.dataset.panel === targetTab ? 'block' : 'none';
      });
      if (targetTab === 'deaths') renderDeathLog();
    });

    root.querySelector('.wr-draw-btn').addEventListener('click', drawRandomPlayer);

    root.querySelector('.wr-players').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const playerName = e.target.value;
        if (e.target.checked) STATE.excluded.delete(playerName);
        else STATE.excluded.add(playerName);
        render();
      }
    });

    root.querySelector('#wr-auto-next').addEventListener('change', (e) => {
      STATE.autoNext = e.target.checked;
      localStorage.setItem('wr_autoNext', STATE.autoNext);
      if (STATE.autoNext) tryAutoNext();
    });

    root.querySelector('.wr-clear-deaths-btn').addEventListener('click', () => {
      DEATH_LOG.length = 0;
      renderDeathLog();
    });

    makeDraggable(root);
  };

  // ─── DRAG & DROP ──────────────────────────────────────────────────────────
  const makeDraggable = (root) => {
    const toggle = root.querySelector('.wr-toggle');
    let hasDragged = false;
    let startX, startY, origLeft, origBottom;

    toggle.addEventListener('mousedown', (e) => {
      hasDragged = false;
      startX     = e.clientX;
      startY     = e.clientY;
      const rect = root.getBoundingClientRect();
      origLeft   = rect.left;
      origBottom = window.innerHeight - rect.bottom;
    });

    document.addEventListener('mousemove', (e) => {
      if (startX === undefined) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!hasDragged && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;

      hasDragged = true;
      root.style.left   = `${Math.max(0, Math.min(origLeft   + dx, window.innerWidth  - 60))}px`;
      root.style.bottom = `${Math.max(0, Math.min(origBottom - dy, window.innerHeight - 60))}px`;
      root.style.right  = 'auto';
      root.style.top    = 'auto';
    });

    document.addEventListener('mouseup', () => {
      startX = undefined;
    });

    toggle.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        return;
      }
      STATE.isOpen = !STATE.isOpen;
      if (STATE.isOpen) scanPlayersFromDOM();
      render();
    });
  };

  // ─── SVG REPLACEMENT ──────────────────────────────────────────────────────
  const localImageUrl = chrome.runtime.getURL('eyes2.svg');

  const replaceEyesImage = () => {
    document.querySelectorAll('img').forEach(img => {
      if (img.src && img.src.includes('eyes2.svg') && !img.src.includes('chrome-extension://'))
        img.src = localImageUrl;
    });
    document.querySelectorAll('use').forEach(use => {
      const href = use.getAttribute('href') || use.getAttribute('xlink:href');
      if (href && href.includes('eyes2.svg')) {
        use.setAttribute('href', localImageUrl);
        use.setAttribute('xlink:href', localImageUrl);
      }
    });
    document.querySelectorAll('div, span, a, i').forEach(el => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg.includes('eyes2.svg') && !bg.includes('chrome-extension://'))
        el.style.backgroundImage = `url("${localImageUrl}")`;
    });
  };

  // ─── BOOT ─────────────────────────────────────────────────────────────────
  const boot = () => {
    injectUI();
    scanPlayersFromDOM();
    startDOMObserver();
    replaceEyesImage();
    new MutationObserver(replaceEyesImage).observe(document.body, { childList: true, subtree: true });
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
