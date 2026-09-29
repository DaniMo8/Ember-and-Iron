"""Living-village v0.4 diagrams; semantic illustrations, not runtime scene assets."""
from build_diagrams import SVG, OUT, WHITE, INK, MUTED, AMBER, PALE
from html import escape

def village(s, x, y, width):
    k = width / 480
    s.parts.append(f'<g transform="translate({x} {y}) scale({k})">')
    def r(a,b,w,h,c): s.rect(a,b,w,h,c,c,r=0)
    r(0,0,480,180,'#dceccc'); r(0,108,480,72,'#9db987')
    r(0,145,480,29,'#d4b68d')
    for a,b in [(12,16),(112,23),(265,13),(409,27)]:
        r(a,b,32,8,'#f9fbec');r(a+7,b-5,18,7,'#f9fbec')
    r(9,54,147,86,'#e3bc8e'); r(5,47,154,12,'#ae6556')
    r(9,61,7,79,'#866151');r(148,61,8,79,'#866151')
    r(17,69,132,62,'#edd5aa');r(24,91,37,42,'#6c746d')
    r(30,102,25,27,'#6b4840');r(35,109,15,18,'#f6ac61');r(40,115,8,13,'#ffe1a1')
    r(95,105,33,8,'#5b6670');r(103,113,17,13,'#5b6670');r(96,126,31,6,'#7b6054')
    r(168,54,160,86,'#e4c795');r(164,47,168,12,'#56847d')
    r(175,60,146,13,'#fbecb5')
    for a in range(177,315,18):r(a,60,9,13,'#cd7c72')
    r(175,79,44,50,'#987254');r(228,79,43,50,'#987254')
    for yy in [94,115]:
        r(175,yy,44,4,'#704f43');r(228,yy,43,4,'#704f43')
    for a in [182,198,235,251]:
        r(a,84,3,21,'#bad0d2');r(a-3,104,9,3,'#d8ad66')
    r(280,97,32,35,'#b88e64');r(285,96,22,6,'#edcf83')
    r(346,66,124,77,'#769088');r(355,77,106,62,'#8fa49a')
    for a,b in [(357,82),(389,96),(424,80),(370,118),(438,112)]:
        r(a,b,23,16,'#b5c1ae');r(a+2,b+2,16,5,'#d3d9be')
    r(361,134,43,8,'#8e6650');r(365,141,9,6,'#5d5650');r(393,141,9,6,'#5d5650')
    r(370,126,29,10,'#c49167');r(374,122,15,6,'#e0ae78')
    for a,c in [(187,'#b77a8d'),(237,'#627f9b'),(302,'#8e7ab1')]:
        r(a,143,10,10,'#e9bf95');r(a-2,153,14,13,c)
        r(a,166,5,6,'#775d53');r(a+8,166,5,6,'#775d53')
        r(a+1,142,10,3,'#795d51');r(a+7,148,2,2,'#433d3a')
    for a,t in [(26,'FORGE'),(211,'SHOP'),(385,'QUARRY')]:
        s.text(a,43,t,9,700,'#48584b')
    s.parts.append('</g>')

def overview():
    s=SVG(1500,1110,'Ember and Iron — a living village','Player agency is mining, crafting, shelving and investment. Autonomous adventurers walk between the store and quests. The graphic scene presents actual simulation state.')
    s.text(70,55,'EMBER & IRON · v0.4',20,700,AMBER)
    s.text(70,101,'Your work gives the village its adventures',34,700)
    s.text(70,137,'A cute retro world above a deep RPG economy. The smith runs the business; customers run their lives.',18,color=MUTED)
    village(s,70,175,1360)
    for x,title,lines in [
        (70,'YOU: mine and make',['Choose a deposit and a recipe.','Practice one class or diversify.']),
        (535,'YOU: fill the shelves',['Display useful, affordable gear.','Protect a keepsake; restock gaps.']),
        (1000,'NPCs: browse and venture',['Buy, equip, form parties and quest.','Return with stories, gifts or injuries.'])]:
        s.node(x,730,430,125,title,lines,x==535)
    s.rect(70,893,1360,140,PALE)
    s.text(94,929,'THE SCENE IS A WINDOW INTO REAL STATE',19,700,AMBER)
    s.text(94,963,['Fire and hammering follow active work. Listed items occupy shelf spaces. Workers move real quarry output.',
                    'Walkers follow saved browsing, purchase and departure events. The battle window shows the actual result.',
                    'Accessible controls sit beside the art; reduced motion keeps every action and outcome understandable.'],18,color=MUTED,lh=27)
    s.text(70,1071,'Illustrative scene geometry: native 480 × 180; forge left, shop center, quarry right; customer road below.',16,color=MUTED)
    s.save('living-village.svg')

def flow():
    s=SVG(1500,1500,'Ember and Iron — autonomous shop flow','The smith produces and displays equipment. Customers automatically buy, equip, select quests, form parties, recover and return. All loops continue offline under the shared cap.')
    s.text(70,56,'EMBER & IRON · v0.5',20,700,AMBER)
    s.text(70,101,'Run the forge. Let the world come to you.',34,700)
    s.text(70,139,'One Next goal guides Mine, Forge and Shop. The adventurer loop continues automatically.',18,color=MUTED)
    xs=[70,535,1000]
    for x,title,lines in [
        (xs[0],'Mine and improve the quarry',['Deposits, workers and tools','Choose the material supply']),
        (xs[1],'Craft and practice',['Only currently usable recipes','Quality, stats and proficiency']),
        (xs[2],'Stock the shelves',['Finished work fills free positions','List, withdraw or protect stock'])]:
        s.node(x,195,430,120,title,lines,True)
    s.path('M500 255 H535');s.path('M965 255 H1000')
    s.text(70,369,'AUTONOMOUS CUSTOMERS',19,700,AMBER)
    nodes=[
        (70,400,'Walk in and browse',['Stock attracts compatible archetypes','Compare useful items and budgets']),
        (535,400,'Buy, equip and commission',['Displayed, unprotected stock only','One real checkout per transaction']),
        (1000,400,'Prepare an expedition',['Choose a quest; gather guild allies','No manual sale or dispatch required']),
        (1000,605,'Travel and battle',['Seeded combat, gear and boss phases','Watch while the forge keeps working']),
        (535,605,'Win or retreat',['Win: gifts, reputation and discoveries','Retreat: recover and remember needs']),
        (70,605,'Return to the village',['Seek better gear or a safer route','New demand reaches the shelves'])]
    for x,y,title,lines in nodes:s.node(x,y,430,130,title,lines)
    for path in ['M500 465 H535','M965 465 H1000','M1215 530 V605','M1000 670 H965','M535 670 H500','M285 605 V530']:
        s.path(path)
    s.path('M1215 315 V350 H285 V400')
    s.path('M70 670 H35 V345 H750 V315',dashed=True)
    s.text(270,793,'Improved demand, recipe discoveries and material returns guide the next craft.',18,700,AMBER)
    s.rect(70,835,1360,165,PALE)
    s.text(94,873,'PRODUCTION POLICIES ARE SEPARATE',19,700,AMBER)
    s.text(94,909,['Customers shop and adventure from the beginning, online and offline.',
                    'The production assistant only repeats crafts and buys permitted materials within limits.',
                    'Private, protected and reserved items stay off sale; a displayed rare item is genuinely for sale.'],18,color=MUTED,lh=28)
    s.rect(70,1040,1360,170)
    s.text(94,1078,'OPTIONAL LEGACY',19,700,AMBER)
    s.text(94,1114,['At level 8 and six wins, choose to retire into a new generation.',
                    'Keep family records, decor, permanent talents and one heirloom with its recipe exemption.',
                    'Spend Sparks across Force, Artifice, Commerce and Lore. Continue the current shop if preferred.'],18,color=MUTED,lh=28)
    s.rect(70,1250,1360,160)
    s.text(94,1288,'THE WORLD KEEPS ITS PROMISES',19,700,AMBER)
    s.text(94,1324,['Scene animation follows actual events; it does not invent stock, purchases or victories.',
                    'Offline catch-up uses the same customer decisions and combat model, capped at eight hours.',
                    'Capacity pauses safely. Rewards apply once. The return recap groups activity without claim chores.'],18,color=MUTED,lh=28)
    s.text(70,1460,'Sixty recipes · twelve proficiencies · six archetypes · six regions · twenty-four Legacy talents',17,color=MUTED)
    s.save('game-flow.svg')

def desktop():
    s=SVG(1500,1220,'Ember and Iron — living-village desktop layout','A large scene presents the forge, shop and quarry. Unlocked crafting and shelf actions remain direct, and a passive battle window requires no party management.')
    s.text(55,50,'EMBER & IRON · DESKTOP CONCEPT',19,700,AMBER)
    s.text(55,95,'The place is the interface',33,700)
    s.rect(55,132,1390,66,PALE)
    s.text(76,174,'Gold 18    Bronze 6    Wood 4    Leather 4    Fuel 6',19,700)
    s.text(1419,174,'Smith level 1 · Attributes · Settings',17,anchor='end',color=MUTED)
    village(s,55,224,970)
    s.rect(1050,224,395,364)
    s.text(1074,261,'PASSIVE ADVENTURE WINDOW',17,700,AMBER)
    s.text(1074,302,'Mara visits the old cellars',22,700)
    s.rect(1074,327,345,123,'#e1e8d2')
    s.text(1246,383,'Hero  →  enemy',22,700,anchor='middle')
    s.text(1246,419,'Actual combat events',17,anchor='middle',color=MUTED)
    s.text(1074,485,['Health · enemy phase · gear effects','Cycles between active expeditions','Inspect a report; no dispatch steps'],17,color=MUTED,lh=31)
    s.rect(55,616,1390,60,PALE)
    s.text(78,654,'FORGE       SHOP       QUARRY',19,700)
    s.text(1419,654,'Improvements · Collection · Legacy',17,anchor='end',color=MUTED)
    s.node(55,704,650,146,'Unlocked craft choices',['Compact item cards: cost, quality, time, proficiency','Missing materials remain visible; future locked recipes do not','Queue one or a batch; optional technique adds quality'],True)
    s.node(730,704,715,146,'Shelves and customer activity',['Actual listed stock and empty shelf positions','Fill empty shelves · withdraw · protect a keepsake','Small notes show purchases, needs and returning gifts'])
    s.node(55,879,650,140,'Production queue',['Active lanes and waiting work','Straightforward pause reasons and material shortages'])
    s.node(730,879,715,140,'Quarry or shop controls',['Worker and upgrade choices belong to their place','Deeper RPG books remain available without dominating the scene'])
    s.rect(55,1050,1390,95)
    s.text(78,1085,'QUIET FEEDBACK',17,700,AMBER)
    s.text(78,1117,'“Mara bought your Fine sword +8g”    “Bren is recovering”    “A new recipe is ready to craft”',18,color=MUTED)
    s.text(55,1192,'Illustrative arrangement. Graphics and keyboard-accessible controls present the same saved state.',16,color=MUTED)
    s.save('ui-layout.svg')

def mobile():
    s=SVG(430,1450,'Ember and Iron — living-village mobile layout','A responsive scene, compact place tabs, available crafting actions and collapsible passive battle summary. No tiny character click targets are required.')
    s.text(20,43,'EMBER & IRON',20,700,AMBER)
    s.text(20,77,'A village in your pocket',25,700)
    s.rect(15,106,400,59,PALE);s.text(31,143,'18g   Bronze 6   Fuel 6   Lv 1',17,700)
    village(s,15,185,400)
    s.rect(15,359,400,62,PALE);s.text(34,398,'FORGE       SHOP       QUARRY',17,700)
    s.node(15,442,400,137,'Currently usable recipes',['Bronze Shortsword · Q34 · 35s','2 bronze · 1 leather · 1 fuel','Queue craft   /   Select a class'],True)
    s.node(15,600,400,123,'Your production',['1 active lane · 3 waiting places','Technique is optional; no timing test'])
    s.node(15,744,400,147,'On the shelves',['Stocked gear attracts customers','Fill empty shelves in one action','Protect or withdraw a keepsake'])
    s.rect(15,913,400,162)
    s.text(35,951,'ADVENTURERS · LIVE',18,700,AMBER)
    s.text(35,988,['Mara is exploring Rat Nest','Small health bars and recent item effect','Expand to watch; no management task'],17,color=MUTED,lh=29)
    s.node(15,1096,400,119,'Village news',['Bren bought a shield. +7 gold','A returning party left quarry supplies.'])
    s.rect(15,1237,400,69,PALE);s.text(32,1279,'Upgrades   Collection   Legacy   Settings',16,700)
    s.text(20,1356,['Keep touch actions large and labeled.','A collapsed watcher retains live status.','Reduced motion keeps the scene readable.'],16,color=MUTED,lh=25)
    s.save('ui-mobile.svg')

if __name__ == '__main__':
    overview(); flow(); desktop(); mobile()
