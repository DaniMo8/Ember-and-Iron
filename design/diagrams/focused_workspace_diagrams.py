"""v0.5 interface concepts: one goal, three places, original 16-bit scene studies."""
from build_diagrams import SVG, INK, MUTED, AMBER, PALE
from living_village_diagrams import flow

BLUE = '#236fa5'
TEAL = '#167c74'
INK_BLUE = '#293453'


def pixel_scene(s, x, y, width, kind='forge'):
    """Illustrative 640x240 close-up; runtime artwork lives in scenes.js."""
    scale = width / 640
    s.parts.append(f'<g transform="translate({x} {y}) scale({scale})">')

    def r(a, b, w, h, color, outline=False):
        stroke = f' stroke="{INK_BLUE}" stroke-width="3"' if outline else ''
        s.parts.append(f'<rect x="{a}" y="{b}" width="{w}" height="{h}" fill="{color}"{stroke}/>')

    def character(a, b, shirt='#9961be', scale=1.35, tool=False):
        s.parts.append(f'<g transform="translate({a} {b}) scale({scale})">')
        r(5, 0, 20, 18, '#f5bb7e', True)
        r(6, 0, 20, 5, '#584767'); r(3, 4, 6, 9, '#584767')
        r(16, 6, 5, 6, '#fff8de'); r(19, 8, 2, 4, INK_BLUE)
        r(11, 10, 5, 4, '#e68c70'); r(20, 15, 5, 2, '#9b4f62')
        r(3, 18, 24, 18, shirt, True); r(5, 20, 7, 12, '#d29bde')
        r(9, 24, 14, 15, '#d2a344', True)
        r(5, 37, 8, 8, '#384f83', True); r(20, 37, 8, 8, '#384f83', True)
        r(2, 44, 12, 4, '#563d54'); r(20, 44, 12, 4, '#563d54')
        r(26, 20, 9, 7, '#f5bb7e', True)
        if tool:
            r(33, 8, 4, 21, '#b58150', True); r(28, 4, 18, 8, '#b6c9d5', True)
        s.parts.append('</g>')

    r(0, 0, 640, 240, '#55bbed')
    for a, b in [(30, 25), (215, 16), (486, 24)]:
        r(a, b, 75, 18, '#fff6da'); r(a+15, b-10, 42, 12, '#fff6da')
    s.parts.append('<path d="M0 151 L90 45 L169 147 L278 61 L386 151 L479 39 L583 142 L640 89 V220 H0Z" fill="#6d94d0"/>')
    s.parts.append('<path d="M0 170 Q80 63 181 173 Q297 68 429 173 Q548 94 640 170 V220 H0Z" fill="#57ad72"/>')
    r(0, 190, 640, 50, '#b98552'); r(0, 187, 640, 12, '#4a9b48')
    r(0, 200, 640, 8, '#ebbc6d')
    for a in range(12, 640, 34): r(a, 214+(a % 3)*3, 12, 5, '#93604b')

    if kind == 'forge':
        r(48, 46, 544, 152, '#dc9c64', True)
        r(35, 33, 570, 22, '#c95658', True); r(48, 36, 544, 7, '#f48d69')
        for a in [48, 207, 395, 578]: r(a, 52, 14, 147, '#8f5e4e', True)
        r(67, 64, 510, 119, '#f1c080')
        r(77, 78, 94, 107, '#87959c', True)
        for yy in [92, 111, 130]: r(78, yy, 92, 4, '#596d82')
        r(88, 125, 70, 56, '#454661', True)
        s.parts.append('<path d="M95 176 L104 144 L116 157 L130 133 L147 176Z" fill="#ff8c3d"/><path d="M108 178 L119 159 L132 151 L138 178Z" fill="#ffe076"/>')
        r(111, 52, 30, 31, '#738796', True)
        r(221, 92, 66, 49, '#58c3dd', True); r(252, 92, 4, 49, '#775451')
        r(214, 153, 87, 15, '#b5d4da', True); r(228, 168, 46, 24, '#718ea8', True)
        r(437, 135, 111, 13, '#9d704b', True)
        r(444, 148, 9, 46, '#79534b'); r(531, 148, 9, 46, '#79534b')
        r(459, 128, 44, 5, '#c4dce3'); r(495, 122, 4, 15, '#ffe099')
        character(332, 129, tool=True)
    elif kind == 'shop':
        r(43, 49, 551, 146, '#edbb75', True)
        r(34, 34, 570, 23, '#348f97', True); r(45, 36, 548, 7, '#6bd5c2')
        for a in [64, 209]:
            r(a, 79, 115, 104, '#a77853', True)
            for yy in [113, 153]: r(a, yy, 115, 7, '#725152', True)
            for xx in [a+19, a+65]:
                r(xx, 91, 5, 20, '#c6e5ed', True); r(xx-5, 108, 15, 5, '#efcb66', True)
                r(xx+8, 133, 18, 17, '#54a1a4', True)
        r(363, 147, 127, 45, '#b87b52', True); r(356, 139, 141, 12, '#f4d18c', True)
        r(526, 88, 46, 105, '#51657e', True); r(533, 96, 32, 93, '#658b93')
        character(294, 130, '#7c7bc7'); character(460, 143, '#dd7a91', 1.0)
    else:
        s.parts.append(f'<path d="M135 186 L166 89 L258 53 L367 52 L467 92 L505 189Z" fill="#9183b1" stroke="{INK_BLUE}" stroke-width="4"/>')
        s.parts.append('<path d="M172 110 L257 71 L358 69 L433 104 L392 105 L331 87 L256 91 L220 121Z" fill="#c3afe0"/>')
        r(233, 108, 151, 87, '#474463', True)
        r(223, 95, 171, 16, '#b58154', True); r(224, 110, 13, 87, '#b58154', True); r(381, 110, 13, 87, '#b58154', True)
        for a,b in [(168, 153), (418, 144), (449, 170)]:
            s.parts.append(f'<path d="M{a} {b+17} L{a+7} {b-4} L{a+22} {b+2} L{a+27} {b+17}Z" fill="#f2b952" stroke="{INK_BLUE}" stroke-width="3"/>')
        r(63, 164, 95, 34, '#a9785d', True); r(70, 157, 80, 11, '#e5ae68', True)
        r(74, 195, 13, 12, '#374665', True); r(134, 195, 13, 12, '#374665', True)
        r(251, 189, 124, 6, '#78808b'); r(272, 197, 124, 6, '#78808b')
        character(465, 133, '#5c9fba', tool=True)
    s.parts.append('</g>')


def goal(s, x, y, w, title='Forge your first Bronze Shortsword', detail='Your materials are ready. Make one useful piece for the shop.'):
    s.rect(x, y, w, 106, '#e5f0d5', '#7f9a60')
    s.text(x+22, y+27, 'NEXT GOAL', 14, 700, TEAL)
    s.text(x+22, y+56, title, 23, 700)
    s.text(x+22, y+84, detail, 16, color=MUTED)
    s.rect(x+w-232, y+28, 210, 50, TEAL, TEAL)
    s.text(x+w-127, y+60, 'GO TO FORGE  →', 17, 700, '#ffffff', anchor='middle')


def overview():
    s=SVG(1500,1360,'Ember and Iron — one goal, three places','One Next goal guides the player through Mine, Forge and Shop. Each tab has a focused scene. Manage holds the deeper RPG systems, and the adventure theatre is optional.')
    s.text(65,53,'EMBER & IRON · v0.5',19,700,BLUE)
    s.text(65,98,'Know your next step. Enjoy the place.',34,700)
    s.text(65,135,'One focused workspace, with the full blacksmith RPG a step away.',19,color=MUTED)
    goal(s,65,170,1370)
    for x,label,kind,lines in [
        (65,'1  MINE','quarry',['Gather the materials you need.','Develop the supply you depend on.']),
        (530,'2  FORGE','forge',['Choose one available recipe.','Make it, improve it, practice it.']),
        (995,'3  SHOP','shop',['Fill the shelves; see the outcome.','Customers handle their own lives.'])]:
        s.text(x,321,label,21,700,TEAL)
        pixel_scene(s,x,343,440,kind)
        s.text(x,545,lines,18,color=MUTED,lh=29)
    s.rect(65,622,1370,178,PALE)
    s.text(88,659,'MANAGE · OPEN WHEN YOU NEED IT',18,700,AMBER)
    s.text(88,701,'Upgrades     Smith     Journal     Legacy',27,700)
    s.text(88,744,'Stations, staff, stats, mastery, collection, customer history and permanent talents remain available.',18,color=MUTED)
    s.text(88,774,'Their depth stays intact without becoming a row of competing tasks on the workbench.',18,color=MUTED)
    s.rect(65,833,1370,176,'#e2eef5','#9dbace')
    s.text(88,872,'ADVENTURE THEATRE · OPTIONAL',18,700,BLUE)
    s.text(88,912,['Open a watch-only panel when you want to follow a customer.',
                   'Their gear drives the actual battle. NPCs buy, form parties, travel, recover and retry themselves.',
                   'Close the theatre at any time; the world keeps moving while you mine, forge or arrange the shop.'],18,color=MUTED,lh=29)
    s.rect(65,1042,1370,192)
    s.text(88,1080,'ART THAT MAKES THE WORK READABLE',18,700,TEAL)
    s.text(88,1120,['Original 16-bit landscapes, large expressive characters, strong outlines and bright shading.',
                    'Forge, Shop and Mine have distinct close-ups at a native 640 × 240 aspect.',
                    'Activity follows real crafts, displayed stock and customer events. No invented purchases or rewards.',
                    'Labeled controls and reduced motion keep the same information accessible.'],18,color=MUTED,lh=29)
    s.text(65,1307,'Sixty recipes · twelve proficiencies · six regions · twenty-four Legacy talents · unchanged gameplay rules',17,color=MUTED)
    s.save('living-village.svg')


def desktop():
    s=SVG(1500,1420,'Ember and Iron — focused desktop workspace','A compact header and a persistent Next goal lead into Mine, Forge and Shop. One focused scene and selected recipe dominate. Manage and the adventure theatre expand only when chosen.')
    s.text(55,49,'EMBER & IRON · DESKTOP CONCEPT · v0.5',19,700,BLUE)
    s.text(55,92,'A clear job in front of you',33,700)
    s.rect(55,120,1390,58)
    s.text(77,157,'EMBER & IRON',21,700)
    s.text(1420,157,'18 gold     Lv. 1     Settings',18,anchor='end',color=MUTED)
    goal(s,55,196,1390)
    s.rect(55,323,1390,61,PALE)
    s.text(82,361,'MINE       FORGE       SHOP',21,700)
    s.rect(177,374,81,4,TEAL,TEAL,r=0)
    s.text(1420,361,'Manage  ☰',18,700,anchor='end')
    pixel_scene(s,55,405,1024,'forge')
    s.rect(1103,405,342,119,'#e2eef5','#9dbace')
    s.text(1124,440,'ADVENTURE THEATRE',17,700,BLUE)
    s.text(1124,472,'Customers are out exploring.',16,color=MUTED)
    s.text(1124,502,'Open to watch  →',17,700)
    s.text(1124,573,['Collapsed by default.',
                      'Opens beside your work.',
                      'Watch only; no party chores.'],16,color=MUTED,lh=27)
    s.rect(55,812,1024,256)
    s.text(79,847,'AT THE FORGE',15,700,TEAL)
    s.text(79,884,'Bronze Shortsword',29,700)
    s.text(1054,880,'Change recipe  ▾',17,700,anchor='end')
    s.text(79,919,'Quality 34     35 seconds     8 gold shelf price',18,color=MUTED)
    s.text(79,958,'Needs: 2 bronze / 6 held    1 leather / 4 held    1 fuel / 6 held',18)
    s.rect(79,981,322,62,TEAL,TEAL)
    s.text(240,1020,'CRAFT ONE',20,700,'#ffffff',anchor='middle')
    s.text(432,1020,'Sword practice grows with each piece.',17,color=MUTED)
    s.rect(55,1091,1024,112,PALE)
    s.text(79,1128,'ACTIVE JOB',15,700,AMBER)
    s.text(79,1164,'Progress, optional tempering, and waiting work appear here.',19)
    s.rect(1103,833,342,227)
    s.text(1125,869,'WHEN MANAGE IS OPEN',16,700,TEAL)
    s.text(1125,907,['Upgrades', 'Smith', 'Journal', 'Legacy'],19,color=MUTED,lh=34)
    s.rect(55,1234,1390,105)
    s.text(79,1272,'SAME FRAME, THREE FOCUSED PLACES',17,700,BLUE)
    s.text(79,1308,'Mine: deposit and gathering.   Forge: selected craft.   Shop: display stock and one recent purchase.',18,color=MUTED)
    s.text(55,1388,'Layout concept. The theatre and Manage illustration describe optional states, not extra permanent cards.',16,color=MUTED)
    s.save('ui-layout.svg')


def mobile():
    s=SVG(430,1260,'Ember and Iron — focused mobile workspace','A small header, one Next goal, three tabs, a large readable scene and one clear craft action. Manage is a drawer and the adventure theatre begins as one collapsed row.')
    s.text(20,42,'MOBILE CONCEPT · v0.5',18,700,BLUE)
    s.rect(15,65,400,56)
    s.text(30,100,'E&I',21,700);s.text(396,100,'18g   Lv.1   Settings',16,anchor='end')
    s.rect(15,139,400,119,'#e5f0d5','#7f9a60')
    s.text(33,168,'NEXT GOAL',14,700,TEAL)
    s.text(33,198,'Forge your first sword',22,700)
    s.text(33,228,'Your materials are ready. Make one.',16,color=MUTED)
    s.rect(342,158,54,45,TEAL,TEAL)
    s.text(369,189,'→',25,700,'#ffffff',anchor='middle')
    s.rect(15,276,400,58,PALE)
    s.text(32,312,'MINE    FORGE    SHOP',18,700)
    s.text(396,312,'Manage',15,700,anchor='end')
    pixel_scene(s,15,352,400,'forge')
    s.rect(15,522,400,271)
    s.text(34,555,'AT THE FORGE',14,700,TEAL)
    s.text(34,590,'Bronze Shortsword',25,700)
    s.text(34,620,'Change recipe  ▾',16,700,BLUE)
    s.text(34,654,'Q34    35s    8g shelf price',17,color=MUTED)
    s.text(34,688,'2 bronze · 1 leather · 1 fuel',17)
    s.rect(34,715,362,57,TEAL,TEAL)
    s.text(215,751,'CRAFT ONE',19,700,'#ffffff',anchor='middle')
    s.rect(15,815,400,111,PALE)
    s.text(34,852,'Active job · 21s remaining',19,700)
    s.rect(34,870,360,12,'#dfd4b7','#dfd4b7',r=4)
    s.rect(34,870,160,12,'#b27c31','#b27c31',r=4)
    s.text(34,909,'Optional tempering   ·   Queue details',15,color=MUTED)
    s.rect(15,948,400,63,'#e2eef5','#9dbace')
    s.text(34,987,'Adventure theatre     Open  ▾',18,700,BLUE)
    s.rect(15,1033,400,110)
    s.text(34,1067,'Manage opens a drawer',19,700)
    s.text(34,1098,['Upgrades · Smith · Journal · Legacy',
                    'Return to the same recipe and place.'],16,color=MUTED,lh=25)
    s.text(20,1184,['Large controls, one useful action at a time.',
                    'The goal remains above the work.',
                    'No permanent material strip or news cards.'],16,color=MUTED,lh=25)
    s.save('ui-mobile.svg')


if __name__ == '__main__':
    overview(); flow(); desktop(); mobile()
