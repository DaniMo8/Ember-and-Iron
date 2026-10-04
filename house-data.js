/* House of the Hammer: immutable content shared by the simulation and interface. */
(function (root) {
  "use strict";
  const professions = {
    weaponsmith: {
      name: "Oathblade",
      motto: "A promise in every edge.",
      description:
        "An offensive specialist who turns disciplined practice into dependable weapons.",
      effects: { weaponQuality: 6, speed: 0.1 },
      trait: "Weapon commissions receive +6 quality. All work is 10% faster.",
      milestone: "At 12 weapon mastery, Keen treatment becomes free.",
      stats: [7, 8, 1, 4],
      color: "#dc9870",
    },
    armorer: {
      name: "Bastion smith",
      motto: "The line will hold.",
      description:
        "A patient maker of shields, mail and the equipment that saves a fighter.",
      effects: { heavyQuality: 10 },
      trait:
        "Heavy equipment receives +10 quality. Defensive finishing takes 20% less extra time.",
      milestone: "At 12 armour mastery, Reinforced treatment becomes free.",
      stats: [9, 5, 2, 4],
      color: "#9eb8c4",
    },
    artificer: {
      name: "Cinderwright",
      motto: "Teach the metal to remember.",
      description:
        "An experimental smith who blends metallurgy with restrained enchantment.",
      effects: { proficiencyXp: 0.2, enchant: 0.2 },
      trait:
        "+20% mastery experience and enchantment strength. Starts with access to Warding treatment.",
      milestone: "At 12 class mastery, Warding treatment becomes free.",
      stats: [3, 6, 2, 9],
      color: "#bd9cdf",
    },
    prospector: {
      name: "Deep delver",
      motto: "The mountain keeps its promises.",
      description:
        "A practical founder who values a steady flow of materials over a lucky strike.",
      effects: { miningSpeed: 0.25, manualYield: 1 },
      trait: "Crews extract 25% faster. Helping a cart brings one extra ore.",
      milestone:
        "Your first additional miner costs 40% less. Rich pockets pay 50% more.",
      stats: [8, 3, 3, 6],
      color: "#86c0b2",
    },
    merchant: {
      name: "Guild factor",
      motto: "A good name feeds the forge.",
      description:
        "A commercial founder who turns a modest catalogue into reliable income.",
      effects: { sale: 0.12, staffDiscount: 0.08 },
      trait:
        "+12% sale value and 8% cheaper specialist signing costs. Contracts pay 15% more.",
      milestone:
        "Starts with a 12-gold patron advance and an extra contract choice.",
      stats: [3, 4, 9, 4],
      color: "#dab970",
    },
    mechanist: {
      name: "Clockwork founder",
      motto: "Make good work repeatable.",
      description:
        "A process-minded maker who builds a workshop that can look after itself.",
      effects: { smeltSpeed: 0.15, staffXp: 0.2 },
      trait: "Smelting is 15% faster. Employees learn 20% faster.",
      milestone:
        "Furnace stockkeeper starts installed. One safe ingot policy can run immediately.",
      stats: [5, 5, 3, 7],
      color: "#91baca",
    },
    runesage: {
      name: "Archive keeper",
      motto: "Nothing learned is ever lost.",
      description:
        "A scholar of lost patterns who grows through deliberate practice.",
      effects: { proficiencyXp: 0.3, quality: 2 },
      trait:
        "+30% mastery experience and +2 quality. Practice earns another 20% mastery XP.",
      milestone:
        "Begins with Guild patterns; standard bronze designs are immediately discoverable.",
      stats: [3, 5, 3, 9],
      color: "#b5a6d1",
    },
  };
  const vows = {
    patient: {
      name: "Patient hand",
      text: "+4 quality; crafting takes 12% longer.",
      effects: { quality: 4 },
      time: 1.12,
    },
    industrious: {
      name: "Busy hearth",
      text: "+12% mining and smelting speed; finishing takes 20% longer.",
      effects: { miningSpeed: 0.12, smeltSpeed: 0.12 },
      finish: 1.2,
    },
    generous: {
      name: "Fair employer",
      text: "+25% employee recovery; specialist signing costs are 10% higher.",
      effects: { staffRecovery: 0.25 },
      hire: 1.1,
    },
    independent: {
      name: "Independent maker",
      text: "+10% contract pay; no patron advance, even for a Guild factor.",
      effects: {},
      contract: 0.1,
    },
  };
  const origins = {
    village: {
      name: "Village apprentice",
      text: "Begin with 4 extra wood and 4 leather.",
      supplies: { wood: 4, leather: 4 },
    },
    foundry: {
      name: "Foundry hand",
      text: "Begin with 3 bronze ingots and 2 coal.",
      supplies: { bronze_ingot: 3, fuel: 2 },
    },
    caravan: {
      name: "Caravan repairer",
      text: "Begin with 8 extra gold and 2 leather.",
      gold: 8,
      supplies: { leather: 2 },
    },
  };
  const rooms = {
    smith: [
      "The maker",
      "Build the person behind the house.",
      "Spend attributes, develop a discipline and choose the mastery that will define your equipment.",
      "Crafts earn smith XP. Every level awards five attribute points. Mastery belongs to an item class.",
    ],
    mine: [
      "The workings",
      "Keep the production chain supplied.",
      "Assign crews to ore, coal or tin. Help a cart when useful, and invest in the shortage slowing your plan.",
      "Ore → ingots. Full bins lose manual overflow; crews redirect to another open vein.",
    ],
    smelter: [
      "The foundry",
      "Give raw material a purpose.",
      "Smelt batches and maintain ingot targets. Special alloy grades add useful properties with a clear trade-off.",
      "Ingots → equipment. Unlock the next crucible only after earning its arena licence.",
    ],
    forge: [
      "The forge",
      "Make the answer to your next rival.",
      "Choose a purpose, pattern, material, treatment and enchantment. Reserve team work or supply a contract.",
      "Finishing adds +20, +10, +5, +2, then +1 quality, each for more work time.",
    ],
    shop: [
      "Shop & armoury",
      "Keep the best. Sell the repeatable.",
      "Team upgrades equip automatically. Warehouse contracts complete automatically; shop stock fills the displays.",
      "Spare team gear stays protected in the warehouse. Green comparisons improve a stat; red comparisons show a tradeoff.",
    ],
    arena: [
      "The proving ground",
      "Let your craftsmanship be seen.",
      "Prepare three fighters, inspect a rival, and launch an automatic battle. Replay the decisive moment.",
      "Each rung needs five scoring wins and all three rival styles. Three rungs unlock the champion.",
    ],
    employees: [
      "The common room",
      "Give the routine work good hands.",
      "Hire specialists for each production room. Work earns experience; rest restores effectiveness.",
      "Hire once. No recurring wages. Training, Welfare and Organization develop your workforce.",
    ],
    legacy: [
      "The hall of names",
      "Leave more than a larger number.",
      "Defeat the fifth champion, retire deliberately and choose an inheritance that changes the next opening.",
      "Sparks, furnishings and your house chronicle persist. The economy and league qualification begin again.",
    ],
  };
  const rivals = [
    {
      id: "choir",
      name: "The Iron Choir",
      title: "The shield wall",
      color: "#b4bcc7",
      tactic: "Two armoured wardens protect a hard-hitting archer.",
      response: "Pierce the shield wall",
      hint: "Keen weapons reduce armour. Reinforced mail keeps your front line alive.",
      treatment: "keen",
    },
    {
      id: "thread",
      name: "The Red Thread",
      title: "A hundred cuts",
      color: "#db817e",
      tactic:
        "Fast blades and evasive footwork overwhelm a lightly equipped front.",
      response: "Hold against the fast blades",
      hint: "Shields, reinforced armour and Hold formation absorb repeated small hits.",
      treatment: "reinforced",
    },
    {
      id: "lantern",
      name: "The Glass Lantern",
      title: "Fire behind glass",
      color: "#8bc4ce",
      tactic:
        "A guard protects two fragile firecasters. Physical armour alone cannot stop their fire.",
      response: "Weather the first spell burst",
      hint: "Warding treatment grants fire protection. Break their front before their spells wear you down.",
      treatment: "warding",
    },
  ];
  const leagues = [
    {
      name: "The Cinder Yard",
      champion: "The Gatehouse Warden",
      licence: "Iron",
      scale: 1,
    },
    {
      name: "The Copper Circuit",
      champion: "The Red Castellan",
      licence: "Steel",
      scale: 1.9,
    },
    {
      name: "The Bellfounder League",
      champion: "The Ashen Bell",
      licence: "Mithril",
      scale: 3.4,
    },
    {
      name: "The Gilded Lists",
      champion: "The Ivory Regent",
      licence: "Starforged metal",
      scale: 5.7,
    },
    {
      name: "The Crown of Embers",
      champion: "The Last Sovereign",
      licence: "Legacy",
      scale: 9,
    },
  ];
  const treatments = {
    plain: {
      name: "Open hammer",
      text: "Natural prefix roll; no preparation fee.",
      cost: 0,
      effects: {},
    },
    keen: {
      name: "Keen",
      text: "+2 armour penetration, +3% critical chance; -5% item health.",
      cost: 4,
      effects: { armorPen: 2, crit: 0.03, health: -0.05 },
      mastery: 8,
    },
    reinforced: {
      name: "Reinforced",
      text: "+18% item health and armour; weapon swings 8% slower.",
      cost: 4,
      effects: { health: 0.18, armor: 0.18, slow: 0.08 },
      mastery: 8,
    },
    warding: {
      name: "Warding",
      text: "+18% fire and arcane resistance; -5% item attack.",
      cost: 6,
      effects: { fire: 0.18, arcane: 0.18, attack: -0.05 },
      mastery: 12,
    },
  };
  const grades = {
    standard: {
      name: "Standard",
      text: "Reliable metal; no extra cost.",
      cost: 0,
    },
    tough: {
      name: "Toughened",
      text: "+15% armour and health; weapon attacks 7% slower. 1 extra coal per batch.",
      cost: 1,
    },
    spring: {
      name: "Spring tempered",
      text: "+10% attack and 6% evasion; -10% item armour. 2 extra coal per batch.",
      cost: 2,
    },
  };
  const doctrines = {
    balanced: {
      name: "Measured advance",
      text: "Standard attack and protection. Available from the beginning.",
    },
    hold: {
      name: "Hold formation",
      text: "+20% armour and 8% block; attacks are 10% slower.",
    },
    press: {
      name: "Press the advantage",
      text: "+15% attack; -12% maximum health.",
    },
  };
  const upgrades = {};
  function node(id, room, branch, name, cost, max, effects, text, gate = {}) {
    upgrades[id] = {
      id,
      room,
      branch,
      name,
      cost,
      max,
      effects,
      text,
      ...gate,
    };
  }
  [
    ["iron", "Iron licence", 65, { seamIron: 1 }, 1, 100],
    ["gems", "Gem pocket", 120, { seamGem: 1 }, 1, 250],
    ["mithril", "Mithril gallery", 1700, { seamMithril: 1 }, 3, 2500],
    ["star", "Starfall fissure", 6200, { seamStar: 1 }, 4, 6000],
  ].forEach(([id, name, cost, effects, champions, mined]) =>
    node(
      "mine_" + id,
      "mine",
      "Depth",
      name,
      cost,
      1,
      effects,
      "Open a new working.",
      { champions, mined },
    ),
  );
  node(
    "crew",
    "mine",
    "Workers",
    "Crew quarters",
    70,
    6,
    { workerSlots: 1 },
    "Room for one additional miner per rank.",
  );
  node(
    "picks",
    "mine",
    "Workers",
    "Balanced picks",
    35,
    8,
    { miningSpeed: 0.12 },
    "12% faster extraction per rank.",
  );
  node(
    "carts",
    "mine",
    "Storage",
    "Ore wagons",
    45,
    8,
    { binCapacity: 4 },
    "Four extra spaces in every material bin per rank.",
  );
  node(
    "survey",
    "mine",
    "Depth",
    "Surveyor’s ledger",
    90,
    1,
    {},
    "Optional extra carts from already-open workings every ten minutes. Does not unlock new ores.",
    { mined: 150 },
  );
  node(
    "patterns",
    "forge",
    "Patterns",
    "Guild patterns",
    28,
    1,
    {},
    "Unlock standard bronze designs.",
  );
  for (let tier = 2; tier <= 5; tier++)
    node(
      "patterns_" + tier,
      "forge",
      "Patterns",
      [
        "",
        "",
        "Iron patterns",
        "Steel patterns",
        "Mithril patterns",
        "Starforged patterns",
      ][tier],
      [0, 0, 110, 460, 1800, 6800][tier],
      1,
      { metallurgy: 1 },
      "Discover tier " + tier + " training and standard patterns.",
      {
        champions: tier - 1,
        parent: tier === 2 ? "patterns" : "patterns_" + (tier - 1),
      },
    );
  node(
    "prestige",
    "forge",
    "Patterns",
    "Master’s folio",
    1300,
    1,
    {},
    "Discover demanding prestige patterns with stronger base statistics.",
    { champions: 2, parent: "patterns_3" },
  );
  node(
    "grinder",
    "forge",
    "Craftsmanship",
    "Edge and surface tools",
    55,
    8,
    { quality: 3, affixChance: 0.015 },
    "+3 quality and +1.5 percentage points of natural prefix chance per rank.",
  );
  node(
    "treatment",
    "forge",
    "Craftsmanship",
    "Controlled treatments",
    90,
    1,
    {},
    "Choose Keen, Reinforced or Warding prefixes when class mastery is sufficient.",
  );
  node(
    "runes",
    "forge",
    "Craftsmanship",
    "Engraving table",
    180,
    2,
    { runeBench: 1, enchant: 0.12 },
    "Unlock enchanting; +12% enchantment strength per rank.",
    { champions: 1 },
  );
  node(
    "ceiling",
    "forge",
    "Craftsmanship",
    "Breakthrough workmanship",
    900,
    5,
    { qualityCap: 20 },
    "Raise the quality ceiling by 20, up to 200.",
    { champions: 2 },
  );
  node(
    "bellows_forge",
    "forge",
    "Production",
    "Rhythmic work",
    40,
    8,
    { speed: 0.12 },
    "12% faster normal craft work per rank.",
  );
  node(
    "benches",
    "forge",
    "Production",
    "Second hands",
    240,
    2,
    { lanes: 1 },
    "An additional active crafting bench.",
    { parent: "bellows_forge", level: 4 },
  );
  node(
    "catalogue",
    "forge",
    "Production",
    "Production ledger",
    160,
    1,
    {},
    "Maintain a selected contract pattern automatically, respecting reserves.",
    { contracts: 3 },
  );
  node(
    "shop_prices",
    "shop",
    "Contracts",
    "Guild price book",
    65,
    6,
    { sale: 0.06 },
    "6% better contract and town sale value per rank.",
    { contracts: 1 },
  );
  node(
    "patrons",
    "shop",
    "Contracts",
    "Patron introductions",
    240,
    4,
    {},
    "Unlock higher-value contracts; +8% contract margin per rank.",
    { contracts: 5, reputation: 12 },
  );
  node(
    "stock",
    "shop",
    "Stock",
    "Armoury racks",
    50,
    8,
    { capacity: 4, display: 1 },
    "Four warehouse spaces and one display slot per rank.",
  );
  node(
    "clerk",
    "shop",
    "Stock",
    "Contract clerk",
    220,
    1,
    { contractPay: 0.1 },
    "Negotiate 10% higher payments on newly issued contracts. Deliveries are automatic from the start.",
    { contracts: 4 },
  );
  node(
    "relations",
    "shop",
    "Patrons",
    "House reputation",
    100,
    5,
    { reputationBonus: 1 },
    "One additional reputation per fulfilled contract per rank.",
  );
  node(
    "doctrine",
    "arena",
    "Preparation",
    "Tactical folio",
    95,
    1,
    {},
    "Unlock Hold formation and Press the advantage.",
    { wins: 3 },
  );
  node(
    "infirmary",
    "arena",
    "Preparation",
    "Recovery quarters",
    80,
    6,
    { recovery: 0.15 },
    "15% faster post-bout recovery per rank.",
  );
  node(
    "exhibitions",
    "arena",
    "Exhibitions",
    "Exhibition steward",
    180,
    1,
    {},
    "Authorize repeating one cleared opponent. Stops on defeat.",
    { wins: 5 },
  );
  node(
    "breaker",
    "arena",
    "Fighters",
    "Breaker licence",
    150,
    1,
    {},
    "Borin joins: axes, maces and heavy protection.",
    { champions: 1 },
  );
  node(
    "guardian",
    "arena",
    "Fighters",
    "Guardian licence",
    650,
    1,
    {},
    "Selene joins: a defensive specialist.",
    { champions: 2 },
  );
  node(
    "mage",
    "arena",
    "Fighters",
    "Mage licence",
    1900,
    1,
    {},
    "Vey joins: cloth and arcane equipment.",
    { champions: 3 },
  );
  const api = {
    professions,
    vows,
    origins,
    rooms,
    rivals,
    leagues,
    treatments,
    grades,
    doctrines,
    upgrades,
    slots: ["weapon", "body", "offhand", "ring", "charm", "tool"],
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EIHouseData = api;
})(globalThis);
