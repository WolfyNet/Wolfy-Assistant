(() => {
  // ─── STATE ────────────────────────────────────────────────────────────────
  const safeGetStorage = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const safeSetStorage = (key, val) => {
    try { localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val); } 
    catch (e) { alert("Erreur de stockage : Le fichier est probablement trop lourd."); }
  };

  const STATE = {
    isOpen: false,
    players: [],
    excluded: new Set(),
    lastResult: null,
    autoNext: localStorage.getItem('wr_autoNext') === 'true',
    autoMayor: localStorage.getItem('wr_autoMayor') === 'true',
    autoMayorSpeech: localStorage.getItem('wr_autoMayorSpeech') || 'Votez pour moi !',
    enhanceLeaderboard: localStorage.getItem('wr_enhanceLeaderboard') !== 'false',
    spamPlace: localStorage.getItem('wr_spamPlace') === 'true',
    keybinds: JSON.parse(localStorage.getItem('wr_keybinds') || '{"spamPlace":"KeyX"}'),
    lastProfileFetched: null,
    globalSkin: localStorage.getItem('wr_globalSkin') || '',
    activeSkinUrl: localStorage.getItem('wr_activeSkinUrl') || '',
    playerSkins: JSON.parse(localStorage.getItem('wr_playerSkins') || '{}'),
    globalTombstone: localStorage.getItem('wr_globalTombstone') || '',
    activeTombstoneUrl: localStorage.getItem('wr_activeTombstoneUrl') || '',
    globalPet: localStorage.getItem('wr_globalPet') || '',
    activeGlobalPetUrl: localStorage.getItem('wr_activeGlobalPetUrl') || '',
    playerPets: JSON.parse(localStorage.getItem('wr_playerPets') || '{}'),
    soundRules: JSON.parse(localStorage.getItem('wr_soundRules') || '[]'),
    autoNinja: safeGetStorage('wr_autoNinja', false),
    ninjaTargetPlayer: null,
    gameInfo: null,
  };

  let lastFetchedGameId = null;

  const formatKeyCode = (code) => {
    if (!code) return 'Aucun';
    return code.replace('Key', '').replace('Digit', '').replace('Control', 'Ctrl');
  };

  // ─── STYLES CSS ─────────────────────────────────────────────────────────
  const injectStyles = () => {
    if (document.getElementById('wr-styles')) return;

    const style = document.createElement('style');
    style.id = 'wr-styles';
    style.textContent = `
      #wr-root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #e2e8f0; }
      #wr-root * { box-sizing: border-box !important; }

      .wr-panel { position: fixed; width: 350px; max-height: 80vh; background: #151221; border: 1px solid rgba(138, 115, 255, 0.25); border-radius: 12px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6); overflow: hidden; display: none; flex-direction: column; z-index: 999998; }
      #wr-root.is-open .wr-panel { display: flex; }

      .wr-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
      .wr-header h2 { margin: 0; font-size: 14px; font-weight: 700; color: #ffffff; }
      .wr-refresh { background: transparent; border: none; color: #a78bfa; font-size: 16px; cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: background 0.2s; }
      .wr-refresh:hover { background: rgba(167, 139, 250, 0.15); }

      .wr-tabs { display: flex; background: rgba(0, 0, 0, 0.25); border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
      .wr-tab { flex: 1; padding: 10px 0; background: transparent; border: none; color: #71717a; font-size: 15px; cursor: pointer; transition: all 0.2s ease; border-bottom: 2px solid transparent; display: flex; justify-content: center; align-items: center; }
      .wr-tab:hover { color: #d4d4d8; background: rgba(255, 255, 255, 0.02); }
      .wr-tab.is-active { color: #a78bfa; border-bottom-color: #a78bfa; background: rgba(167, 139, 250, 0.08); }

      .wr-tab-panel { padding: 12px; max-height: 380px; overflow-y: auto; overflow-x: hidden; }
      .wr-tab-panel::-webkit-scrollbar { width: 5px; }
      .wr-tab-panel::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }

      .wr-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 10px; margin-bottom: 10px; }
      .wr-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a78bfa; margin-bottom: 8px; }

      .wr-input-style { width: 100%; padding: 7px 10px; background: #0f0d18; border: 1px solid rgba(255, 255, 255, 0.12); color: #fff; border-radius: 6px; font-size: 11px; outline: none; }
      .wr-input-style:focus { border-color: #7c4dff; }
      .wr-input-group { display: flex; gap: 6px; }

      .wr-btn-primary { padding: 8px 14px; background: linear-gradient(135deg, #7c4dff, #9c6dff); border: none; color: #fff; border-radius: 7px; cursor: pointer; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; transition: opacity 0.15s; }
      .wr-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
      .wr-btn-secondary { padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); color: #c4b5fd; border-radius: 7px; cursor: pointer; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
      .wr-btn-secondary:hover { background: rgba(196,181,253,0.12); border-color: rgba(196,181,253,0.3); color: #fff; }
      .wr-btn-secondary.is-binding { background: #eab308; color: #000; border-color: #facc15; animation: pulse 1s infinite; }

      .wr-chips-container { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
      .wr-chip { display: inline-block; background: rgba(124, 77, 255, 0.12); border: 1px solid rgba(124, 77, 255, 0.3); color: #c4b5fd; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer; transition: all 0.15s ease; }
      .wr-chip:hover { background: #7c4dff; color: #fff; }

      .wr-item-row { display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); padding: 6px 8px; border-radius: 6px; margin-top: 4px; font-size: 11px; }
      .wr-item-del { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 13px; opacity: 0.7; }
      .wr-item-del:hover { opacity: 1; }

      .wr-players { display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; margin-bottom: 10px; }
      .wr-player-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; cursor: pointer; }
      .wr-player-item.is-excluded { opacity: 0.4; text-decoration: line-through; }

      #wr-root input[type="checkbox"] { appearance: none; width: 16px; height: 16px; border: 1px solid #5c5270; border-radius: 4px; background: #0f0d18; cursor: pointer; position: relative; }
      #wr-root input[type="checkbox"]:checked { background: #7c4dff; border-color: #7c4dff; }
      #wr-root input[type="checkbox"]:checked::after { content: '✓'; position: absolute; color: #fff; font-size: 11px; top: 50%; left: 50%; transform: translate(-50%, -55%); }

      .wr-action-area { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
      .wr-result { font-size: 15px; font-weight: 800; color: #c4b5fd; min-height: 36px; background: rgba(124,77,255,0.1); border: 1px solid rgba(124,77,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
      .wr-draw-btn { width: 100%; padding: 10px 0; background: linear-gradient(135deg, #7c4dff, #9c6dff); border: none; color: #fff; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; }
      
      .wr-clear-deaths-btn { width: 100%; padding: 9px 0; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171; border-radius: 7px; cursor: pointer; font-weight: 600; font-size: 12px; }
      .wr-death-row { background: rgba(255, 255, 255, 0.03); border-left: 3px solid #ef4444; padding: 8px; border-radius: 0 6px 6px 0; margin-bottom: 6px; }
      .wr-death-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
      .wr-death-name { font-weight: 700; color: #fff; }
      .wr-death-role { background: rgba(239, 68, 68, 0.2); color: #fca5a5; font-size: 9px; padding: 1px 5px; border-radius: 3px; }
      .wr-death-time { margin-left: auto; font-size: 10px; color: #71717a; }
      .wr-death-msg { color: #a1a1aa; font-size: 10px; }

      .wr-toggle { position: fixed; bottom: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #7c4dff, #a06be0); border: none; color: #fff; font-size: 20px; cursor: grab; box-shadow: 0 4px 16px rgba(124, 77, 255, 0.45); z-index: 999999; display: flex; align-items: center; justify-content: center; transition: background 0.2s, box-shadow 0.2s, transform 0.1s; user-select: none; }
      .wr-toggle:hover { transform: scale(1.08); }
      .wr-toggle:active { cursor: grabbing; transform: scale(0.95); }
      
      .wr-toggle.is-spamming { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 0 15px 5px rgba(16, 185, 129, 0.6); border: 2px solid #a7f3d0; animation: pulse-spam 1s infinite alternate; }
      @keyframes pulse-spam { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
      @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

      .wr-empty-state { text-align: center; color: #71717a; font-size: 11px; padding: 16px 0; }

      div[class*="gameLine"] div[class*="deathInfo"] { white-space: nowrap !important; width: max-content !important; min-width: max-content !important; flex-shrink: 0 !important; padding: 0 12px !important; }
      div[class*="deathInfo"][data-wr-death] p[class*="text"] { display: none !important; }
      div[class*="deathInfo"][data-wr-death]::after { content: attr(data-wr-death); color: #ffffff; font-size: 14px; font-weight: 700; margin-left: 6px; white-space: nowrap; }

      .wr-history-extension { width: 100%; background: rgba(15, 13, 25, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.05); }
      .wr-history-toggle { width: 100%; background: transparent; border: none; color: #a78bfa; padding: 6px 0; font-size: 10px; font-weight: 700; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
      .wr-history-toggle:hover { background: rgba(167, 139, 250, 0.1); color: #c4b5fd; }
      .wr-history-toggle svg { transition: transform 0.2s; }
      .wr-history-toggle.is-open svg { transform: rotate(45deg); }
      .wr-history-content { display: none; flex-direction: column; padding: 10px 16px; background: rgba(0, 0, 0, 0.25); border-top: 1px solid rgba(255, 255, 255, 0.03); }
      .wr-hc-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
      .wr-hc-stat { flex: 1; background: rgba(255, 255, 255, 0.04); padding: 6px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid rgba(255, 255, 255, 0.03); font-size: 12px; }
      .wr-hc-stat span { font-size: 9px; color: #94a3b8; margin-bottom: 2px; }
      .wr-roles-container { display: flex; flex-wrap: wrap; gap: 4px; padding-top: 8px; border-top: 1px dashed rgba(255, 255, 255, 0.1); }
    `;
    document.head.appendChild(style);
  };

  const findElByText = (text) => {
    try {
      return document.evaluate(`//*[text()='${text}']`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch(e) { return null; }
  };

  const simulateClick = (element) => {
    if (!element) return;
    try { element.click(); } catch(e) {}
    setTimeout(() => {
      try {
        element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        element.dispatchEvent(new PointerEvent('click', { bubbles: true }));
      } catch(e){}
    }, 50);
  };

  const setInputValue = (input, value) => {
    if (!input) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // ─── GAME INFO FETCH & RENDER ──────────────────────────────────────────
  const fetchGameInfo = (gameId) => {
    if (!gameId) return;
    fetch(`https://wolfy.net/api/game/${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          STATE.gameInfo = {
            id: data.id,
            instanceId: data.instanceId,
            slots: data.settings?.slots ?? 'N/A',
            balancing: data.settings?.balancing ?? 'N/A'
          };
          renderGameInfo();
        }
      })
      .catch(() => {});
  };

const renderGameInfo = () => {
  const container = document.getElementById('wr-gameinfo-container');
  if (!container) return;
  if (!STATE.gameInfo) {
    container.innerHTML = `<div class="wr-empty-state">Aucune partie détectée actuellement.</div>`;
    return;
  }
  const { id, instanceId, slots, balancing } = STATE.gameInfo;
  const balancingColor = balancing > 0 ? '#4ade80' : (balancing < 0 ? '#ef4444' : '#ffffff');

  container.innerHTML = `
    <div class="wr-item-row">
      <span><strong>ID:</strong></span>
      <span style="color:#c4b5fd; font-weight:600;">${id}</span>
    </div>
    <div class="wr-item-row">
      <span><strong>Instance ID:</strong></span>
      <span style="color:#c4b5fd; font-size:10px;">${instanceId}</span>
    </div>
    <div class="wr-item-row">
      <span><strong>Slots:</strong></span>
      <span style="color:#c4b5fd; font-weight:600;">${slots}</span>
    </div>
    <div class="wr-item-row">
      <span><strong>Balancing:</strong></span>
      <span style="color:${balancingColor}; font-weight:700;">${balancing}</span>
    </div>
    
    <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
      <div class="wr-section-title">🎭 Détection Nicknames</div>
      <div id="wr-nicknames-list" class="wr-empty-state">Analyse des pseudos...</div>
    </div>
  `;

  checkNicknames();
};

const checkNicknames = async () => {
  const listEl = document.getElementById('wr-nicknames-list');
  if (!listEl) return;
  if (!STATE.players || STATE.players.length === 0) {
    listEl.innerHTML = `<span style="color:#71717a;">Aucun joueur détecté.</span>`;
    return;
  }

  const results = await Promise.all(
    STATE.players.map(async (pseudo) => {
      try {
        const res = await fetch(`https://wolfy.net/api/leaderboard/player/${encodeURIComponent(pseudo)}`);
        if (res.status === 404) {
          return { pseudo, isNickname: true };
        }
        const data = await res.json();
        if (data.message === 'user_not_found') {
          return { pseudo, isNickname: true };
        }
      } catch (e) {}
      return { pseudo, isNickname: false };
    })
  );

  const nicknames = results.filter(r => r.isNickname);

  if (nicknames.length === 0) {
    listEl.innerHTML = `<span style="color:#4ade80;">Aucun nickname détecté.</span>`;
  } else {
    listEl.innerHTML = nicknames.map(n => `
      <div class="wr-item-row">
        <span style="color:#ff7070; font-weight:bold;">⚠️ ${n.pseudo}</span>
        <span style="font-size:9px; background:rgba(239, 68, 68, 0.2); color:#fca5a5; padding:2px 6px; border-radius:4px;">Nickname</span>
      </div>
    `).join('');
  }
};

  // ─── LEADERBOARD ENHANCER ─────────────────────────────────────────────────
  let currentLeaderboardHistory = [];

  const ROLE_NAMES_FR = {
    witch: 'Sorcière', poisonerWitch: 'Sorcière', hunter: 'Chasseur', guard: 'Garde', cupid: 'Cupidon',
    dictator: 'Dictateur', blackWolf: 'Loup Noir', wolfRidingHood: 'Chaperon Loup', redRidingHood: 'Chaperon Rouge',
    necromencer: 'Nécromancien', seer: 'Voyante', talkativeSeer: 'Bavarde', elder: 'Ancien', shepherd: 'Berger',
    piper: 'Joueur de Flûte', fox: 'Renard', bear: "Montreur d'Ours", stuttering: 'Bègue',
    wildChild: 'Enfant Sauvage', dogWolf: 'Chien-Loup', thief: 'Voleur', actor: 'Acteur', scandalmonger: 'Colporteur', 
    scapegoat: 'Bouc Émissaire', angel: 'Ange', prejudiced: 'Manipulateur', stutteringJudge: 'Juge Bègue',
    threeBrothers: '3 Frères', twoSisters: '2 Sœurs', piedPiper: 'Joueur de Flûte',
    accursedWolfFather: 'Père des Loups', bigBadWolf: 'Grand Méchant Loup', whiteWolf: 'Loup Blanc',
    villager: 'Villageois', werewolf: 'Loup-Garou', whiteWerewolf: 'Loup Blanc',
    heir: 'Héritier', gravedigger: 'Fossoyeur', rumplestiltskin: 'Tracassin'
  };

  const WOLF_ROLES = new Set(['werewolf','blackWolf','wolfRidingHood','bigBadWolf','whiteWerewolf','whiteWolf','accursedWolfFather','dogWolf']);

  const formatCompactDeath = (reason) => {
    if (!reason) return 'En vie 🏆';
    const d = reason.dayNumber ? ` J${reason.dayNumber}` : '';
    switch(reason.type) {
      case 'night': return `Nuit${d}`;
      case 'voteVillagers': return `Vote${d}`;
      case 'hunter': return `Chass${d}`;
      case 'dictator': return `Dict${d}`;
      case 'lover': return `Chagrin${d}`;
      case 'mayorKill': return `Maire${d}`;
      default: return `Mort${d}`;
    }
  };

  const cleanUpLeaderboard = () => {
    document.querySelectorAll('.wr-history-extension').forEach(el => el.remove());
    document.querySelectorAll('div[data-wr-death]').forEach(el => el.removeAttribute('data-wr-death'));
  };

  const injectHistoryDetails = () => {
    if (!STATE.enhanceLeaderboard || currentLeaderboardHistory.length === 0) return;

    const elements = document.querySelectorAll('div[class*="gameLine"]');
    const rows = Array.from(elements).filter(el => el.className && el.className.includes('gameLine') && !el.className.includes('gameLineContainer'));
    
    rows.forEach((row, index) => {
      const gameData = currentLeaderboardHistory[index];
      if (!gameData) return;

      const deathInfoDiv = row.querySelector('div[class*="deathInfo"]');
      if (deathInfoDiv) {
        const newText = formatCompactDeath(gameData.deathReason);
        if (deathInfoDiv.getAttribute('data-wr-death') !== newText) {
          deathInfoDiv.setAttribute('data-wr-death', newText);
        }
      }

      if (row.querySelector('.wr-history-extension')) return;

      const extDiv = document.createElement('div');
      extDiv.className = 'wr-history-extension';

      const eloColor = gameData.elo > 0 ? '#4ade80' : (gameData.elo < 0 ? '#ef4444' : '#a1a1aa');
      const eloSign = gameData.elo > 0 ? '+' : '';
      const infected = gameData.infected ? '🐺 Oui' : '🛡️ Non';
      
      const rolesHTML = Object.entries(gameData.game?.settings?.roles || {})
        .filter(([k, v]) => v > 0)
        .map(([k, v]) => {
          const name = ROLE_NAMES_FR[k] || k;
          const isWolf = WOLF_ROLES.has(k);
          return `<span class="wr-game-role-chip" style="color:${isWolf?'#fca5a5':'#d4d4d8'}; border-color:${isWolf?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.1)'};">${v > 1 ? v+'× ' : ''}${name}</span>`;
        }).join('');

      extDiv.innerHTML = `
        <button class="wr-history-toggle" title="Détails avancés">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Détails & Rôles
        </button>
        <div class="wr-history-content">
          <div class="wr-hc-grid">
            <div class="wr-hc-stat"><span>XP</span> <b style="color:#c4b5fd;">+${gameData.xp}</b></div>
            <div class="wr-hc-stat"><span>ELO</span> <b style="color:${eloColor};">${eloSign}${gameData.elo}</b></div>
            <div class="wr-hc-stat"><span>Kills</span> <b style="color:#ffffff;">${gameData.killCount}</b></div>
            <div class="wr-hc-stat"><span>Infecté</span> <b style="color:#ffffff;">${infected}</b></div>
          </div>
          <div class="wr-roles-container">${rolesHTML || '<span style="font-size:10px;color:#71717a;">Rôles inconnus</span>'}</div>
        </div>
      `;

      row.appendChild(extDiv);

      const toggleBtn = extDiv.querySelector('.wr-history-toggle');
      const contentBox = extDiv.querySelector('.wr-history-content');
      
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = contentBox.style.display === 'none' || contentBox.style.display === '';
        contentBox.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.classList.toggle('is-open', isHidden);
      });
    });
  };

  // ─── AUTOMATISATIONS ──────────────────────────────────────────────────
  let isClickingNext = false;
  const tryAutoNext = () => {
    if (!STATE.autoNext || isClickingNext) return;
    const targetEl = findElByText('Partie suivante');
    if (targetEl) {
      isClickingNext = true;
      let clickTarget = targetEl; let parent = targetEl.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName === 'BUTTON' || (parent.className && typeof parent.className === 'string' && (parent.className.includes('actionButton') || parent.className.includes('neutralButton')))) {
          clickTarget = parent; break;
        }
        parent = parent.parentElement;
      }
      simulateClick(clickTarget);
      if (clickTarget !== targetEl) simulateClick(targetEl);
      setTimeout(() => { isClickingNext = false; }, 3000);
    }
  };

  let isClickingMayor = false;
  const tryAutoMayor = () => {
    if (!STATE.autoMayor || isClickingMayor) return;
    const targetEl = findElByText('Se présenter');
    if (targetEl) {
      isClickingMayor = true;
      let clickTarget = targetEl; let parent = targetEl.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName === 'BUTTON' || (parent.className && typeof parent.className === 'string' && (parent.className.includes('actionButton') || parent.className.includes('neutralButton')))) {
          clickTarget = parent; break;
        }
        parent = parent.parentElement;
      }
      simulateClick(clickTarget);
      if (clickTarget !== targetEl) simulateClick(targetEl);
      
      setTimeout(() => {
        const inputEl = document.querySelector('form[class*="message"] input#reason, form[class*="message"] input[type="text"]');
        const formBtn = document.querySelector('form[class*="message"] button[type="submit"]');

        if (inputEl) {
          setInputValue(inputEl, STATE.autoMayorSpeech || 'Votez pour moi !');
        }

        setTimeout(() => {
          if (formBtn) simulateClick(formBtn);
        }, 120);
      }, 200);

      setTimeout(() => { isClickingMayor = false; }, 4000);
    }
  };

  // ─── SPAM PLACE HANDLER & KEYBINDS ──────────────────────────────────────
  let isBindingKey = null;

  const syncSpamState = () => {
    window.dispatchEvent(new CustomEvent('WR_TOGGLE_SPAM', { detail: { active: STATE.spamPlace } }));
    const toggle = document.querySelector('.wr-toggle');
    if (toggle) {
      if (STATE.spamPlace) toggle.classList.add('is-spamming');
      else toggle.classList.remove('is-spamming');
    }
    const cb = document.getElementById('wr-spam-place');
    if (cb) cb.checked = STATE.spamPlace;
  };

  document.addEventListener('keyup', (e) => {
    if (isBindingKey) {
      STATE.keybinds[isBindingKey] = e.code;
      safeSetStorage('wr_keybinds', JSON.stringify(STATE.keybinds));
      const btn = document.getElementById('wr-bind-spam');
      if (btn) btn.textContent = formatKeyCode(e.code);
      btn.classList.remove('is-binding');
      isBindingKey = null;
      return;
    }

    const tag = document.activeElement ? document.activeElement.tagName : '';
    const isEditable = document.activeElement && document.activeElement.isContentEditable;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) return;
    
    if (e.code === STATE.keybinds.spamPlace) {
      STATE.spamPlace = !STATE.spamPlace;
      safeSetStorage('wr_spamPlace', STATE.spamPlace);
      syncSpamState();
    }
  });

  // ─── TOMBSTONE, PETS & SKINS ──────────────────────────────────────────────
  const replaceTombstones = () => {
    const tombstoneImgs = document.querySelectorAll('img[src*="tombstone"], img[src*="Tombstone"], img[src*="%22tombstone%22"], img[src*="full.svg"]');
    tombstoneImgs.forEach(img => {
      img.classList.add('wr-is-tombstone');
      if (STATE.activeTombstoneUrl && img.src !== STATE.activeTombstoneUrl) img.src = STATE.activeTombstoneUrl;
    });
  };

  const getUsernameForImg = (img) => {
    let el = img.parentElement;
    while (el && el !== document.body) {
      const nameEl = el.querySelector('[class*="username"], [class*="Username"]');
      if (nameEl) return nameEl.textContent.trim();
      el = el.parentElement;
    }
    return null;
  };

  const replacePets = () => {
    const petImgs = document.querySelectorAll('img[class*="petImg"], img[src*="/api/skin/render/pet.svg"]');
    petImgs.forEach(img => {
      const username = getUsernameForImg(img);
      let targetUrl = null;
      if (username && STATE.playerPets[username.toLowerCase()]) targetUrl = STATE.playerPets[username.toLowerCase()].url;
      else if (STATE.activeGlobalPetUrl) targetUrl = STATE.activeGlobalPetUrl;
      if (targetUrl && img.src !== targetUrl) {
        if (!img.dataset.wrOrigPetSrc) img.dataset.wrOrigPetSrc = img.src;
        img.src = targetUrl;
      }
    });
  };

  const replaceCharacterSkins = () => {
    const characterImgs = document.querySelectorAll('img[class*="characterImg"], img[class*="characterShape"], img[src*="/api/skin/render/user.svg"]');
    characterImgs.forEach(img => {
      const src = img.src || '';
      if (src.includes('tombstone') || src.includes('Tombstone') || src.includes('%22tombstone%22') || src.includes('full.svg') || img.classList.contains('wr-is-tombstone')) return;
      const username = getUsernameForImg(img);
      let targetSkinUrl = null;
      if (username && STATE.playerSkins[username.toLowerCase()]) targetSkinUrl = STATE.playerSkins[username.toLowerCase()].url;
      else if (STATE.activeSkinUrl) targetSkinUrl = STATE.activeSkinUrl;
      if (targetSkinUrl && img.src !== targetSkinUrl) img.src = targetSkinUrl;
    });
  };

// ─── OBSERVER DU DOM & LOGS DE MORT ─────────────────────────────────────────
const DEATH_LOG = [];

const addDeathEntry = (htmlContent, name) => {
  if (DEATH_LOG.some(e => e.name === name)) return;
  
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  DEATH_LOG.unshift({ html: htmlContent, name, time });
  renderDeathLog();
};

const tryParseDeath = (node) => {
  const deathBox = node.matches?.('[data-sentry-component="Death"]') 
    ? node 
    : node.querySelector?.('[data-sentry-component="Death"]');
    
  const target = deathBox || node.querySelector?.('[class*="__death"]') || (node.className?.includes?.('death') ? node : null);
  if (!target) return;

  const nameEl = target.querySelector('[class*="__username"], [class*="PlayerSpan"], [class*="username"]');
  if (!nameEl) return;
  const name = nameEl.textContent.trim();
  if (!name) return;

  // Clone le composant HTML exact de Wolfy (garde les icônes, images et styles d'origine)
  const clone = target.cloneNode(true);
  
  addDeathEntry(clone.outerHTML, name);
};

const startDOMObserver = () => {
  // Observer pour détecter l'apparition des messages de mort dans le DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) tryParseDeath(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Boucle de rafraîchissement et de synchronisation (1s)
  setInterval(() => {
    // Re-injection du UI si supprimé du DOM
    if (!document.getElementById('wr-root')) {
      injectUI(); 
      render(); 
      syncSpamState();
    }

    // Gestion de l'ID de partie active
    const gameMatch = window.location.pathname.match(/\/game\/([A-Za-z0-9]+)/i);
    if (gameMatch) {
      const currentGameId = gameMatch[1];
      if (lastFetchedGameId !== currentGameId) {
        lastFetchedGameId = currentGameId;
        fetchGameInfo(currentGameId);
      }
    } else {
      if (lastFetchedGameId !== null) {
        lastFetchedGameId = null;
        STATE.gameInfo = null;
        renderGameInfo();
      }
    }

    // Enrichissement du Leaderboard
    if (STATE.enhanceLeaderboard) {
      const match = window.location.pathname.match(/\/leaderboard\/([^\/]+)/i);
      if (match) {
        const profileName = match[1];
        if (STATE.lastProfileFetched !== profileName) {
          STATE.lastProfileFetched = profileName;
          fetch(`https://wolfy.net/api/leaderboard/player/${profileName}`)
            .then(r => r.json())
            .then(data => {
              if (data && data.history) { 
                currentLeaderboardHistory = data.history; 
                injectHistoryDetails(); 
              }
            })
            .catch(() => {});
        } else {
          injectHistoryDetails();
        }
      } else {
        STATE.lastProfileFetched = null; 
        currentLeaderboardHistory = [];
      }
    }

    // Automatisations & Cosmétiques
    tryAutoNext();
    tryAutoMayor();
    replaceTombstones();
    replaceCharacterSkins();
    replacePets();
  }, 1000);
};

// ─── MODULE AUTO-NINJA ───────────────────────────────────────────────────

// Mettre à jour l'affichage visuel (contour discret) sur la cible
const updateNinjaVisualTarget = () => {
  // Supprime la classe jaune sur toutes les cartes
  document.querySelectorAll('.wr-ninja-targeted').forEach(el => {
    el.classList.remove('wr-ninja-targeted');
  });

  if (!STATE.ninjaTargetPlayer) return;

  const targetClean = STATE.ninjaTargetPlayer.toLowerCase().trim();
  const allCards = document.querySelectorAll('[class*="Character-module"], [class*="character"], [data-player-name]');

  let targetCard = null;
  for (const card of allCards) {
    if (card.textContent.toLowerCase().includes(targetClean)) {
      targetCard = card;
      break;
    }
  }

  if (targetCard) {
    targetCard.classList.add('wr-ninja-targeted');
    console.log(`[Ninja Debug 🎨] Visuel appliqué sur : "${STATE.ninjaTargetPlayer}"`);
  } else {
    console.warn(`[Ninja Debug 🎨] Carte introuvable pour le visuel : "${STATE.ninjaTargetPlayer}"`);
  }
};

// 1. Enregistrement / Désélection de la cible via Clic Droit (Contextmenu)
document.addEventListener('contextmenu', (e) => {
  if (!STATE.autoNinja) return;

  const path = e.composedPath ? e.composedPath() : [e.target];
  let targetPlayerName = null;

  for (const el of path) {
    if (!el || !el.classList) continue;

    const classStr = typeof el.className === 'string' ? el.className : '';
    const isPlayerNode = classStr.includes('Character-module') || 
                         classStr.includes('character') || 
                         classStr.includes('username') || 
                         el.hasAttribute('data-player-name');

    if (isPlayerNode) {
      const nameNode = el.querySelector('[class*="username"], [class*="PlayerSpan"]') || el;
      const text = nameNode.textContent?.trim();

      if (text && text.length > 0 && text.length < 30 && !text.includes('\n')) {
        targetPlayerName = text;
        break;
      }
    }
  }

  // Secours via elementFromPoint
  if (!targetPlayerName) {
    let pointEl = document.elementFromPoint(e.clientX, e.clientY);
    while (pointEl && pointEl !== document.body) {
      const classStr = typeof pointEl.className === 'string' ? pointEl.className : '';
      if (classStr.includes('character') || classStr.includes('username')) {
        const text = pointEl.textContent?.trim();
        if (text && text.length > 0 && text.length < 30 && !text.includes('\n')) {
          targetPlayerName = text;
          break;
        }
      }
      pointEl = pointEl.parentElement;
    }
  }

  if (targetPlayerName) {
    e.preventDefault();
    e.stopPropagation();

    // TOGGLE : Si on re-clique sur le joueur déjà sélectionné -> DÉSÉLECTION
    if (STATE.ninjaTargetPlayer && STATE.ninjaTargetPlayer.toLowerCase() === targetPlayerName.toLowerCase()) {
      console.log(`[Ninja Debug ❌] Cible désélectionnée : "${targetPlayerName}"`);
      STATE.ninjaTargetPlayer = null;

      const info = document.querySelector('#wr-ninja-target-info');
      if (info) info.innerHTML = `Cible Ninja : <i>Aucune</i>`;
    } else {
      // Sinon -> SELECTION de la nouvelle cible
      STATE.ninjaTargetPlayer = targetPlayerName;
      console.log(`[Ninja Debug 🎯] Nouvelle cible verrouillée : "${targetPlayerName}"`);

      const info = document.querySelector('#wr-ninja-target-info');
      if (info) info.innerHTML = `Cible Ninja : <b style="color:#eab308;">${targetPlayerName}</b>`;
    }

    // Mise à jour de l'affichage visuel
    updateNinjaVisualTarget();
  }
}, true);

// 2. Exécution du vote Ninja
const executeNinjaVote = (targetPseudo) => {
  console.log(`[Ninja Debug 🥷] DÉCLENCHEMENT DU VOTE SUR : "${targetPseudo}"`);

  const targetClean = targetPseudo.toLowerCase().trim();
  const allCards = document.querySelectorAll('[class*="Character-module"], [class*="character"], [data-player-name]');
  let targetNode = null;

  for (const card of allCards) {
    if (card.textContent.toLowerCase().includes(targetClean)) {
      targetNode = card;
      break;
    }
  }

  if (!targetNode) {
    console.error(`[Ninja Debug ❌] ERREUR : La carte du joueur "${targetPseudo}" est introuvable sur le plateau.`);
    return;
  }

  const clickTarget = targetNode.querySelector('img, [class*="characterHitbox"], [class*="hitbox"]') || targetNode;
  
  console.log(`[Ninja Debug 🖱️] Envoi du clic de vote...`);
  clickTarget.click();
  clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  setTimeout(() => {
    const inputReason = document.querySelector('input#reason, input[name="reason"]');
    if (inputReason) {
      console.log('[Ninja Debug 📝] Remplissage de la raison du vote...');
      if (typeof setInputValue === 'function') {
        setInputValue(inputReason, '.');
      } else {
        inputReason.value = '.';
        inputReason.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const form = inputReason.closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
        else if (typeof form.requestSubmit === 'function') form.requestSubmit();
      }
    }

    console.log(`[Ninja Debug ✅] Vote Ninja complété avec succès sur ${targetPseudo} !`);
    
    // Nettoyage après vote
    STATE.ninjaTargetPlayer = null;
    updateNinjaVisualTarget();

    const info = document.querySelector('#wr-ninja-target-info');
    if (info) info.innerHTML = 'Vote Ninja exécuté ! ✅';
  }, 40);
};

// 3. Boucle du Chrono (100ms)
let hasVotedNinjaThisTurn = false;

setInterval(() => {
  if (!STATE.autoNinja) return;

  // S'assure de maintenir le visuel tant qu'une cible est définie
  if (STATE.ninjaTargetPlayer && !document.querySelector('.wr-ninja-targeted')) {
    updateNinjaVisualTarget();
  }

  if (!STATE.ninjaTargetPlayer) return;

  const phaseText = document.body.innerText;
  const isVotePhase = phaseText.includes('Vote du village') || !!document.querySelector('[class*="voteTitle"]');

  if (!isVotePhase) {
    hasVotedNinjaThisTurn = false;
    return;
  }

  const timerElem = document.querySelector('[class*="timer"], [class*="timeState"]');
  const timeText = timerElem ? timerElem.textContent.trim() : '';

  if ((timeText.endsWith('0:01') || timeText.endsWith('00:01') || timeText === '1s') && !hasVotedNinjaThisTurn) {
    hasVotedNinjaThisTurn = true;
    executeNinjaVote(STATE.ninjaTargetPlayer);
  }
}, 100);

// ─── UI INJECTION ─────────────────────────────────────────────────────────
  const injectUI = () => {
    if (document.getElementById('wr-root')) return;
    injectStyles();

    const root = document.createElement('div');
    root.id = 'wr-root';
    root.innerHTML = `
      <div class="wr-panel">
        <div class="wr-header"><h2>Wolfy Tools</h2><button class="wr-refresh" title="Actualiser la liste">↻</button></div>
        <div class="wr-tabs">
          <button class="wr-tab is-active" data-tab="draw" title="Tirage au sort">🎲</button>
          <button class="wr-tab" data-tab="deaths" title="Log des morts">💀</button>
          <button class="wr-tab" data-tab="changer" title="Skins, Pets, Sons">🎨</button>
          <button class="wr-tab" data-tab="gameinfo" title="Infos Partie">🎮</button>
          <button class="wr-tab" data-tab="settings" title="Paramètres">⚙️</button>
        </div>
        <div class="wr-tab-panel" data-panel="draw">
          <div class="wr-players"></div><div class="wr-action-area"><div class="wr-result">...</div><button class="wr-draw-btn wr-btn-primary">Tirer au sort</button></div>
        </div>
        <div class="wr-tab-panel" data-panel="deaths" style="display:none;">
          <div class="wr-death-list"></div><div class="wr-action-area"><button class="wr-clear-deaths-btn">🗑 Effacer le log</button></div>
        </div>
        <div class="wr-tab-panel" data-panel="changer" style="display:none;">
          <div class="wr-card"><div class="wr-section-title">👤 Skin par Joueur</div><div class="wr-player-skin-chips wr-chips-container"></div><div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;"><input type="text" id="wr-pskin-target" class="wr-input-style" placeholder="Pseudo du joueur ciblé..."><input type="text" id="wr-pskin-source" class="wr-input-style" placeholder="Skin (Pseudo / URL / Fichier)"><div style="display:flex; gap:6px; margin-top:2px;"><label class="wr-btn-secondary" style="flex:1;">📁 Fichier<input type="file" id="wr-pskin-file-input" accept="image/*,.svg" style="display:none;"></label><button id="wr-pskin-add-btn" class="wr-btn-primary" style="flex:1;">Appliquer</button></div></div><div class="wr-player-skins-list"></div></div>
          <div class="wr-card"><div class="wr-section-title">🎭 Skin Global (Fallback)</div><div style="display:flex; flex-direction:column; gap:6px;"><div class="wr-input-group"><input type="text" id="wr-skin-input" class="wr-input-style" value="${STATE.globalSkin}" placeholder="Pseudo ou URL (.svg)"><button id="wr-skin-save" class="wr-btn-primary">OK</button></div><label class="wr-btn-secondary" style="cursor:pointer; display:block;">📁 Fichier local<input type="file" id="wr-skin-file-input" accept="image/*,.svg" style="display:none;"></label><span id="wr-skin-status" style="font-size: 10px; color: #a78bfa;">${STATE.activeSkinUrl ? 'Skin actif' : ''}</span></div></div>
          <div class="wr-card"><div class="wr-section-title">🐾 Pet Global (Fallback)</div><div style="display:flex;flex-direction:column;gap:6px;"><div class="wr-input-group"><input type="text" id="wr-pet-global-input" class="wr-input-style" value="${STATE.globalPet}" placeholder="ID,couleur ou URL"><button id="wr-pet-global-save" class="wr-btn-primary">OK</button></div><label class="wr-btn-secondary">📁 Fichier local<input type="file" id="wr-pet-global-file" accept="image/*,.svg" style="display:none;"></label><span id="wr-pet-global-status" style="font-size:10px;color:#a78bfa;">${STATE.activeGlobalPetUrl ? 'Pet global actif' : ''}</span></div></div>
          <div class="wr-card"><div class="wr-section-title">🪦 Tombstone Globale</div><div style="display:flex; flex-direction:column; gap:6px;"><div class="wr-input-group"><input type="text" id="wr-tombstone-input" class="wr-input-style" value="${STATE.globalTombstone || ''}" placeholder="URL de la tombe (.svg / image)"><button id="wr-tombstone-save" class="wr-btn-primary">OK</button></div><label class="wr-btn-secondary" style="cursor:pointer; display:block;">📁 Fichier local<input type="file" id="wr-tombstone-file-input" accept="image/*,.svg" style="display:none;"></label><span id="wr-tombstone-status" style="font-size: 10px; color: #a78bfa;">${STATE.activeTombstoneUrl ? 'Tombstone active' : ''}</span></div></div>
          <div class="wr-card"><div class="wr-section-title">🔊 Sound Changer</div><div class="wr-chips-container"><span class="wr-chip" data-sound="bip">bip</span><span class="wr-chip" data-sound="begin_day">begin_day</span><span class="wr-chip" data-sound="begin_night">begin_night</span><span class="wr-chip" data-sound="morning">morning</span><span class="wr-chip" data-sound="shotgun">shotgun</span></div><div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;"><input type="text" id="wr-sound-target" class="wr-input-style" placeholder="Son cible (ex: bip, shotgun)"><input type="text" id="wr-sound-url" class="wr-input-style" placeholder="URL (.mp3) ou vide (Mute)"><div style="display:flex; gap:6px; margin-top:2px;"><label class="wr-btn-secondary" style="flex:1;">📁 Fichier Audio<input type="file" id="wr-sound-file-input" accept="audio/*" style="display:none;"></label><button id="wr-sound-add-btn" class="wr-btn-primary" style="flex:1;">Ajouter</button></div></div><div class="wr-sound-rules-list"></div></div>
        </div>
        
        <div class="wr-tab-panel" data-panel="gameinfo" style="display:none;">
          <div class="wr-card">
            <div class="wr-section-title">🎮 Infos Partie</div>
            <div id="wr-gameinfo-container">
              <div class="wr-empty-state">Chargement des données...</div>
            </div>
          </div>
        </div>

        <div class="wr-tab-panel" data-panel="settings" style="display:none;">
          <div class="wr-card">
            <div class="wr-section-title">⚙️ Automatisations</div>
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:10px;"><input type="checkbox" id="wr-auto-next" ${STATE.autoNext ? 'checked' : ''}><span style="font-size:12px; font-weight:600;">Partie suivante automatique</span></label>
            
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:6px;"><input type="checkbox" id="wr-auto-mayor" ${STATE.autoMayor ? 'checked' : ''}><span style="font-size:12px; font-weight:600;">Auto-candidature Maire</span></label>
            <input type="text" id="wr-auto-mayor-speech" class="wr-input-style" value="${STATE.autoMayorSpeech}" placeholder="Discours de campagne (ex: Votez pour moi !)" style="margin-bottom:10px; ${STATE.autoMayor ? '' : 'display:none;'}">

            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:6px;"><input type="checkbox" id="wr-enhance-lb" ${STATE.enhanceLeaderboard ? 'checked' : ''}><span style="font-size:12px; font-weight:600;">Améliorer Leaderboard (Historique)</span></label>

            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:6px;">
              <input type="checkbox" id="wr-auto-ninja" ${STATE.autoNinja ? 'checked' : ''}>
              <span style="font-size:12px; font-weight:600;">Auto-Ninja (Vote à 0:01)</span>
            </label>
            <div id="wr-ninja-target-info" style="font-size:11px; color:#a78bfa; margin-bottom:10px; margin-left:24px;">
              ${STATE.ninjaTargetPlayer ? 'Cible Ninja : <b>' + STATE.ninjaTargetPlayer + '</b>' : 'Aucune cible (Clic droit sur un joueur)'}
            </div>
          </div>
          <div class="wr-card">
            <div class="wr-section-title">⌨️ Raccourcis & Modules</div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                <input type="checkbox" id="wr-spam-place" ${STATE.spamPlace ? 'checked' : ''}>
                <span style="font-size:12px; font-weight:600;">Spam Place Lobby</span>
              </label>
              <button id="wr-bind-spam" class="wr-btn-secondary" style="padding:4px 8px; width:auto; min-width:60px;">${formatKeyCode(STATE.keybinds.spamPlace)}</button>
            </div>
          </div>
        </div>
      </div>
      <button class="wr-toggle" title="Ouvrir/Fermer Wolfy Tools">📜</button>
    `;

    document.body.appendChild(root);

    // Binds d'onglets
    root.querySelector('.wr-refresh').addEventListener('click', () => { scanPlayersFromDOM(); STATE.lastResult = null; render(); });
    root.querySelector('.wr-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.wr-tab'); if (!tab) return; const targetTab = tab.dataset.tab;
      root.querySelectorAll('.wr-tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === targetTab));
      root.querySelectorAll('.wr-tab-panel').forEach(p => { p.style.display = p.dataset.panel === targetTab ? 'block' : 'none'; });
      if (targetTab === 'deaths') renderDeathLog();
      if (targetTab === 'changer') { renderSoundRules(); renderPlayerSkinsList(); renderPlayerChips(); }
      if (targetTab === 'gameinfo') renderGameInfo();
    });

    const autoNinjaCb = root.querySelector('#wr-auto-ninja');
    const ninjaStatusInfo = root.querySelector('#wr-ninja-target-info');

    autoNinjaCb.addEventListener('change', (e) => {
      STATE.autoNinja = e.target.checked;
      safeSetStorage('wr_autoNinja', STATE.autoNinja);
      if (!STATE.autoNinja) {
        STATE.ninjaTargetPlayer = null;
        if (ninjaStatusInfo) ninjaStatusInfo.innerHTML = 'Aucune cible (Clic droit sur un joueur)';
      }
    });

    root.querySelector('#wr-auto-next').addEventListener('change', (e) => { STATE.autoNext = e.target.checked; safeSetStorage('wr_autoNext', STATE.autoNext); if (STATE.autoNext) tryAutoNext(); });
    
    const autoMayorCb = root.querySelector('#wr-auto-mayor');
    const autoMayorSpeechInput = root.querySelector('#wr-auto-mayor-speech');
    autoMayorCb.addEventListener('change', (e) => {
      STATE.autoMayor = e.target.checked;
      safeSetStorage('wr_autoMayor', STATE.autoMayor);
      autoMayorSpeechInput.style.display = STATE.autoMayor ? 'block' : 'none';
      if (STATE.autoMayor) tryAutoMayor();
    });
    autoMayorSpeechInput.addEventListener('input', (e) => {
      STATE.autoMayorSpeech = e.target.value;
      safeSetStorage('wr_autoMayorSpeech', STATE.autoMayorSpeech);
    });

    root.querySelector('#wr-enhance-lb').addEventListener('change', (e) => { STATE.enhanceLeaderboard = e.target.checked; safeSetStorage('wr_enhanceLeaderboard', STATE.enhanceLeaderboard); if (!STATE.enhanceLeaderboard) cleanUpLeaderboard(); else injectHistoryDetails(); });
    root.querySelector('#wr-spam-place').addEventListener('change', (e) => { STATE.spamPlace = e.target.checked; safeSetStorage('wr_spamPlace', STATE.spamPlace); syncSpamState(); });

    root.querySelector('#wr-bind-spam').addEventListener('click', (e) => {
      isBindingKey = 'spamPlace';
      e.target.textContent = '...';
      e.target.classList.add('is-binding');
    });

    // Drag & Drop
    const positionPanel = () => {
      const panel = document.querySelector('.wr-panel'); const toggle = document.querySelector('.wr-toggle');
      if (!panel || !toggle) return;
      const MARGIN = 10; const W = window.innerWidth; const H = window.innerHeight; const tRect = toggle.getBoundingClientRect(); const pW = 350;
      const cx = tRect.left + tRect.width / 2; const cy = tRect.top + tRect.height / 2;
      let left = (cx < W / 2) ? tRect.left : tRect.right - pW; left = Math.max(MARGIN, Math.min(left, W - pW - MARGIN));
      panel.style.left = left + 'px'; panel.style.right = 'auto';
      if (cy > H / 2) { const distFromBottom = H - tRect.top + MARGIN; panel.style.bottom = distFromBottom + 'px'; panel.style.top = 'auto'; } 
      else { panel.style.top = (tRect.bottom + MARGIN) + 'px'; panel.style.bottom = 'auto'; }
    };
    
    const toggle = root.querySelector('.wr-toggle');
    let hasDragged = false, startX, startY, mouseOffsetX = 0, mouseOffsetY = 0;
    let isTicking = false;

    toggle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      hasDragged = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = toggle.getBoundingClientRect();
      mouseOffsetX = e.clientX - rect.left;
      mouseOffsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (startX === undefined) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!hasDragged && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      hasDragged = true;

      if (!isTicking) {
        requestAnimationFrame(() => {
          const MARGIN = 4, W = window.innerWidth, H = window.innerHeight, btnSize = 44;
          const newLeft = Math.max(MARGIN, Math.min(e.clientX - mouseOffsetX, W - btnSize - MARGIN));
          const newTop = Math.max(MARGIN, Math.min(e.clientY - mouseOffsetY, H - btnSize - MARGIN));
          toggle.style.left = newLeft + 'px';
          toggle.style.top = newTop + 'px';
          toggle.style.right = 'auto';
          toggle.style.bottom = 'auto';
          if (STATE.isOpen) positionPanel();
          isTicking = false;
        });
        isTicking = true;
      }
    });

    document.addEventListener('mouseup', () => { startX = undefined; });
    toggle.addEventListener('click', () => { if (hasDragged) { hasDragged = false; return; } STATE.isOpen = !STATE.isOpen; if (STATE.isOpen) { scanPlayersFromDOM(); render(); requestAnimationFrame(positionPanel); } else { render(); } });
    window.addEventListener('resize', () => { if (STATE.isOpen) positionPanel(); });

    // Tirage au sort
    root.querySelector('.wr-draw-btn').addEventListener('click', drawRandomPlayer);
    root.querySelector('.wr-players').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') { if (e.target.checked) STATE.excluded.delete(e.target.value); else STATE.excluded.add(e.target.value); render(); }
    });

    // Inputs
    const pskinTargetInput = root.querySelector('#wr-pskin-target'); const pskinSourceInput = root.querySelector('#wr-pskin-source'); const pskinFileInput = root.querySelector('#wr-pskin-file-input'); const pskinAddBtn = root.querySelector('#wr-pskin-add-btn');
    let tempPlayerSkinFileUrl = null; let tempPlayerSkinFileName = null;
    pskinFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { tempPlayerSkinFileUrl = evt.target.result; tempPlayerSkinFileName = file.name; pskinSourceInput.value = `Fichier local : ${file.name}`; }; reader.readAsDataURL(file); });
    pskinAddBtn.addEventListener('click', async () => { const target = pskinTargetInput.value.trim(); const source = pskinSourceInput.value.trim(); if (!target || !source) return; let finalUrl = ''; let skinLabel = source; if (tempPlayerSkinFileUrl && source.includes(tempPlayerSkinFileName)) { finalUrl = tempPlayerSkinFileUrl; skinLabel = tempPlayerSkinFileName; } else { const resolved = await resolveSkinToUrl(source); if (!resolved.url) return; finalUrl = resolved.url; skinLabel = resolved.label || source; } STATE.playerSkins[target.toLowerCase()] = { target, skinInput: skinLabel, url: finalUrl }; safeSetStorage('wr_playerSkins', JSON.stringify(STATE.playerSkins)); pskinTargetInput.value = ''; pskinSourceInput.value = ''; tempPlayerSkinFileUrl = null; tempPlayerSkinFileName = null; renderPlayerSkinsList(); replaceCharacterSkins(); });
    
    const skinInput = root.querySelector('#wr-skin-input'); const skinSaveBtn = root.querySelector('#wr-skin-save'); const skinStatus = root.querySelector('#wr-skin-status'); const skinFileInput = root.querySelector('#wr-skin-file-input');
    skinSaveBtn.addEventListener('click', () => { resolveAndSaveGlobalSkin(skinInput.value, skinStatus); }); skinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') resolveAndSaveGlobalSkin(skinInput.value, skinStatus); }); skinFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { const dataUrl = evt.target.result; STATE.globalSkin = file.name; STATE.activeSkinUrl = dataUrl; skinInput.value = file.name; safeSetStorage('wr_globalSkin', file.name); safeSetStorage('wr_activeSkinUrl', dataUrl); skinStatus.textContent = `Fichier local (${file.name}) appliqué !`; replaceCharacterSkins(); }; reader.readAsDataURL(file); });

    const tombstoneInput = root.querySelector('#wr-tombstone-input');
    const tombstoneSaveBtn = root.querySelector('#wr-tombstone-save');
    const tombstoneStatus = root.querySelector('#wr-tombstone-status');
    const tombstoneFileInput = root.querySelector('#wr-tombstone-file-input');

    const saveTombstone = (url, label) => {
      STATE.globalTombstone = label;
      STATE.activeTombstoneUrl = url;
      safeSetStorage('wr_globalTombstone', label);
      safeSetStorage('wr_activeTombstoneUrl', url);
      if (tombstoneStatus) tombstoneStatus.textContent = url ? 'Tombstone appliquée !' : 'Tombstone désactivée';
      if (typeof replaceTombstones === 'function') replaceTombstones();
    };

    tombstoneSaveBtn.addEventListener('click', () => {
      const val = tombstoneInput.value.trim();
      saveTombstone(val, val);
    });

    tombstoneInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = tombstoneInput.value.trim();
        saveTombstone(val, val);
      }
    });

    tombstoneFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        tombstoneInput.value = file.name;
        saveTombstone(evt.target.result, file.name);
      };
      reader.readAsDataURL(file);
    });

    const soundTargetInput = root.querySelector('#wr-sound-target'); const soundUrlInput = root.querySelector('#wr-sound-url'); const soundFileInput = root.querySelector('#wr-sound-file-input'); const soundAddBtn = root.querySelector('#wr-sound-add-btn');
    let tempLocalAudioData = null; let tempLocalAudioName = null;
    root.querySelectorAll('.wr-chip[data-sound]').forEach(chip => { chip.addEventListener('click', () => { soundTargetInput.value = chip.dataset.sound; }); });
    soundFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { tempLocalAudioData = evt.target.result; tempLocalAudioName = file.name; soundUrlInput.value = `Fichier local : ${file.name}`; }; reader.readAsDataURL(file); });
    soundAddBtn.addEventListener('click', () => { const target = soundTargetInput.value.trim(); const urlVal = soundUrlInput.value.trim(); if (!target) return; let replacement = ''; let label = 'Mute (Bloqué)'; if (tempLocalAudioData && urlVal.includes(tempLocalAudioName)) { replacement = tempLocalAudioData; label = tempLocalAudioName; } else if (urlVal && (urlVal.startsWith('http://') || urlVal.startsWith('https://'))) { replacement = urlVal; label = urlVal.split('/').pop(); } STATE.soundRules.push({ target, replacement, label }); safeSetStorage('wr_soundRules', JSON.stringify(STATE.soundRules)); soundTargetInput.value = ''; soundUrlInput.value = ''; tempLocalAudioData = null; tempLocalAudioName = null; renderSoundRules(); });
    root.querySelector('.wr-clear-deaths-btn').addEventListener('click', () => { DEATH_LOG.length = 0; renderDeathLog(); });
  };

  const drawRandomPlayer = () => {
    const available = STATE.players.filter(p => !STATE.excluded.has(p));
    if (available.length === 0) { STATE.lastResult = 'Aucun joueur !'; render(); return; }
    STATE.lastResult = available[Math.floor(Math.random() * available.length)];
    render();
  };

  const resolveSkinToUrl = async (inputVal) => {
    const val = inputVal.trim();
    if (!val) return { url: '', label: '' };
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return { url: val, label: val.length > 20 ? val.substring(0,20) + '...' : val };
    try {
      const res = await fetch(`https://wolfy.net/api/leaderboard/player/${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) return { url: `https://wolfy.net/api/skin/render/user.svg?id=${data.user.id}&v=${data.user.skinVersion}&s=${data.user.slotId}`, label: `Skin de ${data.user.username}` };
      }
    } catch (e) {}
    return { url: '', label: '' };
  };

  const resolveAndSaveGlobalSkin = async (inputVal, statusEl) => {
    const val = inputVal.trim();
    if (!val) { STATE.globalSkin = ''; STATE.activeSkinUrl = ''; localStorage.removeItem('wr_globalSkin'); localStorage.removeItem('wr_activeSkinUrl'); if (statusEl) statusEl.textContent = 'Skin global désactivé'; return; }
    if (statusEl) statusEl.textContent = 'Recherche...';
    const resolved = await resolveSkinToUrl(val);
    if (resolved.url) { STATE.globalSkin = val; STATE.activeSkinUrl = resolved.url; safeSetStorage('wr_globalSkin', val); safeSetStorage('wr_activeSkinUrl', resolved.url); if (statusEl) statusEl.textContent = 'Skin global appliqué !'; replaceCharacterSkins(); } 
    else { if (statusEl) statusEl.textContent = 'Skin introuvable.'; }
  };

  const scanPlayersFromDOM = () => {
    const elements = document.querySelectorAll('[class*="Character-module"][class*="username"]');
    const foundPlayers = Array.from(elements).map(el => el.textContent.trim()).filter(name => name.length > 0);
    STATE.players = [...new Set(foundPlayers)];
    for (const excludedName of STATE.excluded) if (!STATE.players.includes(excludedName)) STATE.excluded.delete(excludedName);
    renderPlayerChips();
  };

  const renderPlayerChips = () => {
    const chipsContainer = document.querySelector('.wr-player-skin-chips');
    if (!chipsContainer) return;
    if (STATE.players.length === 0) { chipsContainer.innerHTML = `<span style="font-size:10px; color:#71717a;">Aucun joueur en partie</span>`; return; }
    chipsContainer.innerHTML = STATE.players.map(p => `<span class="wr-chip wr-player-chip" data-player="${p}">${p}</span>`).join('');
    chipsContainer.querySelectorAll('.wr-player-chip').forEach(chip => { chip.addEventListener('click', () => { const targetInput = document.querySelector('#wr-pskin-target'); if (targetInput) targetInput.value = chip.dataset.player; }); });
  };

  const renderSoundRules = () => {
    const container = document.querySelector('.wr-sound-rules-list');
    if (!container) return;
    if (STATE.soundRules.length === 0) { container.innerHTML = `<div class="wr-empty-state">Aucune modification de son active.</div>`; return; }
    container.innerHTML = STATE.soundRules.map((rule, index) => `<div class="wr-item-row"><div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;"><strong style="color:#a78bfa;">🎯 ${rule.target}</strong> → <span style="color:${rule.replacement ? '#d4d4d8' : '#ef4444'};">${rule.label}</span></div><button class="wr-item-del wr-sound-delete" data-index="${index}" title="Supprimer">🗑</button></div>`).join('');
    container.querySelectorAll('.wr-sound-delete').forEach(btn => { btn.addEventListener('click', (e) => { const idx = parseInt(e.target.dataset.index, 10); STATE.soundRules.splice(idx, 1); safeSetStorage('wr_soundRules', JSON.stringify(STATE.soundRules)); renderSoundRules(); }); });
  };

  const renderPlayerSkinsList = () => {
    const container = document.querySelector('.wr-player-skins-list');
    if (!container) return;
    const keys = Object.keys(STATE.playerSkins);
    if (keys.length === 0) { container.innerHTML = `<div class="wr-empty-state">Aucun skin spécifique configuré.</div>`; return; }
    container.innerHTML = keys.map(key => { const item = STATE.playerSkins[key]; return `<div class="wr-item-row"><div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;"><strong style="color:#a78bfa;">👤 ${item.target}</strong> → <span style="color:#d4d4d8;">${item.skinInput}</span></div><button class="wr-item-del wr-skin-delete" data-key="${key}" title="Supprimer">🗑</button></div>`; }).join('');
    container.querySelectorAll('.wr-skin-delete').forEach(btn => { btn.addEventListener('click', (e) => { const key = e.target.dataset.key; delete STATE.playerSkins[key]; safeSetStorage('wr_playerSkins', JSON.stringify(STATE.playerSkins)); renderPlayerSkinsList(); replaceCharacterSkins(); }); });
  };

  const renderDeathLog = () => {
    const container = document.querySelector('.wr-death-list');
    if (!container) return;
    if (DEATH_LOG.length === 0) { container.innerHTML = `<div class="wr-empty-state">Aucune mort détectée pour l'instant.<br>Le log se remplit automatiquement.</div>`; return; }
    container.innerHTML = DEATH_LOG.map(entry => `<div class="wr-death-row"><div class="wr-death-header"><span class="wr-death-name">${entry.name}</span>${entry.role ? `<span class="wr-death-role">${entry.role}</span>` : ''}<span class="wr-death-time">${entry.time}</span></div><div class="wr-death-msg">${entry.message}</div></div>`).join('');
  };

  const render = () => {
    const root = document.getElementById('wr-root');
    if (!root) return;
    root.className = STATE.isOpen ? 'is-open' : '';
    const listContainer = root.querySelector('.wr-players'); const resultContainer = root.querySelector('.wr-result'); const drawBtn = root.querySelector('.wr-draw-btn');
    if (listContainer) {
      if (STATE.players.length === 0) { listContainer.innerHTML = `<div class="wr-empty-state">Aucun joueur détecté sur le plateau. Lance une partie et actualise.</div>`; if (drawBtn) drawBtn.disabled = true; } 
      else { if (drawBtn) drawBtn.disabled = false; listContainer.innerHTML = STATE.players.map(player => { const isExcluded = STATE.excluded.has(player); return `<label class="wr-player-item ${isExcluded ? 'is-excluded' : ''}"><input type="checkbox" value="${player}" ${!isExcluded ? 'checked' : ''}><span>${player}</span></label>`; }).join(''); }
    }
    if (resultContainer) resultContainer.textContent = STATE.lastResult || '...';
    renderDeathLog(); renderSoundRules(); renderPlayerSkinsList(); renderPlayerChips(); renderGameInfo();
  };

  const replaceEyesImage = () => {
    try {
      const localImageUrl = chrome.runtime.getURL('eyes2.svg');
      const imgs = document.querySelectorAll('img[src*="eyes2.svg"]:not([src*="chrome-extension://"])');
      imgs.forEach(img => { img.src = localImageUrl; });
    } catch (e) {}
  };

  const boot = () => {
    injectUI(); scanPlayersFromDOM(); startDOMObserver();
    replaceEyesImage(); replaceTombstones(); replaceCharacterSkins(); replacePets();
    syncSpamState();
    render();
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } 
  else { boot(); }
})();