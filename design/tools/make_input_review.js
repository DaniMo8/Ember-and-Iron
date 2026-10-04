/* A local-only DOM regression: hold a control across the real 750ms refresh. */
"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "house-app.js"), "utf8");
const runner = `
if(location.hostname==='127.0.0.1'&&location.port==='8792'){
 const tray=document.createElement('aside');
 tray.style.cssText='position:fixed;right:16px;top:12px;z-index:10000;background:#102126;padding:12px;border:1px solid gold;max-width:420px';
 tray.innerHTML='<button id="input-run">Run held-input checks</button><pre id="input-results" style="white-space:pre-wrap">Synthetic input sequences, actual game refreshes. No real player save.</pre>';
 document.body.append(tray);
 document.querySelector('#input-run').onclick=async()=>{
  const results=document.querySelector('#input-results');
  const output=[]; results.textContent='Running…';
  document.querySelector('[data-action="continue"]')?.click();
  if(!document.querySelector('.house-nav')){results.textContent='Load the Middle career fixture on port8792 first.';return;}
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  for(const kind of ['mouse','touch','keyboard']){
   document.querySelector('[data-action="room"][data-room="smith"]').click();
   const button=document.querySelector('[data-action="room"][data-room="mine"]');
   if(kind==='keyboard'){button.focus();button.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));}
   else button.dispatchEvent(new PointerEvent('pointerdown',{pointerId:42,pointerType:kind,button:0,bubbles:true}));
   await pause(1100);
   const retained=button.isConnected;
   if(kind==='keyboard')document.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));
   else document.dispatchEvent(new PointerEvent('pointerup',{pointerId:42,pointerType:kind,button:0,bubbles:true}));
   await pause(300);
   button.click();
   output.push({kind,retained,activated:document.querySelector('h1')?.textContent==='The workings',visible:!document.hidden});
   results.textContent=JSON.stringify(output,null,2);
  }
  const idle=document.querySelector('[data-action="room"][data-room="mine"]');
  await pause(1100);
  output.push({idleRefreshResumed:!idle.isConnected});
  results.textContent=JSON.stringify(output,null,2);
 };
}`;
for (const baseline of [false, true]) {
  let page = html.replace("<head>", '<head><base href="/">');
  if (baseline)
    page = page.replace(
      /<script src="house-app\.js[^>]*><\/script>/,
      "<script>" +
        app
          .replace(" || inputActivity.busy()", "")
          .replace(/<\/script/gi, "<\\/script") +
        "</script>",
    );
  page = page.replace("</body>", "<script>" + runner + "</script></body>");
  fs.writeFileSync(
    path.join(
      root,
      "design/qa/input-" + (baseline ? "before" : "after") + ".html",
    ),
    page,
  );
}
console.log(
  "Input fixtures generated for localhost port8792. Load Middle career, then input-before.html or input-after.html.",
);
