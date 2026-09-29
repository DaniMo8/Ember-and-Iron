"""Full equipment taxonomy and Legacy tree; earlier flow retained as an archive."""
from build_diagrams import SVG, OUT, PAPER, WHITE, INK, MUTED, LINE, AMBER, PALE


def flow():
    s = SVG(1500, 1750, 'Ember and Iron — full game flow', 'Expanded blacksmith RPG loop: twelve proficiencies, six archetypes, party and boss quests, parallel stations and staff, bounded offline progress and permanent Legacy talents. Retirement keeps collection records, decor, one physical heirloom and its recipe.')
    s.text(70, 58, 'EMBER & IRON', 20, 700, AMBER)
    s.text(70, 102, 'A shop that sends stories into the world', 33, 700)
    s.text(70, 137, 'Full-scope game flow · the workshop, parties and quests share one simulation clock', 18, color=MUTED)
    xs = [70, 570, 1070]
    w, h = 360, 115
    s.node(xs[0], 205, w, h, '01  Establish your smith', ['New profile or next generation', 'Allocate stats + apply Legacy talents'])
    s.node(xs[1], 205, w, h, '02  Choose an unlocked recipe', ['12 proficiencies · 60 core recipes', 'Check stat, discovery + station gates'])
    s.node(xs[2], 205, w, h, '03  Reserve materials + queue', ['Assign parallel stations + staff', 'Reserve inputs; enforce capacity'])
    s.node(xs[2], 405, w, h, '04  Finish + refine equipment', ['Quality, materials, affixes + enchant', 'Keep, display or collect the result'])
    s.node(xs[1], 405, w, h, '05  Grow through practice', ['Class XP, smith XP + stat points', 'Master a class or develop a new one'])
    s.node(xs[0], 405, w, h, '06  Stock the storefront', ['Your assortment attracts 6 archetypes', 'Prices, commissions + relationships'])
    s.node(xs[0], 605, w, h, '07  Gather adventurers', ['Solo heroes + compatible parties', 'Gear fit, needs, budgets + roles'])
    s.node(xs[1], 605, w, h, '08  Sell, equip + plan', ['Trade; snapshot complete loadouts', 'Choose a quest and branching route'])
    s.node(xs[2], 605, w, h, '09  Watch quest battles', ['Parties, boss phases + gear counters', 'Crafting continues in parallel'], True)
    s.node(xs[2], 805, w, h, '10  Resolve the expedition', ['Victory, retreat + quest choices', 'Persist the recorded combat result'])
    s.node(xs[1], 805, w, h, '11  Earn returns + discovery', ['Materials, reputation + relationships', 'New recipes and quest story routes'])
    s.node(xs[0], 805, w, h, '12  Expand the workshop', ['Stations, staff, decor + automation', 'Alloys, shop upgrades + RPG talents'], True)
    for d in ['M430 262 H570', 'M930 262 H1070', 'M1250 320 V405', 'M1070 462 H930', 'M570 462 H430', 'M250 520 V605', 'M430 662 H570', 'M930 662 H1070', 'M1250 720 V805', 'M1070 862 H930', 'M570 862 H430']:
        s.path(d)
    s.text(997, 842, 'Victory', 16, color=AMBER, anchor='middle')
    s.path('M70 862 H32 V174 H750 V205')
    s.text(375, 194, 'Build a more capable shop', 16, color=AMBER)
    s.path('M1430 660 H1470 V263 H1430', dashed=True)
    s.text(1250, 190, 'Continue crafting in parallel', 16, color=AMBER, anchor='middle')
    s.node(1070, 1000, 360, 115, 'Rest, return + improve', ['Return to shop for better equipment', 'Retry the quest or choose an easier one'])
    s.path('M1250 920 V1000')
    s.text(1267, 966, 'Retreat', 16, color=AMBER)
    s.path('M1070 1057 H975 V959 H250 V920')
    s.text(600, 984, 'Recover and reinvest without losing progress', 16, color=AMBER, anchor='middle')
    s.rect(70, 1000, 600, 115, PALE)
    s.text(92, 1034, 'Owned quarry → forge materials at step 03', 20, 700)
    s.text(92, 1067, ['Workers, tools, depth + smelter → material supply.', 'Richer ore → stronger crafted equipment.'], 18, color=MUTED, lh=26)
    s.path('M390 920 V1000')
    s.text(410, 951, 'Invest in the quarry', 16, color=AMBER)
    s.rect(70, 1160, 1360, 305, PALE)
    s.text(94, 1196, 'OPTIONAL LEGACY · A NEW GENERATION', 18, 700, AMBER)
    s.node(94, 1220, 370, 156, 'Meet retirement conditions', ['Reach level 8 and win 6 quests', 'Preview earned Legacy points'])
    s.node(564, 1220, 370, 156, 'Retire the current run', ['Reset heroes, stats, stations + gold', 'Keep records, decor + one heirloom', 'Also retain the heirloom recipe'])
    s.node(1034, 1220, 370, 156, 'Invest in permanent talents', ['Force · Artifice · Commerce · Lore', 'Begin a new generation at step 01'])
    s.path('M464 1298 H564')
    s.path('M934 1298 H1034')
    s.path('M70 880 H52 V1298 H94', dashed=True)
    s.text(94, 1414, ['Collection records preserve recipe discovery and masterwork history; they do not keep every recipe craftable.', 'Retirement is deliberate: review the reset, select one physical heirloom, then carry its recipe into the next run.'], 18, color=MUTED, lh=26)
    s.rect(70, 1510, 1360, 165)
    s.text(94, 1546, 'OFFLINE SIMULATION', 18, 700, AMBER)
    s.text(94, 1578, ['Without assistant: finish reserved crafts and departed quests; no new browsing, buying or sales.', 'With configured staff: auto-buy, sell and queue across stations within saved budgets and capacities.', 'Advance the shared scheduler for up to eight hours; apply each completion and reward once.', 'Show one return recap with credited time, production, authorised sales, quest outcomes and pause reasons.'], 18, color=MUTED, lh=25)
    s.text(70, 1716, 'Early wins are uncertain: stronger equipment, class mastery and sensible quest choice make progress reliable. Full design · v0.3', 16, color=MUTED)
    s.save('game-flow.svg')


def item_tree():
    s = SVG(1500, 1560, 'Ember and Iron — full item category tree', 'Twelve proficiencies and sixty core recipes across bronze, iron, steel, mithril and starforged tiers. Six adventurer archetypes use the equipment. Quality, rarity, affixes, enchantments and requirements are separate attributes.')
    s.text(65, 57, 'EMBER & IRON', 20, 700, AMBER)
    s.text(65, 101, 'Twelve crafts, six kinds of adventurer', 33, 700)
    s.text(65, 136, 'Category defines the craft; material, quality and rarity describe the individual item.', 18, color=MUTED)
    s.node(540, 178, 420, 90, 'Craftable equipment', ['12 proficiencies · 60 core recipes'], True)
    s.path('M750 268 V300 H285 V333')
    s.path('M750 268 V333')
    s.path('M750 300 H1210 V333')
    for x, w, label in [(70,430,'WEAPONS'),(550,430,'PROTECTION'),(1030,400,'ACCESSORIES + UTILITY')]:
        s.rect(x,333,w,67,PALE)
        s.text(x+w/2,375,label,19,700,anchor='middle')
    s.path('M285 400 V419 H88 V1075', arrow=False)
    for i, title in enumerate(['Daggers','Swords','Axes','Maces','Polearms','Bows','Arcane foci']):
        y=437+i*100
        s.path(f'M88 {y+38} H120')
        s.node(120, y, 380, 81, title, [f'Proficiency class {i+1:02}'], True)
    s.path('M765 400 V418 H565 V721', arrow=False)
    s.path('M565 484 H595')
    s.node(595, 437, 385, 94, 'Armor', ['Proficiency class 08'], True)
    s.path('M787 531 V556')
    s.rect(620, 556, 360, 97)
    s.text(640, 589, 'Light · Medium · Heavy', 19, 700)
    s.text(640, 619, ['Variants share one armor proficiency.', 'Weight, defense and mobility vary.'], 16, color=MUTED, lh=23)
    s.path('M565 721 H595')
    s.node(595, 674, 385, 94, 'Shields', ['Proficiency class 09'], True)
    s.path('M787 768 V793')
    s.rect(620, 793, 360, 97)
    s.text(640, 826, 'Buckler · Kite · Tower', 19, 700)
    s.text(640, 856, 'Variants share one shield proficiency.', 16, color=MUTED)
    s.path('M1230 400 V420 H1055 V689', arrow=False)
    for i, (y, title) in enumerate([(437,'Rings'),(538,'Charms'),(639,'Tools')]):
        s.path(f'M1055 {y+39} H1083')
        s.node(1083, y, 347, 81, title, [f'Proficiency class {i+10:02}'], True)
    s.rect(595, 945, 385, 173, PAPER, LINE, dash='6 6')
    s.text(617, 980, 'Progress follows the craft', 20, 700)
    s.text(617, 1015, ['Every completed recipe trains its class.', 'Material, rarity and item variants', 'do not create extra proficiencies.', 'Tools here are adventurer equipment.'], 17, color=MUTED, lh=26)
    s.rect(1030, 780, 400, 338, PAPER, LINE, dash='6 6')
    s.text(1052, 815, 'Adventurer archetypes', 20, 700)
    s.text(1052, 853, ['Vanguard · reliable front line', 'Duelist · speed and precision', 'Breaker · heavy offense', 'Ranger · ranged pressure', 'Guardian · protection and control', 'Mage · elemental power', '', 'Stock and compatibility shape arrivals.', 'Party roles complement equipment.'], 18, color=MUTED, lh=27)
    s.rect(70, 1170, 1360, 310)
    s.text(94, 1207, 'SEPARATE ITEM ATTRIBUTES · NOT A SINGLE UPGRADE LADDER', 19, 700, AMBER)
    s.text(94, 1250, ['Materials: bronze / iron / steel / mithril / starforged', 'Five material variants per class: 60 core recipes', 'Quality: workmanship scored from 0 to 100', 'Rarity: common / uncommon / rare / epic / legendary', 'Provenance: maker, owner and notable exploits'], 18, color=MUTED, lh=36)
    s.text(820, 1250, ['Affixes: item modifiers with explicit effects', 'Enchantment: separately applied magical effects', 'Requirements: stats + proficiency + station', 'Discovery gates: recipe and/or quest milestone', 'Collections preserve discovery and masterwork records.'], 18, color=MUTED, lh=36)
    s.text(70, 1528, 'Amber nodes: all twelve proficiency classes      Paper nodes: equipment variants or supporting rules      Full scope · v0.5', 16, color=MUTED)
    s.save('item-tree.svg')


LEGACY_BRANCHES = [
    ('FORCE', 'Production capacity and the strength of the forge', [
        ('Practiced Hands', '+12% crafting speed'),
        ('Deep Stores', '+8 storage capacity'),
        ('Heavy Forms', '+6 quality for heavy equipment'),
        ('Tireless Furnace', '+2 craft queue slots'),
        ('Twin Anvils', '+1 parallel production lane'),
        ('Founders Strength', '+2 starting Strength'),
    ]),
    ('ARTIFICE', 'Fine workmanship, magic and the chosen heirloom', [
        ('Steady Eye', '+4 quality for all crafts'),
        ('Keen Edges', '+8% equipment attack'),
        ('Measured Lines', '+15 percentage points affix chance'),
        ('Runic Resonance', '+25% enchantment effect'),
        ('Masterwork Tradition', '+8 quality for all crafts'),
        ('Heirloom Bond', '+20% heirloom combat effects'),
    ]),
    ('COMMERCE', 'A lasting reputation and an efficient business', [
        ('Trusted Name', '+10% sale price'),
        ('Busy Counter', 'Customer arrivals 20% faster'),
        ('Guild Purse', '+20% customer budgets'),
        ('Fair Contracts', 'Staff costs 25% less'),
        ('Trade Network', 'Materials cost 15% less'),
        ('Family Fortune', '+250 starting gold'),
    ]),
    ('LORE', 'Faster learning, richer returns and stronger parties', [
        ('Patient Study', '+20% proficiency XP'),
        ('Field Notes', '+20% adventurer XP'),
        ('Hidden Veins', '+25% quest loot'),
        ('Ancient Script', 'Recipe proficiency gates −5; floor 0'),
        ('Shared Purpose', 'Party synergy: 20% instead of 10%'),
        ('Living Archive', 'Start every proficiency at 10'),
    ]),
]


def legacy_tree():
    s = SVG(1500, 2350, 'Ember and Iron — Legacy talent tree', 'Twenty-four permanent talents in four independent sequential chains: Force, Artifice, Commerce and Lore. Each talent has one rank and requires the previous talent in its branch. Costs by depth are two, four, seven, eleven, nineteen and thirty-three Legacy points. The first talent requires one completed retirement.')
    s.text(70, 57, 'EMBER & IRON', 20, 700, AMBER)
    s.text(70, 104, 'A master retires. Their craft remains.', 35, 700)
    s.text(70, 142, 'Legacy tree · 24 permanent talents · four independent paths · one rank per talent', 19, color=MUTED)
    s.rect(70, 174, 1360, 116, PALE)
    s.text(94, 211, 'SHARED LEGACY POINT POOL', 20, 700, AMBER)
    s.text(94, 245, ['First node: complete one retirement. Later nodes: own the previous node in that branch.', 'Spend across any branch. Costs by depth: 2 → 4 → 7 → 11 → 19 → 33 points; 76 points completes one branch.'], 19, color=MUTED, lh=28)
    costs=[2,4,7,11,19,33]
    locations=[(70,330),(780,330),(70,1190),(780,1190)]
    for (name,desc,nodes),(x,y) in zip(LEGACY_BRANCHES,locations):
        s.rect(x,y,650,814,PAPER,LINE)
        s.text(x+26,y+40,name,24,700,AMBER)
        s.text(x+26,y+70,desc,18,color=MUTED)
        for depth, ((title,effect),cost) in enumerate(zip(nodes,costs)):
            ny=y+95+depth*115
            s.rect(x+27,ny,596,89,PALE if depth==5 else WHITE,AMBER if depth==5 else LINE,12)
            s.text(x+47,ny+31,f'{depth+1:02}  {title}',21,700)
            s.text(x+47,ny+62,effect,18,color=MUTED)
            s.text(x+602,ny+32,f'{cost} Sparks',18,700,AMBER,anchor='end')
            if depth<5:
                s.path(f'M{x+325} {ny+89} V{ny+115}')
    s.path('M395 290 V330')
    s.path('M1105 290 V330')
    s.path('M90 290 V309 H40 V1230 H70')
    s.path('M1410 290 V309 H1460 V1230 H1430')
    s.rect(70,2050,1360,214,PALE)
    s.text(94,2087,'RETIREMENT RULES',20,700,AMBER)
    s.text(94,2124,['Eligible at smith level 8 and 6 quest wins. Retirement is optional and requires a reset preview.', 'Points earned = 1 + floor(level / 5) + floor(quest wins / 5) + floor(masterworks / 3).', 'Keep purchased Legacy talents, collection records, decor, and one physical heirloom plus its recipe.', 'Reset run progress, heroes, stats, stations and gold; retained collection records do not unlock every recipe.'],19,color=MUTED,lh=33)
    s.text(70,2315,'Arrows are prerequisites, not exclusive choices. Sparks are Legacy points. Permanent effects apply to later generations. Full design · v1.1',16,color=MUTED)
    s.save('legacy-tree.svg')
    mermaid=['flowchart TB', '    ROOT["Shared Legacy point pool — one completed retirement required"]']
    for branch,_,nodes in LEGACY_BRANCHES:
        previous='ROOT'
        for depth,((title,effect),cost) in enumerate(zip(nodes,costs),1):
            nodeid=f'{branch}_{depth}'
            mermaid.append(f'    {previous} --> {nodeid}["{title} · {cost} Sparks<br/>{effect}"]')
            previous=nodeid
    mermaid.extend([
        '    RULE["Each node has one rank. Own the previous node in its branch. Branches can be combined."] -.-> ROOT',
        '    RESET["Optional retirement: level 8 and 6 wins. Keep talents, collection records, decor, one physical heirloom and its recipe."] --> ROOT',
        '    PAYOUT["Points: 1 + floor(level / 5) + floor(wins / 5) + floor(masterworks / 3)"] --> RESET',
        '    classDef accent fill:#f3e4c3,stroke:#9b6109,color:#292823;',
        '    class ROOT,FORCE_6,ARTIFICE_6,COMMERCE_6,LORE_6 accent;',
    ])
    (OUT/'legacy-tree.mmd').write_text('\n'.join(mermaid)+'\n',encoding='utf-8')


if __name__ == '__main__':
    flow()
    item_tree()
    legacy_tree()
