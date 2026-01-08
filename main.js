
/* Tunti – Web Prototype
 * Localization: မြန်မာ UI စကားလုံးများပါဝင်သည်
 * Author: You + Copilot
 */

const WIDTH = 18;
const HEIGHT = 12;

// Terrain types
const TERRAINS = ["plains", "forest", "mountain", "water"];
const EMOJI = {
  plains: "🟩",
  forest: "🌲",
  mountain: "⛰️",
  water: "🌊",
  city: "🏛️",
  farm: "🌾",
  lumber: "🪵",
  market: "🛍️",
  barracks: "⚔️",
  port: "⚓",
  infantry: "🛡️",
  archer: "🏹",
  cavalry: "🐎",
  ship: "⛵",
};

// Players
const PLAYERS = [
  { id: 0, name: "မြန်မာ", color: "#d4af37", capitalHP: 5 },
  { id: 1, name: "ထိုင်း", color: "#2b7de9", capitalHP: 5 },
];

// Costs & production
const COSTS = {
  build: {
    farm: { timber: 20, gold: 10 },
    lumber: { gold: 10 },
    market: { timber: 30, rice: 20 },
    barracks: { timber: 50, gold: 50 },
    port: { timber: 40, gold: 30 },
  },
  train: {
    infantry: { rice: 10, gold: 10 },
    archer: { timber: 10, gold: 15 },
    cavalry: { rice: 20, gold: 30 },
    ship: { timber: 40, gold: 20 },
  },
};

const PRODUCTION = {
  farm: { rice: 8 },
  lumber: { timber: 6 },
  market: { gold: 6, spices: 2 },
};

// Units stats
const UNIT_STATS = {
  infantry: { atk: 2, def: 2, move: 1, kind: "land" },
  archer: { atk: 3, def: 1, move: 1, kind: "land" },
  cavalry: { atk: 3, def: 2, move: 2, kind: "land" },
  ship: { atk: 3, def: 2, move: 2, kind: "sea" },
};

let state = {
  turn: 0,
  currentPlayer: 0,
  resources: [
    { rice: 100, gold: 100, timber: 100, spices: 0 },
    { rice: 100, gold: 100, timber: 100, spices: 0 },
  ],
  tiles: [], // {x,y, terrain, building:null|type, owner:null|pid, unit:null|{type,owner,hp}}
  capitals: [
    { x: 4, y: 8, owner: 0 },  // Yangon/Dagon area (approx)
    { x: 12, y: 6, owner: 1 }, // Bangkok area (approx)
  ],
  selected: { tileIndex: null },
};

// Initialize map
function initMap() {
  const tiles = [];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let terrain = "plains";
      const r = Math.random();
      if (r < 0.12) terrain = "mountain";
      else if (r < 0.30) terrain = "forest";
      else if (r < 0.36) terrain = "water";

      tiles.push({
        x, y, terrain, building: null, owner: null, unit: null, isCity: false
      });
    }
  }
  // Carve a river horizontally
  for (let x = 2; x < WIDTH - 2; x++) {
    const ry = Math.max(1, Math.min(HEIGHT - 2, Math.floor(HEIGHT / 2 + Math.sin(x / 2) * 2)));
    const idx = ry * WIDTH + x;
    tiles[idx].terrain = "water";
  }
  // Place capitals as city tiles
  state.capitals.forEach((c, i) => {
    const idx = c.y * WIDTH + c.x;
    tiles[idx].isCity = true;
    tiles[idx].terrain = "city";
    tiles[idx].owner = i;
    tiles[idx].building = i === 0 ? "pagoda" : "palace"; // landmark (display with 🏛️)
  });
  // Give initial territory (ring)
  giveInitialTerritory(tiles, state.capitals[0], 0, 2);
  giveInitialTerritory(tiles, state.capitals[1], 1, 2);

  state.tiles = tiles;
}

function giveInitialTerritory(tiles, c, owner, r) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = c.x + dx, y = c.y + dy;
      if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) continue;
      const idx = y * WIDTH + x;
      if (tiles[idx].terrain !== "water") tiles[idx].owner = owner;
    }
  }
}

// Rendering
function render() {
  const mapEl = document.getElementById("map");
  mapEl.innerHTML = "";
  state.tiles.forEach((t, i) => {
    const tile = document.createElement("div");
    const cls = ["tile", t.terrain];
    if (t.owner !== null) cls.push(`own-${t.owner}`);
    if (state.selected.tileIndex === i) cls.push("selected");
    if (t.isCity) cls.push("city");
    tile.className = cls.join(" ");
    tile.title = `(${t.x},${t.y}) ${t.terrain}${t.owner !== null ? " / တိုက်ရင်း-"+PLAYERS[t.owner].name:""}`;

    // Badge (building / city)
    const badge = document.createElement("div");
    badge.className = "badge";
    if (t.isCity) badge.textContent = EMOJI.city + " City";
    else if (t.building) {
      badge.textContent = EMOJI[t.building] + " " + t.building;
    } else {
      badge.textContent = "";
    }
    tile.appendChild(badge);

    // Owner ring
    const ring = document.createElement("div");
    ring.className = "owner-ring";
    tile.appendChild(ring);

    // Unit
    if (t.unit) {
      const unit = document.createElement("div");
      unit.className = "unit";
      unit.textContent = EMOJI[t.unit.type] + " HP:" + t.unit.hp;
      tile.appendChild(unit);
    } else {
      const unit = document.createElement("div");
      unit.className = "unit";
      unit.textContent = "";
      tile.appendChild(unit);
    }

    tile.addEventListener("click", () => onTileClick(i));
    mapEl.appendChild(tile);
  });

  // HUD
  document.getElementById("turnInfo").textContent =
    `လက်ရှိတစ်ဝှမ်း: Turn ${state.turn} – ${PLAYERS[state.currentPlayer].name}`;
  const r = state.resources[state.currentPlayer];
  document.getElementById("resources").textContent =
    `အရင်းအမြစ်: 🌾 ${r.rice} | 🪵 ${r.timber} | 🛍️ ${r.spices} | 💰 ${r.gold}`;
  document.getElementById("kingdomInfo").innerHTML = `
    <strong>${PLAYERS[0].name}</strong> Capital HP: ${PLAYERS[0].capitalHP}<br/>
    <strong>${PLAYERS[1].name}</strong> Capital HP: ${PLAYERS[1].capitalHP}
  `;
  document.getElementById("productionInfo").innerHTML = `
    🌾 Farm +${PRODUCTION.farm.rice} rice/turn<br/>
    🪵 Lumber +${PRODUCTION.lumber.timber} timber/turn<br/>
    🛍️ Market +${PRODUCTION.market.gold} gold & +${PRODUCTION.market.spices} spices/turn
  `;

  updateSelectedPanel();
}

function updateSelectedPanel() {
  const sel = state.selected.tileIndex;
  const t = sel != null ? state.tiles[sel] : null;
  document.getElementById("selectedTile").textContent =
    sel == null
      ? "ရွေးထားသော Tile: မရှိသေး"
      : `Tile (${t.x},${t.y}) – ${t.terrain} ${t.isCity ? "(City)" : ""} ${t.building ? "/ "+t.building : ""}`;
  document.getElementById("selectedUnit").textContent =
    sel == null || !t.unit
      ? "ရွေးထားသော စစ်သား: မရှိသေး"
      : `Unit: ${t.unit.type} (HP ${t.unit.hp}) – Owner ${PLAYERS[t.unit.owner].name}`;
}

function onTileClick(index) {
  const t = state.tiles[index];
  const prev = state.selected.tileIndex;

  // If a unit is selected and we click another tile -> move/attack
  if (prev != null && prev !== index) {
    const from = state.tiles[prev];
    if (from.unit && from.unit.owner === state.currentPlayer) {
      tryMoveOrAttack(prev, index);
      state.selected.tileIndex = index; // focus new tile after action
      render();
      return;
    }
  }

  // Select current tile
  state.selected.tileIndex = index;
  render();
}

function tryMoveOrAttack(fromIdx, toIdx) {
  const from = state.tiles[fromIdx];
  const to = state.tiles[toIdx];
  const unit = from.unit;

  if (!unit) return;

  // Movement rules: adjacent only; terrain compatibility
  const dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  const stats = UNIT_STATS[unit.type];
  if (dist > stats.move) return;

  const toIsSea = to.terrain === "water";
  const unitIsSea = stats.kind === "sea";
  if (toIsSea && !unitIsSea) return; // land unit cannot enter water
  if (!toIsSea && unitIsSea && to.terrain !== "city") return; // ship can only attack city from adjacent water

  // If enemy unit present -> attack
  if (to.unit && to.unit.owner !== unit.owner) {
    resolveCombat(unit, to.unit, toIdx);
    if (to.unit && to.unit.hp <= 0) {
      to.unit = null; // defeated
    }
    return;
  }

  // If enemy city -> siege (reduce capital HP)
  if (to.isCity && to.owner !== unit.owner) {
    const enemyId = to.owner;
    PLAYERS[enemyId].capitalHP -= 1;
    if (PLAYERS[enemyId].capitalHP <= 0) {
      alert(`🏁 အနိုင်ယူခဲ့သည်: ${PLAYERS[unit.owner].name} က ရန်သူ Capital ကို အောင်မြင်စွာ ဖယ်ရှားလိုက်ပါပြီ!`);
    } else {
      alert(`⚔️ Siege! ရန်သူ Capital HP လျှော့ချပြီး: ${PLAYERS[enemyId].capitalHP}`);
    }
    return;
  }

  // Else move (if tile free)
  if (!to.unit) {
    to.unit = unit;
    from.unit = null;
    // Territory expansion when building or occupying
    if (to.owner === null) to.owner = unit.owner;
  }
}

function resolveCombat(attacker, defender, toIdx) {
  const a = UNIT_STATS[attacker.type];
  const d = UNIT_STATS[defender.type];
  const rollA = a.atk + Math.floor(Math.random() * 3);
  const rollD = d.def + Math.floor(Math.random() * 3);
  const dmgToDef = Math.max(1, rollA - d.def);
  const dmgToAtt = Math.max(0, rollD - a.def);

  defender.hp -= dmgToDef;
  attacker.hp -= dmgToAtt;

  const toTile = state.tiles[toIdx];
  if (defender.hp <= 0) {
    toTile.unit = attacker; // move into tile
  }
}

function canAfford(pid, cost) {
  const r = state.resources[pid];
  return Object.entries(cost).every(([k, v]) => r[k] >= v);
}
function payCost(pid, cost) {
  const r = state.resources[pid];
  Object.entries(cost).forEach(([k, v]) => r[k] -= v);
}

function buildAt(index, type) {
  const t = state.tiles[index];
  const pid = state.currentPlayer;
  if (t.owner !== pid) return alert("ဤနေရာသည် မိမိ领土 မဟုတ်ပါ!");
  if (t.terrain === "water" && type !== "port") return alert("ရေပြင်ပေါ်တွင် Port ချက်သက်မှတည်ဆောက်နိုင်!");
  if (t.building) return alert("ပြီးသားတည်ဆောက်ထားပြီး!");

  const cost = COSTS.build[type];
  if (!canAfford(pid, cost)) return alert("ငွေကြေး/အရင်းအမြစ်မလုံလောက်!");
  payCost(pid, cost);
  t.building = type;
  render();
}

function trainAt(index, unitType) {
  const t = state.tiles[index];
  const pid = state.currentPlayer;
  const cost = COSTS.train[unitType];

  // Must be own tile with barracks (land) or port (ship)
  const isSeaUnit = UNIT_STATS[unitType].kind === "sea";
  const required = isSeaUnit ? "port" : "barracks";
  if (t.owner !== pid) return alert("မိမိ领土 မဟုတ်ပါ!");
  if (t.building !== required) return alert(`ဤနေရာတွင် ${required} မရှိပါ!`);
  if (t.unit) return alert("ဤ Tile တွင် ယာယီစစ်သားရှိပြီး!");

  if (!canAfford(pid, cost)) return alert("အရင်းအမြစ်မလုံလောက်!");
  payCost(pid, cost);
  t.unit = { type: unitType, owner: pid, hp: 3 };
  render();
}

function endTurn() {
  // Production for current player
  const pid = state.currentPlayer;
  const r = state.resources[pid];
  state.tiles.forEach((t) => {
    if (t.owner === pid && t.building) {
      const prod = PRODUCTION[t.building];
      if (prod) {
        Object.entries(prod).forEach(([k, v]) => (r[k] += v));
      }
    }
  });

  // Switch player
  state.turn += 1;
  state.currentPlayer = (state.currentPlayer + 1) % PLAYERS.length;
  render();

  // Simple AI for player 1 (Thailand) if it's AI turn
  if (state.currentPlayer === 1) {
    setTimeout(() => {
      aiTurn(1);
      // Return control to player 0
      state.currentPlayer = 0;
      render();
    }, 400);
  }
}

function aiTurn(pid) {
  // Try build something around owned tiles
  const buildOrder = ["farm", "lumber", "market", "barracks"];
  for (const type of buildOrder) {
    const ownTiles = state.tiles.filter(
      (t) => t.owner === pid && !t.building && t.terrain !== "water"
    );
    if (!ownTiles.length) break;
    const target = ownTiles[Math.floor(Math.random() * ownTiles.length)];
    if (canAfford(pid, COSTS.build[type])) {
      payCost(pid, COSTS.build[type]);
      target.building = type;
      break;
    }
  }

  // Train unit if possible
  const barracksTiles = state.tiles.filter(
    (t) => t.owner === pid && t.building === "barracks" && !t.unit
  );
  if (barracksTiles.length) {
    const options = ["infantry", "archer", "cavalry"];
    for (const u of options) {
      if (canAfford(pid, COSTS.train[u])) {
        const tile = barracksTiles[Math.floor(Math.random() * barracksTiles.length)];
        tile.unit = { type: u, owner: pid, hp: 3 };
        payCost(pid, COSTS.train[u]);
        break;
      }
    }
  }

  // Move units towards enemy capital
  const enemyCap = state.capitals[0];
  state.tiles.forEach((t, idx) => {
    if (t.unit && t.unit.owner === pid) {
      const dx = Math.sign(enemyCap.x - t.x);
      const dy = Math.sign(enemyCap.y - t.y);
      const nx = t.x + dx, ny = t.y + dy;
      const nIdx = ny * WIDTH + nx;
      if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) return;
      tryMoveOrAttack(idx, nIdx);
    }
  });
}

function resetGame() {
  state.turn = 0;
  state.currentPlayer = 0;
  PLAYERS[0].capitalHP = 5; PLAYERS[1].capitalHP = 5;
  state.resources = [
    { rice: 100, gold: 100, timber: 100, spices: 0 },
    { rice: 100, gold: 100, timber: 100, spices: 0 },
  ];
  state.selected.tileIndex = null;
  initMap();
  render();
}

// Wire up UI
function bindUI() {
  document.querySelectorAll("[data-build]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-build");
      const sel = state.selected.tileIndex;
      if (sel == null) return alert("တည်ဆောက်ရန် Tile ရွေးပါ");
      buildAt(sel, type);
    });
  });
  document.querySelectorAll("[data-train]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-train");
      const sel = state.selected.tileIndex;
      if (sel == null) return alert("သင်ကြားရန် Barracks/Port Tile ကို ရွေးပါ");
      trainAt(sel, type);
    });
  });
  document.getElementById("endTurn").addEventListener("click", endTurn);
  document.getElementById("resetGame").addEventListener("click", resetGame);
}

// Boot
initMap();
bindUI();
render();
