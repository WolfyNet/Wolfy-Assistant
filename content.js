(() => {
  // ─── STATE ────────────────────────────────────────────────────────────────
  const STATE = {
    isOpen: false,
    players: [],
    excluded: new Set(),
    lastResult: null,
    autoNext: localStorage.getItem('wr_autoNext') === 'true',
    globalSkin: localStorage.getItem('wr_globalSkin') || '',
    activeSkinUrl: localStorage.getItem('wr_activeSkinUrl') || '',
    playerSkins: JSON.parse(localStorage.getItem('wr_playerSkins') || '{}'),
    globalTombstone: localStorage.getItem('wr_globalTombstone') || '',
    activeTombstoneUrl: localStorage.getItem('wr_activeTombstoneUrl') || '',
    globalPet: localStorage.getItem('wr_globalPet') || '',
    activeGlobalPetUrl: localStorage.getItem('wr_activeGlobalPetUrl') || '',
    playerPets: JSON.parse(localStorage.getItem('wr_playerPets') || '{}'),
    soundRules: JSON.parse(localStorage.getItem('wr_soundRules') || '[]'),
    gameInfo: null,
  };

  // ─── HELPER LOCALSTORAGE SECURE ─────────────────────────────────────────
  const safeSetStorage = (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      alert("Erreur de stockage : Le fichier est probablement trop lourd.");
    }
  };

  // ─── STYLES CSS INJECTION (REFONTE GRAPHIQUE) ─────────────────────────────
  const injectStyles = () => {
    if (document.getElementById('wr-styles')) return;

    const style = document.createElement('style');
    style.id = 'wr-styles';
    style.textContent = `
      #wr-root {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        color: #e2e8f0;
        /* Pas de position sur le root : évite de créer un containing block
           qui piégerait les enfants position:fixed à l'intérieur. */
      }



      #wr-root * {
        box-sizing: border-box !important;
      }

      .wr-panel {
        position: fixed;
        width: 350px;
        max-height: 80vh;
        background: #151221;
        border: 1px solid rgba(138, 115, 255, 0.25);
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        display: none;
        flex-direction: column;
        z-index: 999998;
        /* La position top/left/right/bottom est gérée dynamiquement par JS */
      }

      #wr-root.is-open .wr-panel {
        display: flex;
      }

      /* HEADER */
      .wr-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .wr-header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
      }

      .wr-refresh {
        background: transparent;
        border: none;
        color: #a78bfa;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .wr-refresh:hover {
        background: rgba(167, 139, 250, 0.15);
      }

      /* TABS */
      .wr-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.25);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .wr-tab {
        flex: 1;
        padding: 10px 0;
        background: transparent;
        border: none;
        color: #71717a;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .wr-tab:hover {
        color: #d4d4d8;
        background: rgba(255, 255, 255, 0.02);
      }

      .wr-tab.is-active {
        color: #a78bfa;
        border-bottom-color: #a78bfa;
        background: rgba(167, 139, 250, 0.08);
      }

      /* TAB PANELS */
      .wr-tab-panel {
        padding: 12px;
        max-height: 380px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .wr-tab-panel::-webkit-scrollbar {
        width: 5px;
      }
      .wr-tab-panel::-webkit-scrollbar-track {
        background: transparent;
      }
      .wr-tab-panel::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
      }

      /* CARDS / SECTIONS */
      .wr-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
      }

      .wr-card:last-child {
        margin-bottom: 0;
      }

      .wr-section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #a78bfa;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* INPUTS & BUTTONS */
      .wr-input-style {
        width: 100%;
        padding: 7px 10px;
        background: #0f0d18;
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #fff;
        border-radius: 6px;
        font-size: 11px;
        outline: none;
        transition: border-color 0.2s;
      }

      .wr-input-style:focus {
        border-color: #7c4dff;
      }

      .wr-input-group {
        display: flex;
        gap: 6px;
      }

      .wr-btn-primary {
        padding: 8px 14px;
        background: linear-gradient(135deg, #7c4dff, #9c6dff);
        border: none;
        color: #fff;
        border-radius: 7px;
        cursor: pointer;
        font-weight: 700;
        font-size: 12px;
        white-space: nowrap;
        transition: opacity 0.15s, transform 0.1s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        line-height: 1;
      }
      .wr-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
      .wr-btn-primary:active { opacity: 1; transform: translateY(0); }
      .wr-btn-primary:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

      .wr-btn-secondary {
        padding: 8px 12px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.14);
        color: #c4b5fd;
        border-radius: 7px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        line-height: 1;
        white-space: nowrap;
      }
      .wr-btn-secondary:hover {
        background: rgba(196,181,253,0.12);
        border-color: rgba(196,181,253,0.3);
        color: #fff;
      }
      label.wr-btn-secondary, label.wr-btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      /* CHIPS */
      .wr-chips-container {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }

      .wr-chip {
        display: inline-block;
        background: rgba(124, 77, 255, 0.12);
        border: 1px solid rgba(124, 77, 255, 0.3);
        color: #c4b5fd;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .wr-chip:hover {
        background: #7c4dff;
        color: #fff;
      }

      /* LIST ITEMS (SOUNDS & SKINS) */
      .wr-item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 6px 8px;
        border-radius: 6px;
        margin-top: 4px;
        font-size: 11px;
      }

      .wr-item-del {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 13px;
        padding: 0 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .wr-item-del:hover {
        opacity: 1;
      }

      /* DRAW TAB PLAYERS */
      .wr-players {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 10px;
      }

      .wr-player-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        cursor: pointer;
        user-select: none;
      }

      .wr-player-item.is-excluded {
        opacity: 0.4;
      }

      .wr-player-item.is-excluded span {
        text-decoration: line-through;
      }

      #wr-root input[type="checkbox"] {
        appearance: none;
        width: 16px;
        height: 16px;
        border: 1px solid #5c5270;
        border-radius: 4px;
        background: #0f0d18;
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
      }

      #wr-root input[type="checkbox"]:checked {
        background: #7c4dff;
        border-color: #7c4dff;
      }

      #wr-root input[type="checkbox"]:checked::after {
        content: '✓';
        position: absolute;
        color: #fff;
        font-size: 11px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -55%);
      }

      .wr-action-area {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        margin-top: 10px;
      }

      .wr-result {
        font-size: 15px;
        font-weight: 800;
        color: #c4b5fd;
        min-height: 36px;
        background: rgba(124,77,255,0.1);
        border: 1px solid rgba(124,77,255,0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 12px;
      }

      .wr-draw-btn {
        width: 100%;
        padding: 10px 0;
        background: linear-gradient(135deg, #7c4dff, #9c6dff);
        border: none;
        color: #fff;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.15s, transform 0.1s;
      }
      .wr-draw-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      .wr-draw-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

      .wr-clear-deaths-btn {
        width: 100%;
        padding: 9px 0;
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.25);
        color: #f87171;
        border-radius: 7px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.15s;
      }
      .wr-clear-deaths-btn:hover {
        background: rgba(239,68,68,0.18);
        border-color: rgba(239,68,68,0.45);
      }

      /* DEATH LOG */
      .wr-death-row {
        background: rgba(255, 255, 255, 0.03);
        border-left: 3px solid #ef4444;
        padding: 8px;
        border-radius: 0 6px 6px 0;
        margin-bottom: 6px;
      }

      .wr-death-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }

      .wr-death-name {
        font-weight: 700;
        color: #fff;
      }

      .wr-death-role {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 3px;
      }

      .wr-death-time {
        margin-left: auto;
        font-size: 10px;
        color: #71717a;
      }

      .wr-death-msg {
        color: #a1a1aa;
        font-size: 10px;
        line-height: 1.3;
      }


      /* PET CHANGER */
      .wr-pet-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
        padding: 6px 8px;
        background: rgba(124, 77, 255, 0.06);
        border: 1px solid rgba(124, 77, 255, 0.15);
        border-radius: 6px;
        font-size: 11px;
        color: #c4b5fd;
      }
      .wr-pet-preview img {
        width: 32px; height: 32px; object-fit: contain;
      }

      /* GAME INFO TAB */
      .wr-game-info-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
      }
      .wr-game-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(124,77,255,0.15);
        border: 1px solid rgba(124,77,255,0.3);
        color: #c4b5fd;
        border-radius: 99px;
        padding: 2px 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .wr-game-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        font-size: 11px;
      }
      .wr-game-row:last-child { border-bottom: none; }
      .wr-game-row .label { color: #71717a; }
      .wr-game-row .value { color: #e2e8f0; font-weight: 600; text-align: right; max-width: 200px; }
      .wr-game-balance-good { color: #4ade80; }
      .wr-game-balance-bad  { color: #f87171; }
      .wr-game-balance-neutral { color: #a78bfa; }
      .wr-game-roles-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
      }
      .wr-game-role-chip {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px;
        padding: 2px 7px;
        font-size: 10px;
        color: #d4d4d8;
      }
      .wr-game-fetch-btn {
        width: 100%;
        padding: 8px 0;
        background: rgba(124,77,255,0.12);
        border: 1px solid rgba(124,77,255,0.3);
        color: #c4b5fd;
        border-radius: 7px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.15s;
        margin-bottom: 10px;
      }
      .wr-game-fetch-btn:hover {
        background: rgba(124,77,255,0.22);
        border-color: rgba(124,77,255,0.5);
      }

      /* TOGGLE BUTTON */
      .wr-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c4dff, #a06be0);
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: grab;
        box-shadow: 0 4px 16px rgba(124, 77, 255, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s, box-shadow 0.15s;
        user-select: none;
        -webkit-user-select: none;
        z-index: 999999;
      }

      .wr-toggle:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(124, 77, 255, 0.6);
      }

      .wr-toggle:active {
        cursor: grabbing;
        transform: scale(0.95);
      }

      .wr-label-sm {
        font-size: 10px;
        color: #94a3b8;
        margin-bottom: 3px;
        display: block;
      }

      .wr-empty-state {
        text-align: center;
        color: #71717a;
        font-size: 11px;
        padding: 16px 0;
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

  // ─── TOMBSTONE CHANGER SYSTEM ─────────────────────────────────────────────
  const replaceTombstones = () => {
    const tombstoneImgs = document.querySelectorAll(
      'img[src*="tombstone"], img[src*="Tombstone"], img[src*="%22tombstone%22"], img[src*="full.svg"]'
    );

    tombstoneImgs.forEach(img => {
      img.classList.add('wr-is-tombstone');
      if (STATE.activeTombstoneUrl && img.src !== STATE.activeTombstoneUrl) {
        img.src = STATE.activeTombstoneUrl;
      }
    });
  };

  const resolveAndSaveTombstone = (inputVal, statusEl) => {
    const val = inputVal.trim();

    if (!val) {
      STATE.globalTombstone = '';
      STATE.activeTombstoneUrl = '';
      localStorage.removeItem('wr_globalTombstone');
      localStorage.removeItem('wr_activeTombstoneUrl');
      if (statusEl) statusEl.textContent = 'Pierre tombale désactivée';
      return;
    }

    STATE.globalTombstone = val;
    safeSetStorage('wr_globalTombstone', val);

    let finalUrl = val;

    if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('data:')) {
      const parts = val.split(',');
      const tombId = parts[0].trim();
      const color = parts[1] ? parseInt(parts[1].trim(), 10) : 1;
      const jsonObj = { tombstone: { id: tombId, color: color } };
      finalUrl = `https://wolfy.net/api/skin/render/full.svg?skin=${encodeURIComponent(JSON.stringify(jsonObj))}`;
    }

    STATE.activeTombstoneUrl = finalUrl;
    safeSetStorage('wr_activeTombstoneUrl', finalUrl);
    if (statusEl) statusEl.textContent = 'Pierre tombale appliquée !';
    replaceTombstones();
  };


  // ─── PET CHANGER SYSTEM (GLOBAL & PAR JOUEUR) ─────────────────────────────
  const replacePets = () => {
    const petImgs = document.querySelectorAll('img[class*="petImg"], img[src*="/api/skin/render/pet.svg"]');
    petImgs.forEach(img => {
      const username = getUsernameForImg(img);
      let targetUrl = null;
      if (username && STATE.playerPets[username.toLowerCase()]) {
        targetUrl = STATE.playerPets[username.toLowerCase()].url;
      } else if (STATE.activeGlobalPetUrl) {
        targetUrl = STATE.activeGlobalPetUrl;
      }
      if (targetUrl && img.src !== targetUrl) {
        if (!img.dataset.wrOrigPetSrc) img.dataset.wrOrigPetSrc = img.src;
        img.src = targetUrl;
      }
    });
  };

  const resolvePetToUrl = (inputVal) => {
    const val = inputVal.trim();
    if (!val) return { url: '', label: '' };
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) {
      return { url: val, label: val.length > 30 ? val.substring(0, 30) + '...' : val };
    }
    // Format ID+couleur : "PF041,3" ou juste "PF041"
    const parts = val.split(',');
    const id = parts[0].trim();
    const color = parts[1] ? parseInt(parts[1].trim(), 10) : 1;
    if (id) {
      const url = `https://wolfy.net/api/skin/render/pet.svg?id=${encodeURIComponent(id)}&color=${color}`;
      return { url, label: `${id} (couleur ${color})` };
    }
    return { url: '', label: '' };
  };

  const renderPlayerPetsList = () => {
    const container = document.querySelector('.wr-player-pets-list');
    if (!container) return;
    const keys = Object.keys(STATE.playerPets);
    if (keys.length === 0) {
      container.innerHTML = `<div class="wr-empty-state">Aucun pet spécifique configuré.</div>`;
      return;
    }
    container.innerHTML = keys.map(key => {
      const item = STATE.playerPets[key];
      return `
        <div class="wr-item-row">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;">
            <strong style="color:#a78bfa;">🐾 ${item.target}</strong> → <span style="color:#d4d4d8;">${item.petInput}</span>
          </div>
          <button class="wr-item-del wr-pet-delete" data-key="${key}" title="Supprimer">🗑</button>
        </div>`;
    }).join('');
    container.querySelectorAll('.wr-pet-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.closest('[data-key]').dataset.key;
        delete STATE.playerPets[key];
        safeSetStorage('wr_playerPets', JSON.stringify(STATE.playerPets));
        renderPlayerPetsList();
        replacePets();
      });
    });
  };

  // ─── SKIN CHANGER SYSTEM (GLOBAL & PAR JOUEUR) ────────────────────────────
  const getUsernameForImg = (img) => {
    // Remonte l'arbre DOM : username est frère de characterHitbox, pas descendant de l'img
    let el = img.parentElement;
    while (el && el !== document.body) {
      const nameEl = el.querySelector('[class*="username"], [class*="Username"]');
      if (nameEl) return nameEl.textContent.trim();
      el = el.parentElement;
    }
    return null;
  };

  const replaceCharacterSkins = () => {
    // Cibler characterShape ET characterImg (Wolfy utilise les deux pour le même personnage)
    const characterImgs = document.querySelectorAll(
      'img[class*="characterImg"], img[class*="characterShape"], img[src*="/api/skin/render/user.svg"]'
    );
    
    characterImgs.forEach(img => {
      const src = img.src || '';

      if (
        src.includes('tombstone') ||
        src.includes('Tombstone') ||
        src.includes('%22tombstone%22') ||
        src.includes('full.svg') ||
        img.classList.contains('wr-is-tombstone')
      ) {
        return;
      }

      const username = getUsernameForImg(img);
      let targetSkinUrl = null;

      if (username && STATE.playerSkins[username.toLowerCase()]) {
        targetSkinUrl = STATE.playerSkins[username.toLowerCase()].url;
      } else if (STATE.activeSkinUrl) {
        targetSkinUrl = STATE.activeSkinUrl;
      }

      if (targetSkinUrl && img.src !== targetSkinUrl) {
        img.src = targetSkinUrl;
      }
    });
  };

  const resolveSkinToUrl = async (inputVal) => {
    const val = inputVal.trim();
    if (!val) return { url: '', label: '' };

    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) {
      return { url: val, label: val.length > 20 ? val.substring(0,20) + '...' : val };
    } else {
      try {
        const res = await fetch(`https://wolfy.net/api/leaderboard/player/${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            const { id, skinVersion, slotId } = data.user;
            return {
              url: `https://wolfy.net/api/skin/render/user.svg?id=${id}&v=${skinVersion}&s=${slotId}`,
              label: `Skin de ${data.user.username}`
            };
          }
        }
      } catch (e) {}
    }
    return { url: '', label: '' };
  };

  const resolveAndSaveGlobalSkin = async (inputVal, statusEl) => {
    const val = inputVal.trim();

    if (!val) {
      STATE.globalSkin = '';
      STATE.activeSkinUrl = '';
      localStorage.removeItem('wr_globalSkin');
      localStorage.removeItem('wr_activeSkinUrl');
      if (statusEl) statusEl.textContent = 'Skin global désactivé';
      return;
    }

    if (statusEl) statusEl.textContent = 'Recherche...';
    const resolved = await resolveSkinToUrl(val);

    if (resolved.url) {
      STATE.globalSkin = val;
      STATE.activeSkinUrl = resolved.url;
      safeSetStorage('wr_globalSkin', val);
      safeSetStorage('wr_activeSkinUrl', resolved.url);
      if (statusEl) statusEl.textContent = 'Skin global appliqué !';
      replaceCharacterSkins();
    } else {
      if (statusEl) statusEl.textContent = 'Skin introuvable.';
    }
  };

  // ─── INFOS PARTIE ─────────────────────────────────────────────────────────
  const ROLE_NAMES_FR = {
    witch: 'Sorcière', hunter: 'Chasseur', guard: 'Garde', cupid: 'Cupidon',
    dictator: 'Dictateur', blackWolf: 'Loup Noir', wolfRidingHood: 'Chaperon Loup',
    necromencer: 'Nécromancien', seer: 'Voyante', elder: 'Ancien', shepherd: 'Berger',
    piper: 'Joueur de Flûte', fox: 'Renard', bear: "Montreur d'Ours", stuttering: 'Bègue',
    wildChild: 'Enfant Sauvage', dogWolf: 'Chien-Loup', thief: 'Voleur',
    actor: 'Acteur', scandalmonger: 'Colporteur', scapegoat: 'Bouc Émissaire',
    angel: 'Ange', prejudiced: 'Manipulateur', stutteringJudge: 'Juge Bègue',
    threeBrothers: '3 Frères', twoSisters: '2 Sœurs', piedPiper: 'Joueur de Flûte',
    accursedWolfFather: 'Père des Loups', bigBadWolf: 'Grand Méchant Loup',
    villager: 'Villageois', werewolf: 'Loup-Garou', whiteWerewolf: 'Loup Blanc',
  };

  const STATUS_LABELS = { 0: 'Lobby', 1: 'Démarrage', 2: 'En partie', 3: 'En partie', 4: 'Terminée', 5: 'Terminée' };
  const STATUS_DOT   = { 0: '⚪', 1: '🟡', 2: '🟢', 3: '🟢', 4: '🔴', 5: '🔴' };

  const WOLF_ROLES = new Set([
    'werewolf','blackWolf','wolfRidingHood','bigBadWolf','whiteWerewolf','accursedWolfFather','dogWolf'
  ]);

  const getGameIdFromUrl = () => {
    const m = window.location.pathname.match(/\/(?:fr|en|de|es|pt|it)\/game\/([A-Z0-9]+)/i);
    return m ? m[1].toUpperCase() : null;
  };

  const fetchGameInfo = async () => {
    const gameId = getGameIdFromUrl();
    const container = document.querySelector('.wr-game-info-content');
    if (!container) return;

    if (!gameId) {
      container.innerHTML = `<div class="wr-empty-state">Aucune partie détectée dans l'URL.<br>Rejoins une partie sur Wolfy.</div>`;
      return;
    }

    container.innerHTML = `<div class="wr-empty-state" style="color:#a78bfa;">⏳ Chargement…</div>`;

    try {
      const res = await fetch(`https://wolfy.net/api/game/${gameId}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      STATE.gameInfo = data;
      renderGameInfo(data);
    } catch (e) {
      container.innerHTML = `<div class="wr-empty-state" style="color:#f87171;">Erreur : ${e.message}</div>`;
    }
  };

  const renderGameInfo = (data) => {
    const container = document.querySelector('.wr-game-info-content');
    if (!container || !data) return;

    const status = data.status ?? 0;
    const playerCount = data.playerCount ?? data.settings?.slots ?? '?';
    const slots = data.settings?.slots ?? playerCount;
    const roles = data.settings?.roles || {};
    const balancing = data.settings?.balancing ?? 0;
    const isPrivate = data.private ? '🔒 Privée' : '🌐 Publique';
    const lang = (data.lang || 'fr').toUpperCase();
    const voice = data.voice ? '🎙️ Oui' : '🔇 Non';

    // Calcul loups
    let wolfCount = 0;
    for (const [roleKey, count] of Object.entries(roles)) {
      if (WOLF_ROLES.has(roleKey)) wolfCount += (count || 0);
    }
    const wolfPct = slots > 0 ? Math.round((wolfCount / slots) * 100) : 0;

    // Balance
    let balClass = 'wr-game-balance-neutral', balLabel = 'Équilibré';
    if (balancing < -1) { balClass = 'wr-game-balance-good'; balLabel = 'Avantage village'; }
    else if (balancing > 1) { balClass = 'wr-game-balance-bad'; balLabel = 'Avantage loups'; }

    // Rôles spéciaux listés
    const specialRoles = Object.entries(roles)
      .filter(([k, v]) => v > 0)
      .map(([k, v]) => {
        const name = ROLE_NAMES_FR[k] || k;
        const isWolf = WOLF_ROLES.has(k);
        return `<span class="wr-game-role-chip" style="color:${isWolf ? '#fca5a5' : '#d4d4d8'};border-color:${isWolf ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'};">${v > 1 ? v + '× ' : ''}${name}</span>`;
      })
      .join('');

    container.innerHTML = `
      <div class="wr-game-info-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:700;color:#fff;">Partie détectée</span>
          <span class="wr-game-status-badge">${STATUS_DOT[status] || '⚪'} ${STATUS_LABELS[status] || 'Inconnu'}</span>
        </div>

        <div class="wr-game-row">
          <span class="label">Code</span>
          <span class="value" style="font-family:monospace;letter-spacing:1px;">${data.id || '?'}</span>
        </div>
        <div class="wr-game-row">
          <span class="label">Joueurs</span>
          <span class="value">${playerCount} / ${slots}</span>
        </div>
        <div class="wr-game-row">
          <span class="label">Loups</span>
          <span class="value">${wolfCount} loup(s) / ${slots} joueurs (${wolfPct}%)</span>
        </div>
        <div class="wr-game-row">
          <span class="label">Équilibrage</span>
          <span class="value ${balClass}">score ${balancing} · ${balLabel}</span>
        </div>
        <div class="wr-game-row">
          <span class="label">Visibilité</span>
          <span class="value">${isPrivate}</span>
        </div>
        <div class="wr-game-row">
          <span class="label">Langue · Vocal</span>
          <span class="value">${lang} · ${voice}</span>
        </div>
        ${data.settings?.mayor !== undefined ? `
        <div class="wr-game-row">
          <span class="label">Maire</span>
          <span class="value">${data.settings.mayor ? 'Activé' : 'Désactivé'}</span>
        </div>` : ''}
      </div>

      ${specialRoles ? `
      <div class="wr-game-info-card">
        <div class="wr-section-title" style="margin-bottom:8px;">🎭 Rôles spéciaux</div>
        <div class="wr-game-roles-grid">${specialRoles}</div>
      </div>` : ''}
    `;
  };

// ─── AUTO NEXT GAME ───────────────────────
  let isClickingNext = false;

  const tryAutoNext = () => {
    if (!STATE.autoNext || isClickingNext) return;

    // 1. Recherche dynamique de l'élément texte
    const allElements = Array.from(document.querySelectorAll('*'));
    const targetEl = allElements.find(el => {
      return el.children.length === 0 && el.textContent.trim() === 'Partie suivante';
    });

    if (targetEl) {
      isClickingNext = true;
      console.log('--------------------------------------------------');
      console.log('[Wolfy Tools] 🎯 Bouton "Partie suivante" DÉTECTÉ !');
      console.log('Elément texte exact :', targetEl);

      // 2. Recherche du conteneur cliquable (actionButton / neutralButton / button)
      let clickTarget = targetEl;
      let parent = targetEl.parentElement;

      while (parent && parent !== document.body) {
        if (
          parent.tagName === 'BUTTON' || 
          (parent.className && typeof parent.className === 'string' && 
          (parent.className.includes('actionButton') || parent.className.includes('neutralButton')))
        ) {
          clickTarget = parent;
          break;
        }
        parent = parent.parentElement;
      }

      console.log('Cible du clic sélectionnée :', clickTarget);

      // --- BATTERIE DE TEST MULTI-MÉTHODES ---

      // Méthode 1 : Native .click() directe
      try {
        console.log('[TEST 1] Tentative via .click() direct...');
        clickTarget.click();
        if (clickTarget !== targetEl) targetEl.click();
      } catch (err) {
        console.error('[TEST 1 FELL]', err);
      }

      // Méthode 2 : Événement PointerEvent (Très utilisé par les interfaces React modernes)
      setTimeout(() => {
        try {
          console.log('[TEST 2] Tentative via PointerEvents (PointerDown/Up)...');
          ['pointerdown', 'pointerup', 'click'].forEach(eventType => {
            const ev = new PointerEvent(eventType, { bubbles: true, cancelable: true, view: window });
            clickTarget.dispatchEvent(ev);
          });
        } catch (err) {
          console.error('[TEST 2 FELL]', err);
        }
      }, 100);

      // Méthode 3 : Événement MouseEvent classique
      setTimeout(() => {
        try {
          console.log('[TEST 3] Tentative via MouseEvents (MouseDown/Up/Click)...');
          ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            const ev = new MouseEvent(eventType, { bubbles: true, cancelable: true, view: window });
            clickTarget.dispatchEvent(ev);
          });
        } catch (err) {
          console.error('[TEST 3 FELL]', err);
        }
      }, 200);

      // Méthode 4 : Force la simulation sur le parent direct ET la cible
      setTimeout(() => {
        try {
          console.log('[TEST 4] Tentative brute sur targetEl ET clickTarget...');
          targetEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        } catch (err) {
          console.error('[TEST 4 FELL]', err);
        }
      }, 300);

      // Anti-spam de 3 secondes pour laisser le temps de voir les logs
      setTimeout(() => {
        isClickingNext = false;
      }, 3000);
    }
  };

  // ─── OBSERVER DU DOM ─────────────────────────────────────────────────────
  const tryParseDeath = (node) => {
    const deathBox = node.matches?.('[data-sentry-component="Death"]')
      ? node
      : node.querySelector?.('[data-sentry-component="Death"]');

    const target = deathBox || node.querySelector?.('[class*="__death"]');
    if (!target) return;

    const nameEl = target.querySelector(
      '[class*="__username"], [class*="PlayerSpan"], [class*="username"]'
    );
    if (!nameEl) return;
    const name = nameEl.textContent.trim();
    if (!name) return;

    const roleEl = target.querySelector(
      '[class*="__role"], [class*="RoleSpan"], [class*="role"]'
    );
    const role = roleEl ? roleEl.textContent.trim() : null;

    // Cloner le nœud infoMessage, retirer img/svg (icône crâne), garder le texte lisible
    const infoEl = target.querySelector('[class*="infoMessage"], [class*="__infoMessage"]') || target;
    const clone  = infoEl.cloneNode(true);
    clone.querySelectorAll('img, svg').forEach(el => el.remove());
    const message = clone.textContent.replace(/\s+/g, ' ').trim();

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
      replaceTombstones();
      replaceCharacterSkins();
      replacePets();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(() => {
      tryAutoNext();
      replaceTombstones();
      replaceCharacterSkins();
      replacePets();
    }, 800);
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

    renderPlayerChips();
  };

  const renderPlayerChips = () => {
    const chipsContainer = document.querySelector('.wr-player-skin-chips');
    if (!chipsContainer) return;

    if (STATE.players.length === 0) {
      chipsContainer.innerHTML = `<span style="font-size:10px; color:#71717a;">Aucun joueur en partie</span>`;
      return;
    }

    chipsContainer.innerHTML = STATE.players.map(p => `
      <span class="wr-chip wr-player-chip" data-player="${p}">${p}</span>
    `).join('');

    chipsContainer.querySelectorAll('.wr-player-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetInput = document.querySelector('#wr-pskin-target');
        if (targetInput) targetInput.value = chip.dataset.player;
      });
    });
  };

  const renderPlayerPetChips = () => {
    const chipsContainer = document.querySelector('.wr-player-pet-chips');
    if (!chipsContainer) return;
    if (STATE.players.length === 0) {
      chipsContainer.innerHTML = `<span style="font-size:10px;color:#71717a;">Aucun joueur en partie</span>`;
      return;
    }
    chipsContainer.innerHTML = STATE.players.map(p =>
      `<span class="wr-chip wr-ppet-chip" data-player="${p}">${p}</span>`
    ).join('');
    chipsContainer.querySelectorAll('.wr-ppet-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetInput = document.querySelector('#wr-ppet-target');
        if (targetInput) targetInput.value = chip.dataset.player;
      });
    });
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

  // ─── RENDER SOUND LIST & PLAYER SKINS LIST ────────────────────────────────
  const renderSoundRules = () => {
    const container = document.querySelector('.wr-sound-rules-list');
    if (!container) return;

    if (STATE.soundRules.length === 0) {
      container.innerHTML = `<div class="wr-empty-state">Aucune modification de son active.</div>`;
      return;
    }

    container.innerHTML = STATE.soundRules.map((rule, index) => `
      <div class="wr-item-row">
        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;">
          <strong style="color:#a78bfa;">🎯 ${rule.target}</strong> → <span style="color:${rule.replacement ? '#d4d4d8' : '#ef4444'};">${rule.label}</span>
        </div>
        <button class="wr-item-del wr-sound-delete" data-index="${index}" title="Supprimer">🗑</button>
      </div>
    `).join('');

    container.querySelectorAll('.wr-sound-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        STATE.soundRules.splice(idx, 1);
        safeSetStorage('wr_soundRules', JSON.stringify(STATE.soundRules));
        renderSoundRules();
      });
    });
  };

  const renderPlayerSkinsList = () => {
    const container = document.querySelector('.wr-player-skins-list');
    if (!container) return;

    const keys = Object.keys(STATE.playerSkins);

    if (keys.length === 0) {
      container.innerHTML = `<div class="wr-empty-state">Aucun skin spécifique configuré.</div>`;
      return;
    }

    container.innerHTML = keys.map(key => {
      const item = STATE.playerSkins[key];
      return `
        <div class="wr-item-row">
          <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;">
            <strong style="color:#a78bfa;">👤 ${item.target}</strong> → <span style="color:#d4d4d8;">${item.skinInput}</span>
          </div>
          <button class="wr-item-del wr-skin-delete" data-key="${key}" title="Supprimer">🗑</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.wr-skin-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        delete STATE.playerSkins[key];
        safeSetStorage('wr_playerSkins', JSON.stringify(STATE.playerSkins));
        renderPlayerSkinsList();
        replaceCharacterSkins();
      });
    });
  };

  // ─── RENDER DEATH LOG ─────────────────────────────────────────────────────
  const renderDeathLog = () => {
    const container = document.querySelector('.wr-death-list');
    if (!container) return;

    if (DEATH_LOG.length === 0) {
      container.innerHTML = `<div class="wr-empty-state">Aucune mort détectée pour l'instant.<br>Le log se remplit automatiquement.</div>`;
      return;
    }

    container.innerHTML = DEATH_LOG.map(entry => `
      <div class="wr-death-row">
        <div class="wr-death-header">
          <span class="wr-death-name">${entry.name}</span>
          ${entry.role ? `<span class="wr-death-role">${entry.role}</span>` : ''}
          <span class="wr-death-time">${entry.time}</span>
        </div>
        <div class="wr-death-msg">${entry.message}</div>
      </div>
    `).join('');
  };

  // ─── RENDER MAIN ──────────────────────────────────────────────────────────
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
    renderSoundRules();
    renderPlayerSkinsList();
    renderPlayerChips();
    renderPlayerPetsList();
    renderPlayerPetChips();
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
          <button class="wr-tab is-active" data-tab="draw"     title="Tirage au sort">🎲</button>
          <button class="wr-tab"           data-tab="deaths"   title="Log des morts">💀</button>
          <button class="wr-tab"           data-tab="changer"  title="Skins, Pets, Sons">🎨</button>
          <button class="wr-tab"           data-tab="gameinfo" title="Infos Partie">🔍</button>
          <button class="wr-tab"           data-tab="settings" title="Paramètres">⚙️</button>
        </div>

        <!-- DRAW TAB -->
        <div class="wr-tab-panel" data-panel="draw">
          <div class="wr-players"></div>
          <div class="wr-action-area">
            <div class="wr-result">...</div>
            <button class="wr-draw-btn wr-btn-primary">Tirer au sort</button>
          </div>
        </div>

        <!-- DEATHS TAB -->
        <div class="wr-tab-panel" data-panel="deaths" style="display:none;">
          <div class="wr-death-list"></div>
          <div class="wr-action-area">
            <button class="wr-clear-deaths-btn">🗑 Effacer le log</button>
          </div>
        </div>

        <!-- CHANGER TAB -->
        <div class="wr-tab-panel" data-panel="changer" style="display:none;">
          
          <!-- SKIN PAR JOUEUR -->
          <div class="wr-card">
            <div class="wr-section-title">👤 Skin par Joueur</div>
            
            <span class="wr-label-sm">Joueurs en partie :</span>
            <div class="wr-player-skin-chips wr-chips-container"></div>

            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
              <input type="text" id="wr-pskin-target" class="wr-input-style" placeholder="Pseudo du joueur ciblé...">
              <input type="text" id="wr-pskin-source" class="wr-input-style" placeholder="Skin (Pseudo / URL / Fichier local)">

              <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:2px;">
                <label class="wr-btn-secondary" style="flex:1; cursor:pointer;">
                  📁 Fichier
                  <input type="file" id="wr-pskin-file-input" accept="image/*,.svg" style="display:none;">
                </label>
                <button id="wr-pskin-add-btn" class="wr-btn-primary" style="flex:1;">Appliquer</button>
              </div>
            </div>

            <div class="wr-player-skins-list"></div>
          </div>

          <!-- SKIN GLOBAL -->
          <div class="wr-card">
            <div class="wr-section-title">🎭 Skin Global (Fallback)</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <div class="wr-input-group">
                <input type="text" id="wr-skin-input" class="wr-input-style" value="${STATE.globalSkin}" placeholder="Pseudo ou URL (.svg)">
                <button id="wr-skin-save" class="wr-btn-primary">OK</button>
              </div>
              <label class="wr-btn-secondary" style="cursor:pointer; display:block;">
                📁 Fichier local (SVG/Image)
                <input type="file" id="wr-skin-file-input" accept="image/*,.svg" style="display:none;">
              </label>
              <span id="wr-skin-status" style="font-size: 10px; color: #a78bfa;">${STATE.activeSkinUrl ? 'Skin actif' : ''}</span>
            </div>
          </div>

          <!-- TOMBSTONE CHANGER -->
          <div class="wr-card">
            <div class="wr-section-title">🪦 Tombstone Changer</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <div class="wr-input-group">
                <input type="text" id="wr-tombstone-input" class="wr-input-style" value="${STATE.globalTombstone}" placeholder="URL ou ID (ex: T68)">
                <button id="wr-tombstone-save" class="wr-btn-primary">OK</button>
              </div>
              <label class="wr-btn-secondary" style="cursor:pointer; display:block;">
                📁 Fichier local (SVG/Image)
                <input type="file" id="wr-tombstone-file-input" accept="image/*,.svg" style="display:none;">
              </label>
              <span id="wr-tombstone-status" style="font-size: 10px; color: #a78bfa;">${STATE.activeTombstoneUrl ? 'Pierre tombale active' : ''}</span>
            </div>
          </div>

          <!-- PET CHANGER GLOBAL -->
          <div class="wr-card">
            <div class="wr-section-title">🐾 Pet Global (Fallback)</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div class="wr-input-group">
                <input type="text" id="wr-pet-global-input" class="wr-input-style" value="${STATE.globalPet}" placeholder="ID,couleur (ex: PF041,3) ou URL">
                <button id="wr-pet-global-save" class="wr-btn-primary">OK</button>
              </div>
              <label class="wr-btn-secondary" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
                📁 Fichier local (SVG/Image)
                <input type="file" id="wr-pet-global-file" accept="image/*,.svg" style="display:none;">
              </label>
              <span id="wr-pet-global-status" style="font-size:10px;color:#a78bfa;">${STATE.activeGlobalPetUrl ? 'Pet global actif' : ''}</span>
            </div>
          </div>

          <!-- PET PAR JOUEUR -->
          <div class="wr-card">
            <div class="wr-section-title">🐾 Pet par Joueur</div>
            <span class="wr-label-sm">Joueurs en partie :</span>
            <div class="wr-player-pet-chips wr-chips-container"></div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">
              <input type="text" id="wr-ppet-target" class="wr-input-style" placeholder="Pseudo du joueur ciblé...">
              <input type="text" id="wr-ppet-source" class="wr-input-style" placeholder="ID,couleur (ex: PF041,3) ou URL">
              <div style="display:flex;gap:6px;">
                <label class="wr-btn-secondary" style="flex:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px;">
                  📁 Fichier
                  <input type="file" id="wr-ppet-file" accept="image/*,.svg" style="display:none;">
                </label>
                <button id="wr-ppet-add-btn" class="wr-btn-primary" style="flex:1;">Appliquer</button>
              </div>
            </div>
            <div class="wr-player-pets-list" style="margin-top:8px;"></div>
          </div>

          <!-- SOUND CHANGER -->
          <div class="wr-card">
            <div class="wr-section-title">🔊 Sound Changer</div>
            
            <span class="wr-label-sm">Raccourcis sons Wolfy :</span>
            <div class="wr-chips-container">
              <span class="wr-chip" data-sound="bip">bip</span>
              <span class="wr-chip" data-sound="begin_day">begin_day</span>
              <span class="wr-chip" data-sound="begin_night">begin_night</span>
              <span class="wr-chip" data-sound="morning">morning</span>
              <span class="wr-chip" data-sound="werewolves_time">werewolves_time</span>
              <span class="wr-chip" data-sound="toggle">toggle</span>
              <span class="wr-chip" data-sound="applause">applause</span>
              <span class="wr-chip" data-sound="pressure">pressure</span>
              <span class="wr-chip" data-sound="character_hover">character_hover</span>
              <span class="wr-chip" data-sound="forest">forest</span>
              <span class="wr-chip" data-sound="end_loading">end_loading</span>
              <span class="wr-chip" data-sound="shotgun">shotgun</span>
              <span class="wr-chip" data-sound="player_join">player_join</span>
              <span class="wr-chip" data-sound="lightning">lightning</span>
              <span class="wr-chip" data-sound="village_sad">village_sad</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
              <input type="text" id="wr-sound-target" class="wr-input-style" placeholder="Son cible (ex: bip, shotgun)">
              <input type="text" id="wr-sound-url" class="wr-input-style" placeholder="URL (.mp3/.ogg) ou vide pour Mute">

              <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:2px;">
                <label class="wr-btn-secondary" style="flex:1; cursor:pointer;">
                  📁 Fichier Audio
                  <input type="file" id="wr-sound-file-input" accept="audio/mp3, audio/ogg, audio/wav, audio/*" style="display:none;">
                </label>
                <button id="wr-sound-add-btn" class="wr-btn-primary" style="flex:1;">Ajouter la règle</button>
              </div>
            </div>

            <div class="wr-sound-rules-list"></div>
          </div>

        </div>

        <!-- GAME INFO TAB -->
        <div class="wr-tab-panel" data-panel="gameinfo" style="display:none;">
          <button class="wr-game-fetch-btn" id="wr-gameinfo-fetch-btn">🔍 Actualiser les infos de la partie</button>
          <div class="wr-game-info-content">
            <div class="wr-empty-state">Clique sur le bouton pour charger les infos de la partie en cours.</div>
          </div>
        </div>

        <!-- SETTINGS TAB -->
        <div class="wr-tab-panel" data-panel="settings" style="display:none;">
          <div class="wr-card">
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
              <input type="checkbox" id="wr-auto-next" ${STATE.autoNext ? 'checked' : ''}>
              <span style="font-size:12px; font-weight:600;">Partie suivante automatique</span>
            </label>
          </div>
        </div>
      </div>

      <button class="wr-toggle" title="Ouvrir/Fermer Wolfy Tools">📜</button>
    `;

    document.body.appendChild(root);

    // Refresh
    root.querySelector('.wr-refresh').addEventListener('click', () => {
      scanPlayersFromDOM();
      STATE.lastResult = null;
      render();
    });

    // Tabs
    root.querySelector('.wr-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.wr-tab');
      if (!tab) return;
      const targetTab = tab.dataset.tab;
      root.querySelectorAll('.wr-tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === targetTab));
      root.querySelectorAll('.wr-tab-panel').forEach(p => {
        p.style.display = p.dataset.panel === targetTab ? 'block' : 'none';
      });
      if (targetTab === 'deaths') renderDeathLog();
      if (targetTab === 'changer') {
        renderSoundRules();
        renderPlayerSkinsList();
        renderPlayerChips();
        renderPlayerPetsList();
        renderPlayerPetChips();
      }
      if (targetTab === 'gameinfo') fetchGameInfo();
    });

    // Draw
    root.querySelector('.wr-draw-btn').addEventListener('click', drawRandomPlayer);

    // Checkboxes exclusion
    root.querySelector('.wr-players').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const playerName = e.target.value;
        if (e.target.checked) STATE.excluded.delete(playerName);
        else STATE.excluded.add(playerName);
        render();
      }
    });

    // Toggle Auto Next
    root.querySelector('#wr-auto-next').addEventListener('change', (e) => {
      STATE.autoNext = e.target.checked;
      safeSetStorage('wr_autoNext', STATE.autoNext);
      if (STATE.autoNext) tryAutoNext();
    });

    // ─── HANDLERS SKIN PAR JOUEUR ───────────────────────────────────────────
    const pskinTargetInput = root.querySelector('#wr-pskin-target');
    const pskinSourceInput = root.querySelector('#wr-pskin-source');
    const pskinFileInput   = root.querySelector('#wr-pskin-file-input');
    const pskinAddBtn      = root.querySelector('#wr-pskin-add-btn');

    let tempPlayerSkinFileUrl = null;
    let tempPlayerSkinFileName = null;

    pskinFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        tempPlayerSkinFileUrl = evt.target.result;
        tempPlayerSkinFileName = file.name;
        pskinSourceInput.value = `Fichier local : ${file.name}`;
      };
      reader.readAsDataURL(file);
    });

    pskinAddBtn.addEventListener('click', async () => {
      const target = pskinTargetInput.value.trim();
      const source = pskinSourceInput.value.trim();

      if (!target) {
        alert("Veuillez entrer le pseudo du joueur.");
        return;
      }
      if (!source) {
        alert("Veuillez entrer un skin (pseudo, URL ou fichier).");
        return;
      }

      let finalUrl = '';
      let skinLabel = source;

      if (tempPlayerSkinFileUrl && source.includes(tempPlayerSkinFileName)) {
        finalUrl = tempPlayerSkinFileUrl;
        skinLabel = tempPlayerSkinFileName;
      } else {
        const resolved = await resolveSkinToUrl(source);
        if (!resolved.url) {
          alert("Impossible de trouver le skin demandé.");
          return;
        }
        finalUrl = resolved.url;
        skinLabel = resolved.label || source;
      }

      STATE.playerSkins[target.toLowerCase()] = {
        target: target,
        skinInput: skinLabel,
        url: finalUrl
      };

      safeSetStorage('wr_playerSkins', JSON.stringify(STATE.playerSkins));

      pskinTargetInput.value = '';
      pskinSourceInput.value = '';
      tempPlayerSkinFileUrl = null;
      tempPlayerSkinFileName = null;

      renderPlayerSkinsList();
      replaceCharacterSkins();
    });

    // ─── HANDLERS SKIN CHANGER GLOBAL ────────────────────────────────────────
    const skinInput = root.querySelector('#wr-skin-input');
    const skinSaveBtn = root.querySelector('#wr-skin-save');
    const skinStatus = root.querySelector('#wr-skin-status');
    const skinFileInput = root.querySelector('#wr-skin-file-input');

    skinSaveBtn.addEventListener('click', () => {
      resolveAndSaveGlobalSkin(skinInput.value, skinStatus);
    });

    skinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') resolveAndSaveGlobalSkin(skinInput.value, skinStatus);
    });

    skinFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        STATE.globalSkin = file.name;
        STATE.activeSkinUrl = dataUrl;
        skinInput.value = file.name;
        safeSetStorage('wr_globalSkin', file.name);
        safeSetStorage('wr_activeSkinUrl', dataUrl);
        skinStatus.textContent = `Fichier local (${file.name}) appliqué !`;
        replaceCharacterSkins();
      };
      reader.readAsDataURL(file);
    });

    // ─── HANDLERS TOMBSTONE CHANGER ─────────────────────────────────────────
    const tombInput = root.querySelector('#wr-tombstone-input');
    const tombSaveBtn = root.querySelector('#wr-tombstone-save');
    const tombStatus = root.querySelector('#wr-tombstone-status');
    const tombFileInput = root.querySelector('#wr-tombstone-file-input');

    tombSaveBtn.addEventListener('click', () => {
      resolveAndSaveTombstone(tombInput.value, tombStatus);
    });

    tombInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') resolveAndSaveTombstone(tombInput.value, tombStatus);
    });

    tombFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        STATE.globalTombstone = file.name;
        STATE.activeTombstoneUrl = dataUrl;
        tombInput.value = file.name;
        safeSetStorage('wr_globalTombstone', file.name);
        safeSetStorage('wr_activeTombstoneUrl', dataUrl);
        tombStatus.textContent = `Pierre tombale locale (${file.name}) appliquée !`;
        replaceTombstones();
      };
      reader.readAsDataURL(file);
    });

    // ─── HANDLERS PET GLOBAL ─────────────────────────────────────────────────
    const petGlobalInput   = root.querySelector('#wr-pet-global-input');
    const petGlobalSaveBtn = root.querySelector('#wr-pet-global-save');
    const petGlobalStatus  = root.querySelector('#wr-pet-global-status');
    const petGlobalFile    = root.querySelector('#wr-pet-global-file');

    const applyGlobalPet = (val, fromFile = false) => {
      if (!val) {
        STATE.globalPet = '';
        STATE.activeGlobalPetUrl = '';
        localStorage.removeItem('wr_globalPet');
        localStorage.removeItem('wr_activeGlobalPetUrl');
        if (petGlobalStatus) petGlobalStatus.textContent = 'Pet global désactivé';
        return;
      }
      const resolved = fromFile ? { url: val, label: 'Fichier local' } : resolvePetToUrl(val);
      if (resolved.url) {
        STATE.globalPet = val;
        STATE.activeGlobalPetUrl = resolved.url;
        safeSetStorage('wr_globalPet', val);
        safeSetStorage('wr_activeGlobalPetUrl', resolved.url);
        if (petGlobalStatus) petGlobalStatus.textContent = 'Pet global appliqué !';
        replacePets();
      } else {
        if (petGlobalStatus) petGlobalStatus.textContent = 'Format invalide.';
      }
    };

    petGlobalSaveBtn.addEventListener('click', () => applyGlobalPet(petGlobalInput.value.trim()));
    petGlobalInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyGlobalPet(petGlobalInput.value.trim()); });

    petGlobalFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        petGlobalInput.value = file.name;
        applyGlobalPet(evt.target.result, true);
      };
      reader.readAsDataURL(file);
    });

    // ─── HANDLERS PET PAR JOUEUR ─────────────────────────────────────────────
    const ppetTargetInput = root.querySelector('#wr-ppet-target');
    const ppetSourceInput = root.querySelector('#wr-ppet-source');
    const ppetFileInput   = root.querySelector('#wr-ppet-file');
    const ppetAddBtn      = root.querySelector('#wr-ppet-add-btn');

    let tempPetFileUrl = null, tempPetFileName = null;

    ppetFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        tempPetFileUrl  = evt.target.result;
        tempPetFileName = file.name;
        ppetSourceInput.value = 'Fichier local : ' + file.name;
      };
      reader.readAsDataURL(file);
    });

    ppetAddBtn.addEventListener('click', () => {
      const target = ppetTargetInput.value.trim();
      const source = ppetSourceInput.value.trim();
      if (!target) { alert('Veuillez entrer le pseudo du joueur.'); return; }
      if (!source) { alert('Veuillez entrer un pet (ID,couleur ou URL ou fichier).'); return; }

      let finalUrl = '', petLabel = source;

      if (tempPetFileUrl && source.includes(tempPetFileName)) {
        finalUrl = tempPetFileUrl;
        petLabel = tempPetFileName;
      } else {
        const resolved = resolvePetToUrl(source);
        if (!resolved.url) { alert('Format invalide. Utilisez "PF041,3" ou une URL.'); return; }
        finalUrl = resolved.url;
        petLabel = resolved.label || source;
      }

      STATE.playerPets[target.toLowerCase()] = { target, petInput: petLabel, url: finalUrl };
      safeSetStorage('wr_playerPets', JSON.stringify(STATE.playerPets));
      ppetTargetInput.value = '';
      ppetSourceInput.value = '';
      tempPetFileUrl = null; tempPetFileName = null;
      renderPlayerPetsList();
      replacePets();
    });

    // ─── GAME INFO FETCH BTN ─────────────────────────────────────────────────
    root.querySelector('#wr-gameinfo-fetch-btn').addEventListener('click', fetchGameInfo);

    // ─── HANDLERS SOUND CHANGER ─────────────────────────────────────────────
    const soundTargetInput = root.querySelector('#wr-sound-target');
    const soundUrlInput    = root.querySelector('#wr-sound-url');
    const soundFileInput   = root.querySelector('#wr-sound-file-input');
    const soundAddBtn      = root.querySelector('#wr-sound-add-btn');

    let tempLocalAudioData = null;
    let tempLocalAudioName = null;

    root.querySelectorAll('.wr-chip[data-sound]').forEach(chip => {
      chip.addEventListener('click', () => {
        soundTargetInput.value = chip.dataset.sound;
      });
    });

    soundFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        tempLocalAudioData = evt.target.result;
        tempLocalAudioName = file.name;
        soundUrlInput.value = `Fichier local : ${file.name}`;
      };
      reader.readAsDataURL(file);
    });

    soundAddBtn.addEventListener('click', () => {
      const target = soundTargetInput.value.trim();
      const urlVal = soundUrlInput.value.trim();

      if (!target) {
        alert("Veuillez indiquer le nom du son d'origine.");
        return;
      }

      let replacement = '';
      let label = 'Mute (Bloqué)';

      if (tempLocalAudioData && urlVal.includes(tempLocalAudioName)) {
        replacement = tempLocalAudioData;
        label = tempLocalAudioName;
      } else if (urlVal && (urlVal.startsWith('http://') || urlVal.startsWith('https://'))) {
        replacement = urlVal;
        label = urlVal.split('/').pop();
      }

      STATE.soundRules.push({ target, replacement, label });
      safeSetStorage('wr_soundRules', JSON.stringify(STATE.soundRules));

      soundTargetInput.value = '';
      soundUrlInput.value = '';
      tempLocalAudioData = null;
      tempLocalAudioName = null;

      renderSoundRules();
    });

    // Clear deaths
    root.querySelector('.wr-clear-deaths-btn').addEventListener('click', () => {
      DEATH_LOG.length = 0;
      renderDeathLog();
    });

    // Drag & drop
    makeDraggable(root);
  };

  // ─── DRAG & DROP ──────────────────────────────────────────────────────────
  // ─── PANEL SMART POSITIONING ────────────────────────────────────────────────
  // Positionne le panel autour du bouton selon sa position dans l'écran.
  // Quadrant détecté → panel s'ouvre du côté opposé pour rester visible.
  // Dernières dimensions connues du panel (mises à jour quand il est visible).
  // Évite le problème offsetHeight=0 au premier frame après display:flex.

  const positionPanel = () => {
    const panel  = document.querySelector('.wr-panel');
    const toggle = document.querySelector('.wr-toggle');
    if (!panel || !toggle) return;

    const MARGIN = 10;
    const W      = window.innerWidth;
    const H      = window.innerHeight;
    const tRect  = toggle.getBoundingClientRect();
    const pW     = panel.offsetWidth || 350;

    // Centre du bouton pour détecter le quadrant
    const cx = tRect.left + tRect.width  / 2;
    const cy = tRect.top  + tRect.height / 2;

    // ── Axe horizontal ──────────────────────────────────────────────────────
    let left = (cx < W / 2) ? tRect.left : tRect.right - pW;
    left = Math.max(MARGIN, Math.min(left, W - pW - MARGIN));

    // ── Axe vertical ────────────────────────────────────────────────────────
    // Bouton en bas → panel ancré par le BAS (bottom = distance depuis bas écran)
    // Bouton en haut → panel ancré par le HAUT (top = tRect.bottom + marge)
    // Ancrer par le bas évite le bug de hauteur variable : peu importe la taille
    // du panel, son bord bas colle toujours au bord haut du bouton.
    panel.style.left   = left + 'px';
    panel.style.right  = 'auto';

    if (cy > H / 2) {
      // Bouton en bas → panel au-dessus, ancré par son bord bas
      const distFromBottom = H - tRect.top + MARGIN;
      panel.style.bottom = distFromBottom + 'px';
      panel.style.top    = 'auto';
    } else {
      // Bouton en haut → panel en-dessous, ancré par son bord haut
      panel.style.top    = (tRect.bottom + MARGIN) + 'px';
      panel.style.bottom = 'auto';
    }
  };

  const makeDraggable = (root) => {
    const toggle = root.querySelector('.wr-toggle');
    const DRAG_THRESHOLD = 5;

    let hasDragged = false;
    let startX, startY;
    // Offset de la souris à l'intérieur du bouton au moment du mousedown.
    // Permet de déplacer le bouton sans saut ni écart avec le curseur.
    let mouseOffsetX = 0;
    let mouseOffsetY = 0;

    toggle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      hasDragged = false;
      startX = e.clientX;
      startY = e.clientY;

      // Convertir bottom/right en top/left dès le mousedown,
      // avant le premier mousemove, pour éviter tout conflit CSS.
      const rect = toggle.getBoundingClientRect();
      toggle.style.left   = rect.left + 'px';
      toggle.style.top    = rect.top  + 'px';
      toggle.style.right  = 'auto';
      toggle.style.bottom = 'auto';

      mouseOffsetX = e.clientX - rect.left;
      mouseOffsetY = e.clientY - rect.top;

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (startX === undefined) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!hasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      hasDragged = true;

      const MARGIN  = 4;
      const W       = window.innerWidth;
      const H       = window.innerHeight;
      const btnSize = 44;

      // Position coin haut-gauche du bouton = position souris - offset capturé au mousedown.
      // Le point d'accroche reste exactement là où la souris a cliqué, sans aucun saut.
      const newLeft = Math.max(MARGIN, Math.min(e.clientX - mouseOffsetX, W - btnSize - MARGIN));
      const newTop  = Math.max(MARGIN, Math.min(e.clientY - mouseOffsetY, H - btnSize - MARGIN));

      // On déplace le toggle directement (c'est lui qui est position:fixed)
      toggle.style.left   = newLeft + 'px';
      toggle.style.top    = newTop  + 'px';
      toggle.style.right  = 'auto';
      toggle.style.bottom = 'auto';

      if (STATE.isOpen) positionPanel();
    });

    document.addEventListener('mouseup', () => {
      startX = undefined;
      // hasDragged reste true jusqu'au prochain mousedown (pour bloquer le click)
    });

    toggle.addEventListener('click', (e) => {
      if (hasDragged) {
        hasDragged = false;
        return;
      }
      hasDragged = false;

      STATE.isOpen = !STATE.isOpen;
      if (STATE.isOpen) {
        scanPlayersFromDOM();
        render(); // affiche le panel (display:flex)
        // Double rAF : le 1er frame applique display:flex, le 2e frame a les vraies dimensions
        requestAnimationFrame(() => requestAnimationFrame(positionPanel));
      } else {
        render();
      }
    });

    window.addEventListener('resize', () => {
      if (STATE.isOpen) positionPanel();
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
    replaceTombstones();
    replaceCharacterSkins();
    replacePets();
    new MutationObserver(replaceEyesImage).observe(document.body, { childList: true, subtree: true });
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();