(function (root, factory) {
  const flow = factory();
  if (typeof module === 'object' && module.exports) module.exports = flow;
  else root.EIFlow = flow;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const values = object => Object.values(object || {});
  const total = object => values(object).reduce((a, b) => a + b, 0);
  const materialSource = 'Quarry or material shop';
  const percent = value => Math.round(Math.max(0, Math.min(100, value)));
  const clean = item => !item.protected && !item.reservedFor;
  const objective = (title, detail, label, action, id = '', progress) => ({ title, detail, label, action, id, ...(progress === undefined ? {} : { progress: percent(progress) }) });
  const seconds = milliseconds => Math.max(0, Math.ceil(milliseconds / 1000));
  const craftName = (id, data) => ({ swords: 'swordcraft', daggers: 'dagger making', axes: 'axe making', maces: 'mace making', polearms: 'polearm making', bows: 'bow making', foci: 'focus crafting', armor: 'armorsmithing', shields: 'shield making', rings: 'ring making', charms: 'charm making', tools: 'tool making' }[id] || data.classes[id].name.toLowerCase());

  function context(game, data, options) {
    const s = game.state, d = game.derived();
    const rows = values(data.recipes).map(r => {
      const p = game.craftPreview(r.id, { quantity: 1 });
      return { r, p, structural: p.gates.filter(g => g.source !== materialSource).every(g => g.met) };
    });
    const shown = s.inventory.filter(i => i.displayed), sellable = shown.filter(clean);
    const stored = s.inventory.filter(i => !i.displayed && clean(i));
    const heroes = s.adventurers.filter(h => ['browsing', 'ready', 'recovering'].includes(h.status));
    const score = row => {
      const r = row.r, p = row.p;
      const existing = s.inventory.filter(i => i.recipeId === r.id).length + s.jobs.filter(j => j.recipeId === r.id).length;
      let demand = 0;
      for (const h of heroes) {
        const compatible = ['body', 'ring', 'charm', 'tool'].includes(r.slot) || (data.archetypes[h.archetypeId]?.preferences || []).includes(r.classId);
        const blocked = r.slot === 'offhand' && data.recipes[h.equipment.weapon?.recipeId]?.twoHanded;
        if (!compatible || blocked || p.price > h.budget) continue;
        const worn = h.equipment[r.slot], old = data.recipes[worn?.recipeId];
        if (!worn) demand += r.slot === 'weapon' ? 8 : r.slot === 'body' ? 6 : 3;
        else if (r.tier > old.tier || r.tier === old.tier && p.quality > worn.quality + 2) demand += 4;
      }
      return demand * 100 - existing * 1000 + r.tier * 10 + (s.player.proficiency[r.classId]?.level || 0) - p.price / 100;
    };
    const available = rows.filter(row => row.structural);
    const focus = available.find(row => row.r.id === options?.recipeId) || available.slice().sort((a, b) => score(b) - score(a))[0];
    const classRows = focus ? rows.filter(row => row.r.classId === focus.r.classId).sort((a, b) => a.r.tier - b.r.tier) : [];
    const top = classRows.filter(row => row.structural).at(-1);
    const target = top ? classRows.find(row => row.r.tier > top.r.tier) : null;
    const run = s.runs.find(r => !['complete', 'pending'].includes(r.status));
    return { game, data, s, d, rows, available, shown, sellable, stored, focus, target, run,
      shelfSpace: Math.max(0, d.displayCapacity - shown.length), materialSpace: Math.max(0, d.materialCapacity - total(s.materials)) };
  }

  function shortages(c, row) {
    const { s, d, game, data } = c;
    const missing = Object.entries(row.p.inputs).map(([id, need]) => ({ id, need: Math.max(0, need - (s.materials[id] || 0)) })).filter(x => x.need);
    if (!missing.length) return null;
    const label = id => data.materials[id]?.name || id;
    const neededSpace = missing.reduce((n, m) => n + m.need, 0);
    if (neededSpace > c.materialSpace) {
      const extra = neededSpace - c.materialSpace;
      const canSellSurplus = Object.entries(s.materials).some(([id, count]) => count > (row.p.inputs[id] || 0) && Number.isFinite(data.materials[id]?.price));
      if (!canSellSurplus) return objective('Expand your material storage', 'Your stored supplies leave no room for this craft’s missing ingredients. Review warehouse capacity before gathering more.', 'Review storage upgrades', 'nav', 'upgrades');
      return objective('Make room for the next craft', `You need ${extra} more material space${extra === 1 ? '' : 's'} for ${row.r.name}. Sell spare common supplies or increase material storage. Keep its required ingredients.`, 'Manage supplies', 'market');
    }
    const hand = missing.find(m => m.id === 'fuel') || missing.find(m => m.id === 'bronze');
    if (hand) {
      const wait = seconds(s.quarry.nextManualAt - s.simTime);
      return objective(`Gather ${hand.need} ${label(hand.id)}`, `${row.r.name} needs ${hand.need} more. ${wait ? `Hand gathering is ready in ${wait}s.` : 'Gather it free at the quarry.'}`, 'Go to the quarry', 'nav', 'quarry', wait ? (1 - wait / 5) * 100 : undefined);
    }
    const quarry = game.quarryDerived();
    const deposit = missing.find(m => quarry.availableDeposits.some(d => (d.materialId || d.id) === m.id));
    if (deposit) {
      const active = s.quarry.activeDeposit === deposit.id;
      return objective(`Gather ${deposit.need} ${label(deposit.id)}`, active ? `The next quarry haul is due in ${seconds(s.quarry.nextYieldAt - s.simTime)}s. It supplies ${row.r.name}.` : `Select the ${label(deposit.id)} deposit in your quarry to supply ${row.r.name}.`, 'Visit the quarry', 'nav', 'quarry', active ? quarry.progress * 100 : undefined);
    }
    const buyable = missing.filter(m => game.materialAvailable(m.id) && game.materialPrice(m.id) !== null);
    const cost = buyable.reduce((n, m) => n + game.materialPrice(m.id) * m.need, 0);
    if (buyable.length === missing.length && s.player.gold >= cost) return objective('Supply the next craft', `${missing.map(m => `${m.need} ${label(m.id)}`).join(' + ')} costs ${cost}g. You have ${s.player.gold}g.`, 'Buy supplies', 'market');
    const basics = values(data.recipes).filter(r => r.tier === 1).map(r => ({ r, cost: Object.entries(r.inputs).reduce((n, [id, amount]) => n + Math.max(0, amount - (s.materials[id] || 0)) * (game.materialPrice(id) || 99999), 0) })).sort((a, b) => a.cost - b.cost);
    const rescue = basics[0] && ['wood', 'leather'].some(id => (basics[0].r.inputs[id] || 0) > (s.materials[id] || 0));
    if (!s.inventory.length && !s.jobs.length && basics.every(b => b.cost > s.player.gold) && rescue) return objective('Recover a little starting help', 'Reclaim fittings for one basic craft, then gather its metal and fuel at the quarry.', 'Reclaim fittings', 'reclaim');
    if (buyable.length === missing.length) return objective(`Earn ${Math.max(1, cost - s.player.gold)}g for supplies`, `Displayed work sells automatically. You can also sell spare common materials to buy ${missing.map(m => label(m.id)).join(' and ')}.`, c.sellable.length ? 'Visit your shelves' : 'Manage supplies', c.sellable.length ? 'nav' : 'market', c.sellable.length ? 'inventory' : '');
    return objective('Find the missing supplies', `${missing.map(m => `${m.need} ${label(m.id)}`).join(' + ')} is not yet available from the supplier. Your next discoveries open new sources.`, 'See the journeys', 'nav', 'expeditions');
  }

  function tierStep(c) {
    const { game, s, data, focus, target } = c;
    if (!target || !focus) return null;
    const missing = target.p.gates.filter(g => g.source !== materialSource && !g.met);
    const discovery = missing.find(g => g.label === 'Recipe discovery');
    if (discovery) {
      const u = target.r.unlock || {};
      if (u.level && s.player.level < u.level) return objective(`Work toward smith level ${u.level}`, `${Math.max(0, c.d.levelXpRequired - s.player.xp)} XP to your next level. ${target.r.unlockText}`, 'Plan a craft', 'recipe', focus.r.id, s.player.xp / c.d.levelXpRequired * 100);
      return objective('Help your customers discover more', target.r.unlockText || 'Successful journeys reveal the next tier of craftsmanship.', c.run ? 'Watch their adventure' : 'See the journeys', c.run ? 'battle' : 'nav', c.run?.id || 'expeditions');
    }
    const attribute = missing.find(g => g.source === 'Allocate attribute points');
    if (attribute) return objective(`Develop your ${attribute.label}`, `${attribute.current} / ${attribute.required} toward stronger work. Finish crafts to earn XP; each smith level gives you three points to spend.`, s.player.points ? 'Spend attribute points' : 'Plan a craft', s.player.points ? 'attributes' : 'recipe', s.player.points ? '' : focus.r.id, attribute.current / attribute.required * 100);
    const practice = missing.find(g => g.source === 'Craft this item class');
    if (practice) return objective(`Grow your ${craftName(focus.r.classId, data)}`, `Practice ${practice.current} / ${practice.required}. Keep making ${data.classes[focus.r.classId].name.toLowerCase()} to build the skill for stronger materials.`, 'Plan a practice piece', 'recipe', focus.r.id, practice.current / practice.required * 100);
    const upgradeId = Object.keys(target.r.requires?.upgrades || {}).find(id => (s.upgrades[id] || 0) < target.r.requires.upgrades[id]);
    if (upgradeId) {
      const p = game.upgradePreview(upgradeId), u = data.upgrades[upgradeId];
      if (s.player.level < (u.requires?.level || 1)) return objective(`Reach smith level ${u.requires.level}`, `${u.name} becomes available then. It is required for the next crafting tier.`, 'Plan a craft', 'recipe', focus.r.id, s.player.level / u.requires.level * 100);
      return objective(p.eligible ? `Improve the ${u.name}` : `Save ${Math.max(0, p.cost - s.player.gold)}g for ${u.name}`, `Rank ${p.level + 1} costs ${p.cost}g and opens the next tier once its other requirements are met.`, p.eligible ? 'See shop improvements' : 'Visit your shelves', 'nav', p.eligible ? 'upgrades' : 'inventory', Math.min(s.player.gold, p.cost) / p.cost * 100);
    }
    return null;
  }

  function returningGifts(c) {
    const pending = c.s.runs.filter(run => run.status === 'pending' && !run.rewardApplied);
    const bundles = [...c.s.mailbox, ...pending.map(run => run.reward).filter(Boolean)];
    const spaceNeeded = bundles.length ? Math.min(...bundles.map(bundle => total(bundle.materials))) : pending.length ? 1 : 0;
    if (!spaceNeeded || spaceNeeded <= c.materialSpace) return null;
    const extra = spaceNeeded - c.materialSpace;
    const explanation = `Returning gifts need at least ${extra} more material space${extra === 1 ? '' : 's'}. They unpack automatically when there is room.`;
    if (c.focus?.p.eligible && c.s.inventory.length < c.d.storageCapacity) return objective('Make room for returning gifts', `${explanation} Making ${c.focus.r.name} uses ${total(c.focus.p.inputs)} stored supplies.`, 'Use supplies at the forge', 'recipe', c.focus.r.id);
    const common = Object.entries(c.s.materials).some(([id, count]) => count > (c.focus?.p.inputs[id] || 0) && Number.isFinite(c.data.materials[id]?.price));
    return objective('Make room for returning gifts', `${explanation} ${common ? 'Sell spare common supplies to clear a little space.' : 'A larger warehouse can hold their gifts.'}`, common ? 'Manage supplies' : 'Review storage upgrades', common ? 'market' : 'nav', common ? '' : 'upgrades');
  }

  function next(game, data, options = {}) {
    const c = context(game, data, options), { s, d, focus } = c;
    if (!s.started) return objective('Your workshop awaits', 'Distribute your eight starting points and name your forge to begin.', 'Return to the forge', 'nav', 'workshop');
    if (s.inventory.length >= d.storageCapacity) return c.shelfSpace && c.stored.length
      ? objective('Make room for finished work', 'Place stored pieces on your shelves. Customer purchases free space so queued crafts can start.', 'Fill empty shelves', 'fill-shelves')
      : objective('Your finished storage is full', 'Crafting waits for space. Check displayed stock and let useful pieces find a customer; protected pieces remain safe.', 'Review your shelves', 'nav', 'inventory');
    if (s.player.points > 0) return objective('Make your smith stronger', `You have ${s.player.points} unspent point${s.player.points === 1 ? '' : 's'}. Spend them on faster forging, finer work or better prices.`, 'Spend attribute points', 'attributes');
    const gifts = returningGifts(c); if (gifts) return gifts;
    if (c.shelfSpace > 0 && c.stored.length) return objective('Put your finished work on sale', `${Math.min(c.shelfSpace, c.stored.length)} stored piece${Math.min(c.shelfSpace, c.stored.length) === 1 ? '' : 's'} can fill an empty shelf. Customers handle buying and adventuring.`, 'Fill empty shelves', 'fill-shelves');
    const active = s.jobs.filter(j => j.status === 'active').sort((a, b) => a.completeAt - b.completeAt);
    const temper = active.find(j => !j.technique);
    if (temper) return objective('Give this piece a quality finish', `Finish ${data.recipes[temper.recipeId].name} for +20 quality (up to the forge cap) and +10 percentage points prefix chance. Adds ${seconds(temper.duration)}s of work: +100% crafting time.`, 'Quality finish', 'technique', temper.id, (s.simTime - temper.startedAt) / temper.duration * 100);
    if (active.length) {
      const job = active[0];
      return objective('Your forge is working', `${data.recipes[job.recipeId].name} is ready in ${seconds(job.completeAt - s.simTime)}s. ${c.materialSpace ? 'Spare shelf space fills automatically; gather supplies while it finishes.' : 'Material storage is full; check your shelves while it finishes.'}`, c.materialSpace ? 'Gather while you wait' : 'Check your shelves', 'nav', c.materialSpace ? 'quarry' : 'inventory', (s.simTime - job.startedAt) / job.duration * 100);
    }
    if (s.jobs.length) return objective('Your next piece is waiting', 'Its ingredients are already set aside. Work begins when an anvil and a place for the finished piece are free.', 'Check the forge', 'nav', 'workshop');
    if (!c.shelfSpace && !c.sellable.length) return objective('Make a little space on display', 'Your display contains protected or reserved work. Move a keepsake into storage to open a place for stock without removing its protection.', 'Review your shelves', 'nav', 'inventory');
    if (s.stats.sold > 0 && !s.stats.questsWon && !s.stats.questsLost && c.run) return objective('Your work is being put to the test', 'Watch the first journeys. Defeated customers recover and return for better weapons or protection.', 'Watch the adventure', 'battle', c.run.id);
    if (!c.sellable.length && !s.jobs.length && focus) {
      const shortage = shortages(c, focus); if (shortage) return shortage;
      if (focus.p.eligible) return objective(s.stats.crafted ? 'Restock an empty shelf' : 'Make your first piece', `${focus.r.name} uses supplies you already have and takes about ${seconds(focus.p.seconds * 1000)}s. Completed work fills a spare shelf automatically.`, 'Plan this craft', 'recipe', focus.r.id);
    }
    const customer = s.adventurers.find(h => ['browsing', 'ready'].includes(h.status) && c.sellable.some(i => game.salePreview(i.id, h.id).eligible));
    if (customer) return objective('Your shelves are ready', `${customer.name} can afford a useful upgrade. Customers inspect the shelves every few seconds, then leave on their own adventures.`, 'Visit your shelves', 'nav', 'inventory');
    const step = tierStep(c); if (step) return step;
    const commission = s.commissions.find(order => order.status !== 'complete');
    if (commission) return objective('Create a piece worth a commission', `${data.classes[commission.classId].name}: tier ${commission.minTier} or better, quality ${commission.minQuality}+. Matching shelf stock is collected automatically.`, 'Review commissions', 'nav', 'inventory');
    if (d.legacyEligible) return objective('Your forge has earned a legacy', 'You can continue this workshop or inspect what the next generation would inherit.', 'Explore your legacy', 'nav', 'legacy');
    if (focus && c.shelfSpace > 0) {
      const shortage = shortages(c, focus); if (shortage) return shortage;
      return objective('Keep a useful shelf stocked', `${focus.r.name} is your selected craft. Check what returning adventurers already wear before making more.`, 'Plan your next piece', 'recipe', focus.r.id);
    }
    return objective('Let your work find its adventurers', 'The shelves are stocked. Customers buy fitting upgrades, gather parties and bring their stories home.', c.run ? 'Watch an adventure' : 'Visit your shelves', c.run ? 'battle' : 'nav', c.run?.id || 'inventory');
  }

  function milestone(game, data, options = {}) {
    const c = context(game, data, options), { s, focus, target } = c;
    if (!s.started || !focus) return { text: 'Create your smith, then make a piece for the shelves.', progress: 0 };
    if (!s.stats.crafted) return { text: 'Your first adventure: make a piece → fill a shelf → watch it find a customer.', progress: 0 };
    if (!s.stats.sold) return { text: 'Your first sale · Put your finished work on a shelf.', progress: 33 };
    if (!s.stats.questsWon) return { text: 'Your first victory · Help a customer come home with a good story.', progress: 67 };
    if (target) {
      const gates = target.p.gates.filter(g => g.source !== materialSource), missing = gates.filter(g => !g.met);
      const gate = missing.find(g => g.source === 'Craft this item class') || missing[0];
      const detail = gate?.source === 'Craft this item class' ? `Practice ${gate.current}/${gate.required}` : gate?.label === 'Recipe discovery' ? target.r.unlockText : gate ? `${gate.label.charAt(0).toUpperCase() + gate.label.slice(1)} ${gate.current}/${gate.required}` : 'Ready for stronger work';
      const progress = gate ? percent(gate.current / Math.max(1, gate.required) * 100) : 100;
      return { text: `Growing your ${craftName(focus.r.classId, data)} · ${detail}`, progress };
    }
    const commission = s.commissions.find(order => order.status !== 'complete');
    if (commission) {
      const quality = Math.max(0, ...c.sellable.filter(i => data.recipes[i.recipeId].classId === commission.classId && data.recipes[i.recipeId].tier >= commission.minTier).map(i => i.quality));
      return { text: `Commission: ${data.classes[commission.classId].name}, tier ${commission.minTier}+, quality ${commission.minQuality}+.`, progress: percent(quality / commission.minQuality * 100) };
    }
    const proficiency = s.player.proficiency[focus.r.classId]?.level || 0;
    return { text: proficiency < 100 ? `All tiers learned in ${data.classes[focus.r.classId].name.toLowerCase()}. Mastery ${proficiency}/100.` : 'All tiers and full mastery achieved. Supply commissions, improve equipment, or build your legacy.', progress: percent(proficiency) };
  }
  return { next, milestone };
});
