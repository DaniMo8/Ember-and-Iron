from pathlib import Path
from html import escape
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parent
PAPER = '#f7f4ec'
WHITE = '#fffdf8'
INK = '#292823'
MUTED = '#66645c'
LINE = '#d7d1c4'
AMBER = '#9b6109'
PALE = '#f3e4c3'
GREEN = '#476b56'


class SVG:
    def __init__(self, w, h, title, desc):
        self.w, self.h = w, h
        self.parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10 Z" fill="{AMBER}"/></marker></defs>
<style>text{{font-family:Arial,Helvetica,sans-serif;fill:{INK}}}.muted{{fill:{MUTED}}}.amber{{fill:{AMBER}}}.heading{{font-weight:700}}.label{{font-size:17px}}.small{{font-size:16px}}</style>
<rect width="{w}" height="{h}" fill="{PAPER}"/>''']

    def rect(self, x, y, w, h, fill=WHITE, stroke=LINE, r=14, dash=None):
        ds = f' stroke-dasharray="{dash}"' if dash else ''
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"{ds}/>')

    def text(self, x, y, lines, size=18, weight=400, color=INK, anchor='start', lh=None):
        if isinstance(lines, str):
            lines = [lines]
        lh = lh or round(size * 1.42)
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" style="fill:{color}" text-anchor="{anchor}">')
        for i, line in enumerate(lines):
            self.parts.append(f'<tspan x="{x}" dy="{0 if i == 0 else lh}">{escape(line)}</tspan>')
        self.parts.append('</text>')

    def path(self, d, arrow=True, dashed=False, color=AMBER, width=2.4):
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"'+(' marker-end="url(#arrow)"' if arrow else '')+(' stroke-dasharray="7 7"' if dashed else '')+'/>')

    def node(self, x, y, w, h, title, lines, accent=False):
        self.rect(x, y, w, h, PALE if accent else WHITE, AMBER if accent else LINE)
        self.text(x+20, y+32, title, size=20, weight=700)
        self.text(x+20, y+61, lines, size=17, color=MUTED, lh=25)

    def save(self, name):
        data = '\n'.join(self.parts) + '\n</svg>\n'
        ET.fromstring(data)
        (OUT / name).write_text(data, encoding='utf-8')
        print(f'{name}: {self.w} × {self.h}; XML valid')


def archived_v01_flow():
    s = SVG(1500, 1390, 'Ember and Iron — game flow', 'The persistent blacksmith progression loop, adventurer purchase and quest cycle, non-punitive retreat path, and bounded offline simulation.')
    s.text(70, 58, 'EMBER & IRON', 20, 700, AMBER)
    s.text(70, 102, 'A shop that sends stories into the world', 33, 700)
    s.text(70, 137, 'Core game flow · crafting and existing quests share one simulation clock', 18, color=MUTED)
    xs = [70, 570, 1070]
    w, h = 360, 115
    s.node(xs[0], 205, w, h, '01  Establish your smith', ['Create profile · allocate stat points', 'STR · precision · charisma · knowledge'])
    s.node(xs[1], 205, w, h, '02  Choose an unlocked recipe', ['Check stats + class proficiency', 'Check recipe, quest + station gates'])
    s.node(xs[2], 205, w, h, '03  Reserve materials + queue', ['Pay inputs once when queued', 'Craft at an available station'])
    s.node(xs[2], 405, w, h, '04  Finish the item', ['Resolve quality + item properties', 'Add finished equipment to inventory'])
    s.node(xs[1], 405, w, h, '05  Grow through practice', ['Gain class proficiency + player XP', 'Level-ups grant assignable stat points'])
    s.node(xs[0], 405, w, h, '06  Stock the storefront', ['List completed items for sale', 'Your assortment shapes visitor types'])
    s.node(xs[0], 605, w, h, '07  A compatible visitor arrives', ['Adventurer role, needs + budget', 'Preview their intended quest'])
    s.node(xs[1], 605, w, h, '08  Sell + equip', ['Receive gold for the purchase', 'Lock a quest equipment snapshot'])
    s.node(xs[2], 605, w, h, '09  Adventurer battles', ['Watch the quest while crafting', 'Gear quality + fit affect readiness'], True)
    s.node(xs[2], 805, w, h, '10  Resolve the expedition', ['Success or retreat', 'Apply the recorded quest outcome'])
    s.node(xs[1], 805, w, h, '11  Receive the consequences', ['Success: reputation + relationships', 'Strong readiness may earn return gifts'])
    s.node(xs[0], 805, w, h, '12  Reinvest + unlock', ['Buy stations · enhance equipment', 'Stat, recipe + quest gates open items'], True)
    for d in ['M430 262 H570', 'M930 262 H1070', 'M1250 320 V405', 'M1070 462 H930', 'M570 462 H430', 'M250 520 V605', 'M430 662 H570', 'M930 662 H1070', 'M1250 720 V805', 'M1070 862 H930', 'M570 862 H430']:
        s.path(d)
    s.text(997, 842, 'Success', 16, color=AMBER, anchor='middle')
    s.path('M70 862 H32 V174 H750 V205')
    s.text(375, 194, 'Build a more capable shop', 16, color=AMBER)
    s.path('M1430 660 H1470 V263 H1430', dashed=True)
    s.text(1250, 190, 'Continue crafting in parallel', 16, color=AMBER, anchor='middle')
    s.node(1070, 1000, 360, 115, 'Retreat is recoverable', ['No lost levels, recipes or proficiency', 'No rollback of completed shop sales'])
    s.path('M1250 920 V1000')
    s.text(1267, 966, 'Retreat', 16, color=AMBER)
    s.path('M1070 1057 H975 V959 H250 V920')
    s.text(600, 984, 'Recover and reinvest without losing progress', 16, color=AMBER, anchor='middle')
    s.rect(70, 1000, 600, 115, PALE)
    s.text(92, 1034, 'Optional rewards require an earned outcome', 20, 700)
    s.text(92, 1067, ['Quest completions may unlock recipes or rare crafts.', 'Over-geared heroes may bring a material, gift or lead.'], 18, color=MUTED, lh=26)
    s.rect(70, 1160, 1360, 161)
    s.text(94, 1196, 'OFFLINE SIMULATION', 18, 700, AMBER)
    s.text(94, 1228, ['Without assistant: finish reserved crafts and departed quests; no new browsing, buying or sales.', 'With configured assistant: auto-buy, sell and queue within saved budgets and capacities.', 'Advance the shared scheduler for up to eight hours; apply each completion once.', 'Show one return recap with credited time, production, authorised sales and quest outcomes.'], 18, color=MUTED, lh=25)
    s.text(70, 1360, 'Solid arrows: progression sequence      Dashed arrow: simultaneous activity      Draft system specification', 16, color=MUTED)
    s.save('game-flow.svg')


def archived_v01_item_tree():
    s = SVG(1500, 1330, 'Ember and Iron — item category tree', 'Six launch proficiency classes: daggers, swords, axes, maces, armor and shields. Materials, quality, rarity, affixes and requirements are separate attributes rather than a linear tier tree.')
    s.text(65, 57, 'EMBER & IRON', 20, 700, AMBER)
    s.text(65, 101, 'Equipment families, with room to grow', 33, 700)
    s.text(65, 136, 'Category defines the craft; material, quality and rarity describe the individual item.', 18, color=MUTED)
    s.node(540, 178, 420, 90, 'Craftable equipment', ['Launch scope + future families'], True)
    s.path('M750 268 V300 H285 V333')
    s.path('M750 268 V333')
    s.path('M750 300 H1210 V333')
    s.rect(70, 333, 430, 67, PALE)
    s.text(285, 375, 'WEAPONS', 21, 700, anchor='middle')
    s.rect(550, 333, 430, 67, PALE)
    s.text(765, 375, 'PROTECTION', 21, 700, anchor='middle')
    s.rect(1030, 333, 400, 67)
    s.text(1230, 375, 'ACCESSORIES · EXPANSION', 19, 700, anchor='middle')
    s.path('M285 400 V419 H88 V913', arrow=False)
    for y, title, line in [(437,'Daggers','MVP proficiency class 01'),(538,'Swords','MVP proficiency class 02'),(639,'Axes','MVP proficiency class 03'),(740,'Maces','MVP proficiency class 04')]:
        s.path(f'M88 {y+38} H120')
        s.node(120, y, 380, 81, title, [line], True)
    s.path('M88 913 H120')
    s.node(120, 861, 380, 142, 'Future weapon classes', ['Polearms', 'Bows', 'Arcane foci'])
    s.path('M765 400 V418 H565 V721', arrow=False)
    s.path('M565 484 H595')
    s.node(595, 437, 385, 94, 'Armor', ['MVP proficiency class 05'], True)
    s.path('M787 531 V556')
    s.rect(620, 556, 360, 97)
    s.text(640, 589, 'Light · Medium · Heavy', 19, 700)
    s.text(640, 619, ['Variants share one armor proficiency.', 'Separate armor classes can come later.'], 16, color=MUTED, lh=23)
    s.path('M565 721 H595')
    s.node(595, 674, 385, 94, 'Shields', ['MVP proficiency class 06'], True)
    s.path('M787 768 V793')
    s.rect(620, 793, 360, 97)
    s.text(640, 826, 'Buckler · Kite · Tower', 19, 700)
    s.text(640, 856, 'Variants share one shield proficiency.', 16, color=MUTED)
    s.path('M1230 400 V420 H1055 V689', arrow=False)
    for y, title in [(437,'Rings'),(538,'Charms'),(639,'Tools')]:
        s.path(f'M1055 {y+39} H1083')
        s.node(1083, y, 347, 81, title, ['Expansion family'])
    s.rect(1030, 780, 400, 223, PAPER, LINE, dash='6 6')
    s.text(1052, 815, 'Scope guardrail', 20, 700)
    s.text(1052, 850, ['Ship 6 proficiency classes.', 'Do not create a new skill for each', 'material, variant, rarity or recipe.', '', 'This tree is a taxonomy.', 'It is not a linear upgrade ladder.'], 18, color=MUTED, lh=26)
    s.rect(70, 1053, 1360, 205)
    s.text(94, 1090, 'ORTHOGONAL ITEM ATTRIBUTES', 19, 700, AMBER)
    s.text(94, 1128, ['Material: bronze / iron / steel', 'Quality: a numeric score from 0 to 100', 'Rarity: common / uncommon / rare / epic / legendary'], 19, color=MUTED, lh=34)
    s.text(835, 1128, ['Affixes: authored item modifiers', 'Requirements: stats + proficiency + station', 'Rare crafts: recipe and/or quest completion'], 19, color=MUTED, lh=34)
    s.text(70, 1298, 'Amber nodes: six MVP proficiency classes      Paper nodes: variants or expansion scope      Draft content taxonomy', 16, color=MUTED)
    s.save('item-tree.svg')


def desktop():
    s = SVG(1440, 1010, 'Ember and Iron — desktop layout', 'Conceptual desktop wireframe at 1440 pixels. Status above, navigation at left, recipe catalog and item detail in the middle, customer and expedition views at right, with a persistent craft queue below.')
    s.rect(24, 24, 1392, 107, INK, INK)
    s.text(46, 63, 'EMBER & IRON', 25, 700, PALE)
    s.text(335, 60, 'Level 4 smith', 19, 700, WHITE)
    s.text(505, 60, 'Gold 240', 19, 700, WHITE)
    s.text(659, 60, 'Reputation 18', 19, 700, WHITE)
    s.text(1209, 60, 'Save / Settings', 17, color=WHITE)
    s.text(335, 100, 'STR 6    PRE 5    CHA 4    KNO 5', 18, color=PALE)
    s.text(46, 103, 'Your forge · Spring, day 3', 16, color=WHITE)
    s.text(767, 100, 'Iron 24    Leather 12    Fuel 18', 18, color=PALE)
    s.rect(24, 151, 174, 755)
    s.text(45, 188, 'SHOP', 16, 700, AMBER)
    for i, title in enumerate(['Workshop', 'Quarry', 'Adventurers', 'Upgrades', 'Ledger', 'Legacy', 'Settings']):
        y=210+i*57
        if i == 0:
            s.rect(37, y, 148, 44, PALE, PALE, 8)
        s.text(50, y+29, title, 18, 700 if i == 0 else 400)
    s.text(46, 649, 'SMITH', 16, 700, AMBER)
    s.text(46, 688, ['Stats + level', 'Proficiencies', 'Milestones'], 17, color=MUTED, lh=42)
    s.rect(37, 831, 148, 55, PALE)
    s.text(111, 865, '+2 stat points', 17, 700, AMBER, anchor='middle')
    s.rect(218, 151, 272, 585)
    s.text(238, 187, 'RECIPES', 20, 700)
    s.rect(238, 207, 232, 42, PAPER)
    s.text(253, 234, 'Search recipes…', 16, color=MUTED)
    s.text(238, 279, 'All   Weapons   Protection', 16, 700, AMBER)
    entries=[('Iron Longsword','Swords · ready to craft',True),('Emberguard Buckler','Locked · Shields 15',False),('Iron Stiletto','Daggers · ready to craft',False),('Iron Flanged Mace','Maces · ready to craft',False),('Riveted Leather Vest','Armor · ready to craft',False)]
    for i,(title,sub,selected) in enumerate(entries):
        y=302+i*75
        s.rect(232,y,244,66,PALE if selected else WHITE,AMBER if selected else LINE,9)
        s.text(248,y+26,title,18,700)
        s.text(248,y+51,sub,16,color=MUTED)
    s.text(238, 710, 'Show locked recipes  ✓', 16, color=MUTED)
    s.rect(510,151,524,585)
    s.text(534,187,'IRON LONGSWORD',21,700)
    s.text(534,218,'Swords · iron · common',17,color=MUTED)
    s.rect(534,237,113,112,PAPER)
    s.path('M563 320 L616 261 M553 308 L577 332 M556 329 L549 336',arrow=False,color=AMBER,width=6)
    s.text(670,262,'Balanced one-handed blade',18,700)
    s.text(670,294,['Fits: Vanguard','Use: close combat'],17,color=MUTED,lh=27)
    s.path('M534 371 H1008',arrow=False,color=LINE,width=1.5)
    s.text(534,404,'Requirements',18,700)
    s.text(534,435,['✓ STR 5    ✓ PRE 4    ✓ Swords 15','✓ Reinforced anvil    ✓ Quarry Road victory'],17,color=MUTED,lh=29)
    s.text(534,502,'Inputs: 3 iron · 1 leather · 1 fuel',18,700)
    s.text(534,534,'68.2 seconds · Automatic quality 52 / 100',17,color=MUTED)
    s.text(534,565,'Swords 18 · XP 10 / 28 · Tools +5 · Difficulty 8',17,color=MUTED)
    s.rect(534,581,474,12,PAPER,LINE,6)
    s.rect(534,581,169,12,AMBER,AMBER,6)
    s.rect(534,616,130,49,PAPER)
    s.text(599,648,'−    1    +',19,700,anchor='middle')
    s.rect(680,616,328,49,AMBER,AMBER)
    s.text(844,648,'Queue craft',19,700,WHITE,anchor='middle')
    s.text(534,704,'Inputs are reserved when added to the queue.',16,color=MUTED)
    s.rect(1054,151,362,295)
    s.text(1077,187,'CUSTOMERS',20,700)
    s.text(1077,225,'Mara · Vanguard',19,700)
    s.text(1077,255,['Quest: Quarry Road','Seeks: sword, shield or armor','Budget: 40 gold'],17,color=MUTED,lh=28)
    s.rect(1077,337,315,42,PALE)
    s.text(1093,364,'2 suitable items in stock',17,700,AMBER)
    s.rect(1077,391,315,36,PAPER)
    s.text(1234,415,'Open storefront',16,700,anchor='middle')
    s.rect(1054,466,362,440)
    s.text(1077,502,'LIVE EXPEDITION',20,700)
    s.text(1077,534,'Bren · Smuggler Cache',17,700)
    s.rect(1077,553,315,147,PAPER)
    s.text(1096,588,'Bren',17,700)
    s.text(1370,588,'Bandit',17,700,anchor='end')
    s.rect(1097,609,89,12,GREEN,GREEN,6)
    s.rect(1280,609,88,12,LINE,LINE,6)
    s.rect(1280,609,53,12,AMBER,AMBER,6)
    s.path('M1207 651 H1260')
    s.text(1097,680,'Attack → enemy response',16,color=MUTED)
    s.text(1077,734,['Armor prevented 3 damage.','One encounter · 01:12 until return'],16,color=MUTED,lh=28)
    s.rect(1077,798,315,42,PALE)
    s.text(1234,825,'Gear + combat log',17,700,AMBER,anchor='middle')
    s.text(1077,875,'Simulation continues across tabs.',16,color=MUTED)
    s.rect(218,756,816,150)
    s.text(239,790,'CRAFT QUEUE',18,700)
    s.text(1008,790,'3 / 4 slots',16,color=MUTED,anchor='end')
    for x,title,subtitle,active in [(238,'Iron Longsword','18s / 68.2s · forging',True),(499,'Iron Stiletto','Queued · inputs reserved',False),(760,'Riveted Leather Vest','Queued · inputs reserved',False)]:
        s.rect(x,808,253,74,PALE if active else PAPER)
        s.text(x+15,836,title,18,700)
        s.text(x+15,864,subtitle,16,color=MUTED)
    s.text(24,951,'DESKTOP CONCEPT · 1440 px · v0.2',17,700,AMBER)
    s.text(24,980,'Primary action stays near the recipe. Customers and battle remain visible while you craft. Values are illustrative.',17,color=MUTED)
    s.save('ui-layout.svg')


def mobile():
    s = SVG(430, 1520, 'Ember and Iron — mobile layout', 'A single-column mobile wireframe. Resources and main tabs remain visible, the active forge takes focus, and expandable customer and battle summaries retain the parallel-world feeling.')
    s.rect(14,14,402,118,INK,INK)
    s.text(30,49,'EMBER & IRON',24,700,PALE)
    s.text(30,80,'Lv 4 · 240 gold · Rep 18 · +2 points',17,color=WHITE)
    s.text(30,110,'Iron 24    Leather 12    Fuel 18',17,color=PALE)
    s.rect(14,146,402,57)
    for x,t,active in [(29,'Forge',True),(123,'Shop',False),(214,'Quests',False),(315,'More',False)]:
        if active:
            s.rect(x-4,155,85,38,PALE,PALE,7)
        s.text(x+38,181,t,17,700 if active else 400,anchor='middle')
    s.rect(14,219,402,67)
    s.text(30,247,'RECIPE',16,700,AMBER)
    s.text(30,273,'Iron Longsword',19,700)
    s.text(392,263,'⌄',24,700,anchor='end')
    s.rect(14,302,402,405)
    s.text(30,339,'Iron Longsword',23,700)
    s.text(30,370,'Swords · iron · common',17,color=MUTED)
    s.text(30,411,'Requirements met',18,700,GREEN)
    s.text(30,442,['STR 5 · PRE 4 · Swords 15','Reinforced anvil · Quarry Road cleared'],17,color=MUTED,lh=27)
    s.path('M30 490 H397',arrow=False,color=LINE,width=1.5)
    s.text(30,522,'3 iron · 1 leather · 1 fuel',18,700)
    s.text(30,554,'68.2 seconds · Automatic quality 52 / 100',17,color=MUTED)
    s.rect(30,578,92,49,PAPER)
    s.text(76,610,'−  1  +',18,700,anchor='middle')
    s.rect(135,578,262,49,AMBER,AMBER)
    s.text(266,610,'Queue craft',19,700,WHITE,anchor='middle')
    s.text(30,665,['Swords 18 · XP 10 / 28 · Tool rack +5', 'Difficulty 8 · Inputs reserved on queue'],16,color=MUTED,lh=24)
    s.rect(14,723,402,167)
    s.text(30,758,'CRAFT QUEUE',18,700)
    s.text(397,758,'3 / 4',17,color=MUTED,anchor='end')
    s.text(30,791,'Iron Longsword · 18s / 68.2s',17,700)
    s.rect(30,809,367,10,PAPER,LINE,5)
    s.rect(30,809,97,10,AMBER,AMBER,5)
    s.text(30,856,'+2 queued       Expand queue  ⌄',17,color=MUTED)
    s.rect(14,906,402,191)
    s.text(30,943,'CUSTOMER WAITING',18,700)
    s.text(30,976,'Mara · Vanguard · budget 40 gold',17,700)
    s.text(30,1007,'Quarry Road · 2 suitable items in stock',17,color=MUTED)
    s.rect(30,1026,367,47,PALE)
    s.text(213,1057,'Open storefront',18,700,AMBER,anchor='middle')
    s.rect(14,1113,402,234)
    s.text(30,1150,'LIVE EXPEDITION',18,700)
    s.text(30,1182,'Bren · Smuggler Cache · Bandit',17,700)
    s.text(30,1214,['One encounter · 01:12 until return','Armor prevented 3 damage.'],17,color=MUTED,lh=28)
    s.rect(30,1264,367,49,PALE)
    s.text(213,1296,'Expand battle view',18,700,AMBER,anchor='middle')
    s.text(20,1385,'MOBILE CONCEPT · 430 px',17,700,AMBER)
    s.text(20,1418,['Compact navigation variant shown.', 'Queue and quest clocks keep running.', 'Expandable summaries preserve context.', 'Touch targets ≥ 44 px. Values illustrative.'],17,color=MUTED,lh=27)
    s.save('ui-mobile.svg')


if __name__ == '__main__':
    from full_scope_diagrams import item_tree, legacy_tree
    from focused_workspace_diagrams import flow, overview, desktop, mobile
    overview()
    flow()
    item_tree()
    legacy_tree()
    desktop()
    mobile()
