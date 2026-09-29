from pathlib import Path
import re
import html

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'game-specification.md').read_text(encoding='utf-8')
version_match = re.search(r'Version ([0-9.]+)', source)
version = version_match.group(1) if version_match else '0.2'
headings = []

def inline(text):
    text = html.escape(text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    return text

def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

lines = source.splitlines()
output = []
i = 0
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
        continue
    heading = re.match(r'^(#{1,3}) (.*)', line)
    if heading:
        level = len(heading[1]); text = heading[2]; ident = slug(text)
        if level == 2:
            headings.append((ident, text))
        output.append(f'<h{level} id="{ident}">{inline(text)}</h{level}>')
        i += 1; continue
    picture = re.match(r'^!\[(.*?)\]\((.*?)\)$', line)
    if picture:
        alt, path = picture.groups()
        svg = (ROOT / path).read_text(encoding='utf-8')
        svg = re.sub(r'<\?xml.*?\?>', '', svg)
        prefix = Path(path).stem + '-'
        svg = re.sub(r'\bid="([^"]+)"', lambda m: 'id="'+prefix+m.group(1)+'"', svg)
        svg = re.sub(r'url\(#([^)]+)\)', lambda m: 'url(#'+prefix+m.group(1)+')', svg)
        svg = re.sub(r'aria-labelledby="([^"]+)"', lambda m: 'aria-labelledby="'+' '.join(prefix+x for x in m.group(1).split())+'"', svg)
        svg = re.sub(r'<svg\b', '<svg role="img" aria-label="'+html.escape(alt, quote=True)+'"', svg, count=1)
        cls = 'mobile-diagram' if 'mobile' in path else ''
        output.append(f'<figure class="{cls}">{svg}<figcaption>{html.escape(alt)} · <a href="{path}">Open full size diagram</a></figcaption></figure>')
        i += 1; continue
    if line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            cells = [x.strip() for x in lines[i].strip('|').split('|')]
            if not all(re.match(r'^:?-+:?$', x) for x in cells): rows.append(cells)
            i += 1
        table = '<div class="table-scroll"><table><thead><tr>'
        table += ''.join(f'<th scope="col">{inline(c)}</th>' for c in rows[0]) + '</tr></thead><tbody>'
        for row in rows[1:]: table += '<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>'
        output.append(table+'</tbody></table></div>'); continue
    if re.match(r'^(- |\d+\. )', line):
        ordered = bool(re.match(r'^\d+\.', line)); tag = 'ol' if ordered else 'ul'
        parts = []
        while i < len(lines) and re.match(r'^(- |\d+\. )', lines[i]):
            parts.append('<li>'+inline(re.sub(r'^(- |\d+\. )', '', lines[i]))+'</li>')
            i += 1
        output.append('<'+tag+'>'+''.join(parts)+'</'+tag+'>'); continue
    para = [line]; i += 1
    while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||!\[|- |\d+\. )', lines[i]):
        para.append(lines[i]); i += 1
    output.append('<p>'+inline(' '.join(para))+'</p>')

nav = ''.join(f'<a href="#{ident}">{html.escape(text)}</a>' for ident,text in headings)
css = '''
:root{color-scheme:light;--ink:#222520;--muted:#595e55;--paper:#fff;--line:#d9ddd4;--accent:#8a501c}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:#f3f2ed;color:var(--ink);font:16px/1.65 'Segoe UI',Arial,sans-serif}
a{color:#714115;text-underline-offset:3px}a:focus-visible,button:focus-visible{outline:3px solid #b2752d;outline-offset:4px}
.shell{display:grid;grid-template-columns:265px minmax(0,1fr);max-width:1580px;margin:auto;align-items:start}.contents{padding:35px 25px;position:sticky;top:0;height:100vh;overflow:auto;background:#eeeee7;border-right:1px solid var(--line)}
.brand{font-family:Georgia,serif;font-size:25px;color:#292b23;margin-bottom:4px}.edition{color:var(--muted);font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:23px}.contents nav a{display:block;padding:7px 0;font-size:13px;line-height:1.35;text-decoration:none;color:#3d4339}.contents nav a:hover{color:#914d16;text-decoration:underline}.contents .source{display:block;margin-top:22px;font-size:13px}
main{max-width:1170px;padding:48px 68px 90px;background:white;min-width:0}h1,h2,h3{color:#000;line-height:1.2}h1{font:42px/1.12 Georgia,serif;max-width:760px;margin:0 0 20px}h2{font:29px/1.22 Georgia,serif;margin:58px 0 22px;scroll-margin-top:24px}h3{font-size:19px;font-weight:600;margin:30px 0 13px}p{margin:0 0 17px}main>p:first-of-type{color:var(--muted);font-size:13px;margin-bottom:40px}strong{font-weight:650}li{padding-left:3px;margin:7px 0}ul,ol{padding-left:24px;margin:14px 0 24px}
code{font:13px/1.55 Consolas,monospace;background:#f3f3ef;padding:2px 4px;overflow-wrap:anywhere}p:has(>code:only-child){padding:13px 0;margin:5px 0 14px}p>code:only-child{background:transparent;padding:0}
.table-scroll{overflow:auto;margin:23px 0 27px}table{border-collapse:collapse;width:100%;font-size:13px;line-height:1.5}th{background:#e6eae1;color:#222820;font-weight:600;text-align:left}th,td{border:1px solid #d9d9d9;padding:11px 12px;vertical-align:middle}tr:nth-child(even) td{background:#f8f9f6}th:first-child{min-width:115px}td{overflow-wrap:break-word}
figure{margin:30px 0 35px}figure svg{display:block;width:100%;height:auto;border:0}figcaption{font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5}.mobile-diagram{max-width:410px;margin-left:auto;margin-right:auto}.print-action{font:inherit;font-size:13px;border:1px solid #a9ad9f;background:white;color:#343a2f;padding:9px 12px;cursor:pointer;margin-top:18px}.doc-end{margin-top:50px;color:var(--muted);font-size:13px}
@media(max-width:1100px){main{padding:36px 32px 70px}.shell{grid-template-columns:230px minmax(0,1fr)}.contents{padding:28px 18px}}
@media(max-width:760px){.shell{display:block}.contents{position:relative;height:auto;padding:22px 20px}.contents nav{columns:2;column-gap:22px}.contents nav a{break-inside:avoid}.contents .source{display:inline-block;margin-right:20px}main{padding:30px 20px 60px}h1{font-size:34px}h2{font-size:26px;margin-top:42px}th,td{padding:8px;min-width:110px}.table-scroll{font-size:12px}figure{margin-left:-10px;margin-right:-10px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{@page{size:A4;margin:18mm}body{background:white;font-size:10pt;line-height:1.5}.shell{display:block}.contents{display:none}main{padding:0;max-width:none}h1{font-size:29pt}h2{font-size:19pt;margin-top:27pt;break-after:avoid}h3{font-size:13pt;break-after:avoid}p,li{orphans:3;widows:3}table{font-size:8pt}th,td{padding:6pt}thead{display:table-header-group}tr,figure{break-inside:avoid}figure svg{max-height:235mm;object-fit:contain}.table-scroll{overflow:visible}code{font-size:8pt}a{color:inherit;text-decoration:none}figcaption a{display:none}.mobile-diagram{max-width:62mm}.doc-end{display:none}}
'''
document = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ember and Iron — Game specification</title><style>'+css+'</style></head><body><div class="shell"><aside class="contents"><div class="brand">Ember and Iron</div><div class="edition">Game design · Version '+version+'</div><nav aria-label="Document contents">'+nav+'</nav><a class="source" href="../index.html">Play Ember and Iron</a><a class="source" href="game-specification.md">Editable Markdown source</a><button class="print-action" type="button" onclick="window.print()">Print specification</button></aside><main>'+''.join(output)+'<p class="doc-end">End of specification · Companion SVG diagrams and editable Mermaid sources are in the diagrams folder.</p></main></div></body></html>'
(ROOT / 'game-specification.html').write_text(document, encoding='utf-8')
print(f'Wrote specification with {len(headings)} sections, {len(source.split())} words and {len(document):,} HTML characters')
