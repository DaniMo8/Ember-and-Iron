import * as T from "three";
import { AtelierScene } from "./scene.js";
import { MATERIALS } from "./core.js";
import { planRoute, sampleRoute, FLOOR_OBSTACLES } from "./navigation.js";

const clamp = T.MathUtils.clamp;
const enchantColors = {
  flame: 0xf09b41,
  ember_ward: 0xdf762e,
  frost_ward: 0x93d1de,
  vitality: 0x8abb7a,
  starlight: 0x9fb2ed,
  accuracy: 0xd5c595,
  bulwark: 0xb9b193,
  haste: 0x80c2b4,
  resonance: 0xbf8ecd,
  hollow_hearth: 0xee6e47,
  falling_stars: 0xbdb2ff,
};
const eachMaterial = (o, fn) => {
  if (o.material)
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(fn);
};

/** Rendering is a read-only projection of the campaign. It never ticks or awards game state. */
export class CampaignScene extends AtelierScene {
  async asset(name) {
    if (!this.models[name])
      this.models[name] = (async () => {
        const supplement =
          name === "catalogue" ||
          name.startsWith("room-") ||
          name.startsWith("evolution-");
        const embedded = globalThis.EIHouseModels?.[name];
        let loaded;
        if (embedded?.encoding === "deflate") {
          const bytes = Uint8Array.from(atob(embedded.data), (c) =>
            c.charCodeAt(0),
          );
          const stream = new Blob([bytes])
            .stream()
            .pipeThrough(new DecompressionStream("deflate"));
          loaded = await this.loader.parseAsync(
            await new Response(stream).arrayBuffer(),
            "",
          );
        } else
          loaded = await this.loader.loadAsync(
            `assets/${supplement ? "house3d" : "atelier"}/${name}.glb?v=4.0`,
          );
        const { scene } = loaded;
        if (name === "room-mine") this.weatherRock(scene);
        scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        return scene;
      })();
    return this.models[name];
  }
  weatherRock(model) {
    // Shared mineral grain and restrained fracture displacement break up the authored boulders.
    const size = 128,
      pixels = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const x = i % size,
        y = Math.floor(i / size),
        noise = ((Math.imul(i + 47, 1664525) >>> 8) % 97) / 97;
      const shade = Math.round(
        110 + noise * 60 + Math.sin(x * 0.31 + y * 0.17) * 14,
      );
      pixels.set([shade, shade, shade, 255], i * 4);
    }
    const texture = new T.DataTexture(pixels, size, size);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
    this.mineralTexture = texture;
    model.updateMatrixWorld(true);
    model.traverse((o) => {
      if (!o.isMesh) return;
      let rock = false;
      eachMaterial(o, (m) => {
        if (m.name.startsWith("Charcoal slate")) {
          rock = true;
          m.color.setHex(0x62716d);
          m.map = texture;
          m.bumpMap = texture;
          m.bumpScale = 0.055;
          m.roughness = 0.98;
        }
      });
      if (!rock) return;
      const geometry = o.geometry,
        position = geometry.attributes.position,
        normal = geometry.attributes.normal,
        world = new T.Vector3();
      for (let i = 0; i < position.count; i++) {
        world.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld);
        if (world.y < 0.2) continue;
        const d =
          0.034 *
          Math.sin(world.x * 19 + world.y * 13) *
          Math.cos(world.z * 17 - world.y * 11);
        position.setXYZ(
          i,
          position.getX(i) + normal.getX(i) * d,
          position.getY(i) + normal.getY(i) * d,
          position.getZ(i) + normal.getZ(i) * d,
        );
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }
  async init() {
    const [character, hammer, catalogue] = await Promise.all(
      ["character", "hammer", "catalogue"].map((n) => this.asset(n)),
    );
    this.characterSource = character;
    this.catalogue = catalogue;
    this.people.smith = this.person("smith", 0x756750, true);
    this.hammer = hammer.clone(true);
    this.hammer.scale.setScalar(0.88);
    this.people.smith.joints.Grip_R.add(this.hammer);
    this.people.smith.root.position.set(0.35, 0, 1.18);
    this.evolution = {};
    this.visibleActors = new Set();
    this.props = [];
    this.projectiles = new T.Group();
    this.scene.add(this.projectiles);
    const geometry = new T.CylinderGeometry(0.012, 0.012, 0.55, 6);
    this.bolts = Array.from({ length: 6 }, () => {
      const bolt = new T.Mesh(
        geometry,
        new T.MeshBasicMaterial({ color: 0xc7ba8b }),
      );
      this.projectiles.add(bolt);
      bolt.visible = false;
      return bolt;
    });
    this.ready = true;
    this.setQuality(this.quality);
    await this.setRoom(this.room);
    return this;
  }
  async setRoom(room) {
    this.room = room;
    if (!this.ready) return;
    const serial = (this.roomSerial = (this.roomSerial || 0) + 1);
    if (!this.rooms[room]) {
      const model = await this.asset(
        ["forge", "shop", "arena"].includes(room)
          ? room === "shop"
            ? "showroom"
            : room
          : "room-" + room,
      );
      if (serial !== this.roomSerial) return;
      this.rooms[room] = model;
      this.scene.add(model);
      this.atmosphere.register(room, model);
    }
    if (["forge", "shop", "arena"].includes(room) && !this.evolution[room]) {
      const model = await this.asset("evolution-" + room);
      if (serial !== this.roomSerial) return;
      this.evolution[room] = model;
      this.scene.add(model);
    }
    for (const [id, model] of Object.entries(this.rooms))
      model.visible = id === room;
    for (const [id, model] of Object.entries(this.evolution))
      model.visible = id === room;
    this.fire.visible = this.fireLight.visible = ["forge", "smelter"].includes(
      room,
    );
    this.sparks.visible = false;
    this.shelfGroup.visible = room === "shop";
    for (const p of Object.values(this.people)) p.root.visible = false;
    if (this.workpiece) this.workpiece.visible = room === "forge";
    this.home();
    this.resize();
    this.viewKey = null;
    if (this.view) this.sync(this.view);
  }
  home() {
    this.controls.target.set(0, this.room === "arena" ? 0.48 : 1.1, 0);
    this.camera.position.set(
      ...(this.room === "arena" ? [2, 8.5, 11] : [7.8, 7.4, 10.5]),
    );
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  resize() {
    const box = this.canvas.parentElement.getBoundingClientRect(),
      w = Math.max(1, box.width),
      h = Math.max(1, box.height),
      aspect = w / h;
    this.renderer.setSize(w, h, false);
    const span = Math.max(this.room === "arena" ? 6.8 : 7.1, 8.6 / aspect);
    this.camera.left = (-span * aspect) / 2;
    this.camera.right = (span * aspect) / 2;
    this.camera.top = span / 2;
    this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix();
    this.previewDirty = true;
  }
  appearance(item = {}) {
    const recipe = this.data?.recipes[item.recipeId] || item;
    return {
      family: recipe.classId || "daggers",
      variant: recipe.variant || 0,
      material: (recipe.materialId || "bronze_ingot").replace("_ingot", ""),
      quality: clamp(item.quality ?? 40, 0, 200),
      prefix: item.affixId || item.treatment || null,
      enchant: item.enchantmentId || null,
    };
  }
  makeItem(input = {}) {
    const a = this.appearance(input),
      source =
        this.catalogue.getObjectByName("Kit_" + a.family) ||
        this.catalogue.getObjectByName("Kit_daggers"),
      root = source.clone(true),
      materials = new Map();
    root.traverse((o) => {
      if (o.name.startsWith("QualityDetail"))
        o.visible = a.quality >= 85 || a.variant >= 2;
      if (o.name.startsWith("PrefixDetail"))
        o.visible = !!a.prefix && a.prefix !== "none";
      if (o.name.startsWith("RuneDetail")) o.visible = !!a.enchant;
      if (!o.isMesh) return;
      eachMaterial(o, (m) => {
        if (!materials.has(m)) materials.set(m, m.clone());
      });
      o.material = Array.isArray(o.material)
        ? o.material.map((m) => materials.get(m))
        : materials.get(o.material);
    });
    for (const m of materials.values()) {
      if (/Blade metal|Steel|Honed edge|Blackened iron/.test(m.name)) {
        m.color.setHex(MATERIALS[a.material]?.color || 0xb8bfc4);
        m.map = null;
        m.roughness = clamp(0.76 - a.quality * 0.0027, 0.2, 0.76);
        m.envMapIntensity = 1.2;
      }
      if (/Fitting metal|Aged brass/.test(m.name))
        m.color.setHex(
          a.variant >= 3 ? 0xc0a36b : a.variant === 0 ? 0x756d5c : 0x9e8350,
        );
      if (/Inscription/.test(m.name)) {
        m.color.setHex(enchantColors[a.enchant] || 0x526d68);
        m.emissive.copy(m.color);
        m.emissiveIntensity = a.enchant ? 1.1 : 0.03;
      }
      if (/Grip leather/.test(m.name))
        m.roughness = clamp(0.96 - a.quality * 0.002, 0.52, 0.96);
    }
    // Pattern silhouettes and forging treatments remain readable before the glow appears.
    root.scale.set(
      a.prefix === "piercing" ? 0.83 : a.variant === 2 ? 1.12 : 1,
      1 + (a.variant >= 2 ? 0.09 : a.variant === 0 ? -0.08 : 0),
      1,
    );
    root.userData.item = input;
    root.userData.materials = [...materials.values()];
    root.userData.appearance = a;
    return root;
  }
  actor(id, color = 0x626e63, apron = false) {
    const p =
      this.people[id] || (this.people[id] = this.person(id, color, apron));
    if (!p.identitySet) {
      p.identitySet = true;
      let seed = 0;
      for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
      const hairs = [0x38241c, 0x66503b, 0x9e8b67, 0x232522],
        skins = [0xb9825c, 0x996c4c, 0xc9a081, 0x835b42];
      p.root.traverse((o) =>
        eachMaterial(o, (m) => {
          if (m.name.includes("Chestnut hair")) m.color.setHex(hairs[seed % 4]);
          if (m.name.includes("Warm skin"))
            m.color.setHex(skins[(seed >>> 2) % 4]);
        }),
      );
      p.joints.Head.scale.setScalar(0.75);
      p.root.scale.y = id === "smith" ? 1 : 0.97 + (seed % 5) * 0.025;
    }
    p.root.visible = true;
    this.visibleActors.add(id);
    return p;
  }
  equip(p, equipment = {}) {
    const key = JSON.stringify(equipment);
    if (p.gearKey === key) return;
    p.gearKey = key;
    for (const model of p.gear || []) this.releaseItem(model);
    p.gear = [];
    p.item = null;
    p.shield = null;
    for (const [slot, item] of Object.entries(equipment)) {
      if (!item) continue;
      const model = this.makeItem(item),
        a = model.userData.appearance;
      const scale =
        slot === "ring"
          ? 0.18
          : slot === "charm"
            ? 0.35
            : slot === "tool"
              ? 0.36
              : slot === "body"
                ? 1
                : 0.78;
      model.scale.multiplyScalar(scale);
      if (slot === "weapon") {
        p.joints.Grip_R.add(model);
        model.position.y = -0.14;
        p.item = model;
      } else if (slot === "offhand") {
        p.joints.Grip_L.add(model);
        model.position.y = a.family === "daggers" ? -0.14 : -0.16;
        model.rotation.y = Math.PI;
        p.shield = model;
      } else if (slot === "body") {
        p.joints.Hips.add(model);
        model.position.y = -0.04;
      } else if (slot === "ring") {
        p.joints.Grip_R.add(model);
        model.position.set(0.035, 0.02, 0);
      } else {
        p.joints.Hips.add(model);
        model.position.set(
          slot === "tool" ? 0.28 : 0,
          slot === "tool" ? -0.13 : 0.25,
          0.19,
        );
      }
      p.gear.push(model);
    }
  }
  previewDraft(input) {
    if (!this.previewRoot) return;
    const key = JSON.stringify(this.appearance(input));
    if (key === this.previewKey) return;
    this.releaseItem(this.previewItem);
    this.previewItem = this.makeItem(input);
    const bounds = new T.Box3().setFromObject(this.previewItem),
      size = bounds.getSize(new T.Vector3()),
      center = bounds.getCenter(new T.Vector3());
    this.previewItem.position.sub(center);
    const scale = 0.88 / Math.max(size.x, size.y, size.z);
    this.previewItem.scale.multiplyScalar(scale);
    this.previewItem.position.multiplyScalar(scale);
    this.previewRoot.add(this.previewItem);
    this.previewKey = key;
    this.previewDirty = true;
  }
  path(p, key, points, time, dt, duration = 16) {
    const routeKey = key + JSON.stringify(points);
    if (p.pathKey !== routeKey) {
      const obstacles = FLOOR_OBSTACLES[this.room] || [];
      let route = [];
      for (let i = 1; i < points.length; i++) {
        const leg = planRoute(points[i - 1], points[i], obstacles);
        route.push(...leg.slice(i === 1 ? 0 : 1));
      }
      p.path = route;
      p.pathKey = routeKey;
    }
    const phase = (((time / duration) % 1) + 1) % 1,
      pose = sampleRoute(p.path, phase),
      dx = pose.x - p.root.position.x,
      dz = pose.z - p.root.position.z;
    p.distance += Math.min(0.14, Math.hypot(dx, dz));
    p.root.position.set(pose.x, 0, pose.z);
    this.turn(p, pose.heading, dt);
    this.pose(p, time, { walk: 1 });
  }
  sync(view) {
    this.view = view;
    if (this.data !== view.data) {
      this.data = view.data;
      this.patternIndex = new Map();
      for (const r of Object.values(this.data.recipes))
        this.patternIndex.set([r.classId, r.tier, r.variant].join(":"), r);
    }
    if (!this.ready) return;
    if (this.room !== view.room) this.setRoom(view.room).catch(this.onError);
    const stage = view.stage || 0;
    for (const source of [this.rooms[view.room], this.evolution[view.room]])
      source?.traverse((o) => {
        if (Number.isInteger(o.userData.stage))
          o.visible = o.userData.stage <= stage;
      });
    if (view.room === "forge" && view.draft) {
      this.previewDraft(view.draft);
      const job = view.state.jobs.find((j) => j.status === "active"),
        item = job
          ? {
              recipeId: job.recipeId,
              quality: job.quality || view.draft.quality,
              ...job,
            }
          : view.draft,
        key = JSON.stringify(this.appearance(item));
      if (key !== this.workKey) {
        this.releaseItem(this.workpiece);
        this.workpiece = this.makeItem(item);
        this.workpiece.scale.multiplyScalar(0.42);
        this.workpiece.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
        this.workpiece.position.set(-1.09, 1.127, 0.28);
        this.scene.add(this.workpiece);
        this.workKey = key;
      }
      this.workpiece.visible = true;
    }
    if (view.room === "shop") {
      const market = view.state.house.market;
      if (this.marketNextAt != null && market.nextAt > this.marketNextAt) {
        this.lastSold =
          market.sales > this.marketSales ? this.lastDisplayed?.[0] : null;
        this.saleSeenAt = view.state.simTime;
      }
      this.marketNextAt = market.nextAt;
      this.marketSales = market.sales;
      const items = view.state.inventory.filter((i) => i.displayed),
        key = JSON.stringify(items);
      this.lastDisplayed = items.slice();
      if (key !== this.shelfKey) {
        this.items.forEach((i) => this.releaseItem(i));
        this.items = [];
        items.slice(0, 18).forEach((item, i) => {
          const model = this.makeItem(item),
            row = Math.floor(i / 6),
            col = i % 6;
          model.scale.multiplyScalar(0.35);
          model.position.set(-2.48 + col * 0.59, 0.25 + row * 0.65, -1.85);
          model.rotation.z = -0.38;
          this.shelfGroup.add(model);
          this.items.push(model);
        });
        this.shelfKey = key;
      }
    }
  }
  renderBattle(match, elapsed, dt) {
    const units = [...match.snapshot.heroes, ...match.snapshot.enemies],
      events = match.result.events;
    let cursor = 0;
    while (cursor + 1 < events.length && events[cursor + 1].at <= elapsed)
      cursor++;
    const frame = events[cursor],
      health = new Map(
        [...frame.heroes, ...frame.enemies].map((u) => [u.id, u]),
      );
    const enemyGear = (u) => {
      const family =
        u.damageType && u.damageType !== "physical"
          ? "foci"
          : u.line === "back"
            ? "bows"
            : match.rival === "thread"
              ? "daggers"
              : "swords";
      const recipe = this.patternIndex.get(
        [family, match.league + 1, 1].join(":"),
      );
      const armour = this.patternIndex.get(
        [
          family === "foci"
            ? "cloth_armor"
            : family === "bows"
              ? "leather_armor"
              : "armor",
          match.league + 1,
          1,
        ].join(":"),
      );
      return {
        weapon: recipe && {
          recipeId: recipe.id,
          quality: 40 + match.league * 18,
        },
        body: armour && { recipeId: armour.id, quality: 40 },
      };
    };
    this.bolts.forEach((b) => (b.visible = false));
    for (let i = 0; i < units.length; i++) {
      const u = units[i],
        home = i < 3,
        sign = home ? -1 : 1,
        side = home ? "home" : "away",
        p = this.actor("battle-" + u.id, home ? 0x435e5b : 0x814b38),
        h = health.get(u.id);
      if (p.matchGearId !== match.id) {
        this.equip(p, u.equipment || enemyGear(u));
        p.matchGearId = match.id;
      }
      const team = units.filter((_, n) => n < 3 === home),
        line = team.filter((x) => x.line === u.line),
        lineIndex = line.indexOf(u),
        lane = (lineIndex - (line.length - 1) / 2) * 1.1;
      let strike = null,
        received = null;
      for (let n = cursor; n >= Math.max(0, cursor - 16); n--) {
        const e = events[n];
        if (elapsed - e.at > 1200) break;
        if (e.actorId === u.id && !strike) strike = e;
        if (e.targetId === u.id && !received) received = e;
      }
      const frontAlive = units
        .filter((_, n) => n < 3 !== home)
        .some((x) => x.line === "front" && health.get(x.id)?.hp > 0);
      const x =
          sign *
          (u.line === "front"
            ? frontAlive
              ? 0.59
              : -0.45
            : frontAlive
              ? 1.95
              : 1.05),
        entry = clamp(elapsed / 1000, 0, 1);
      const targetX = sign * 3 * (1 - entry) + x * entry,
        old = p.root.position.clone();
      if (
        p.matchId !== match.id ||
        Math.abs(elapsed - (p.lastElapsed || 0)) > 1000
      ) {
        p.root.position.set(targetX, 0, lane);
        p.matchId = match.id;
      } else if (h.hp > 0)
        p.root.position.lerp(
          new T.Vector3(targetX, 0, lane),
          Math.min(1, dt * 3),
        );
      const moved = p.root.position.distanceTo(old);
      p.distance += Math.min(moved, 0.2);
      const facing = strike && this.people["battle-" + strike.targetId];
      this.turn(
        p,
        facing
          ? Math.atan2(
              facing.root.position.x - p.root.position.x,
              facing.root.position.z - p.root.position.z,
            )
          : home
            ? Math.PI / 2
            : -Math.PI / 2,
        dt,
      );
      p.lastElapsed = elapsed;
      const age = strike ? (elapsed - strike.at) / 50 : 99;
      const liveUnit =
        match.live &&
        [...match.live.heroes, ...match.live.foes].find((x) => x.id === u.id);
      const next =
        liveUnit?.next ??
        events.find((e) => e.actorId === u.id && e.at > elapsed)?.at;
      const windup = next != null && next - elapsed < 450 && next > elapsed;
      this.pose(p, this.time, {
        walk: moved > 0.007 ? 1 : 0,
        guard: 0.7,
        yielded: h.hp <= 0,
        attackPhase:
          age < 7 ? "strike" : windup ? "windup" : age < 17 ? "recover" : null,
        attackAge:
          age < 7 ? age : windup ? (450 - next + elapsed) / 50 : age - 7,
        hurt: received ? Math.max(0, 1 - (elapsed - received.at) / 350) : 0,
        block: received?.blocked && elapsed - received.at < 500,
      });
      // Ranged equipment uses a braced release or channelled cast, never a sword thrust.
      const family = p.item?.userData.appearance.family;
      if (h.hp > 0 && ["bows", "foci", "instruments"].includes(family)) {
        p.joints.Shoulder_R.rotation.x = family === "bows" ? -1.2 : -0.8;
        p.joints.Elbow_R.rotation.x = family === "bows" ? -1.15 : -0.4;
        p.joints.Shoulder_L.rotation.x = -1.3;
        p.joints.Elbow_L.rotation.x = -0.18;
        p.item.rotation.x = family === "bows" ? 0 : -0.45;
      }
      if (strike && ["bows", "foci", "instruments"].includes(family)) {
        const age = elapsed - strike.at,
          target = this.people["battle-" + strike.targetId];
        if (age >= 0 && age < 300 && target) {
          const bolt = this.bolts[i],
            a = p.root.position.clone().add(new T.Vector3(0, 1.08, 0)),
            b = target.root.position.clone().add(new T.Vector3(0, 1.02, 0));
          bolt.visible = true;
          bolt.position.copy(a).lerp(b, age / 300);
          bolt.quaternion.setFromUnitVectors(
            new T.Vector3(0, 1, 0),
            b.sub(a).normalize(),
          );
          bolt.material.color.setHex(
            family === "bows"
              ? 0xc7ba8b
              : enchantColors[u.equipment?.weapon?.enchantmentId] || 0x9aa3e1,
          );
          bolt.scale.set(
            family === "bows" ? 1 : 3,
            1,
            family === "bows" ? 1 : 3,
          );
        }
      }
      if (!p.hpBar) {
        const bg = new T.Mesh(
          new T.PlaneGeometry(0.6, 0.044),
          new T.MeshBasicMaterial({ color: 0x222b2b, side: T.DoubleSide }),
        );
        const fill = new T.Mesh(
          new T.PlaneGeometry(0.58, 0.032),
          new T.MeshBasicMaterial({
            color: home ? 0x8cbba3 : 0xc88c73,
            side: T.DoubleSide,
          }),
        );
        bg.add(fill);
        fill.position.z = 0.002;
        p.root.add(bg);
        bg.position.y = 1.74;
        p.hpBar = bg;
        p.hpFill = fill;
      }
      p.hpBar.quaternion
        .copy(p.root.quaternion)
        .invert()
        .multiply(this.camera.quaternion);
      p.hpFill.scale.x = clamp(h.hp / h.maxHp, 0, 1);
      p.hpFill.position.x = -(1 - p.hpFill.scale.x) * 0.29;
    }
  }
  update(dt, battleCanvas) {
    const v = this.view;
    if (!v || !this.ready) return;
    this.time += Math.min(dt, 0.1);
    const t = this.time,
      s = v.state;
    if (s.simTime !== this.observedSim) {
      this.observedSim = s.simTime;
      this.visualAdvance = 0;
    } else
      this.visualAdvance = Math.min(250, (this.visualAdvance || 0) + dt * 1000);
    const clock = s.simTime + this.visualAdvance;
    this.visibleActors.clear();
    const smith = this.people.smith;
    if (this.room === "forge") {
      this.actor("smith");
      const job = s.jobs.find((j) => j.status === "active"),
        portion = job
          ? clamp(
              (clock - job.startedAt) / (job.completeAt - job.startedAt),
              0,
              1,
            )
          : 0;
      const station = job
          ? portion < 0.2
            ? "heat"
            : portion > 0.8
              ? "finish"
              : "hammer"
          : "idle",
        walking = this.walk(smith, station, dt, t);
      if (!walking)
        this.pose(smith, t, {
          hammer: station === "hammer",
          guard: station === "finish" ? 0.4 : 0,
        });
    } else if (this.room === "smith") {
      this.actor("smith");
      smith.root.position.set(-0.8, 0, -1.1);
      smith.root.rotation.y = 0;
      this.pose(smith, t, { guard: 0.3 });
    }
    this.hammer.visible = this.room === "forge";
    if (this.room === "mine") {
      s.world.miners.forEach((miner, i) => {
        const p = this.actor(miner.id, 0x655b48, true),
          x = [-2.4, -1.3, 1.2, 2.4][i % 4];
        p.root.position.set(x, 0, -0.7 + Math.floor(i / 4) * 0.82);
        p.root.rotation.y = Math.PI;
        this.pose(p, t + i, { guard: 0.4 });
        p.joints.Shoulder_R.rotation.x =
          -1.15 + (this.reduced ? 0 : Math.sin(t * 1.6 + i) * 0.42);
        p.joints.Elbow_R.rotation.x = -0.7;
        if (!p.tool) {
          p.tool = this.hammer.clone(true);
          p.tool.visible = true;
          p.joints.Grip_R.add(p.tool);
        }
        p.tool.rotation.set(0.6, Math.PI / 2, 0);
      });
    }
    let staffIndex = 0;
    for (const [id, status] of Object.entries(s.staff)) {
      const definition = this.data.staff[id];
      if (!definition) continue;
      const resting = !status.active;
      if (this.room !== (resting ? "employees" : definition.department))
        continue;
      const p = this.actor(
        "staff-" + id,
        0x6d725c,
        ["smelter", "forge", "mine"].includes(definition.department),
      );
      const seats =
        this.room === "forge"
          ? [[1.62, -0.35]]
          : this.room === "shop"
            ? [[2.03, -1.23]]
            : this.room === "smelter"
              ? [
                  [-2.2, -0.42],
                  [0.3, -0.42],
                ]
              : [
                  [-1, 1.0],
                  [1, 1.0],
                  [2, 0.15],
                  [-2, 0.15],
                ];
      const pos = seats[staffIndex % seats.length];
      p.root.position.set(
        pos[0],
        0,
        pos[1] + Math.floor(staffIndex / seats.length) * 0.65,
      );
      p.root.rotation.y = this.room === "shop" ? 0 : Math.PI;
      staffIndex++;
      this.pose(p, t + staffIndex, { guard: resting ? 0.05 : 0.3 });
      if (!resting && !this.reduced)
        p.joints.Shoulder_R.rotation.x =
          -0.8 + Math.sin(t * 1.8 + staffIndex) * 0.12;
    }
    if (this.room === "shop" && s.started) {
      // The town is anonymous retail; browsers never masquerade as hired fighters.
      const p = this.actor("town-customer", 0x707966),
        until = (s.house.market.nextAt - s.simTime) / 1000;
      const after =
        this.saleSeenAt == null ? 99 : (s.simTime - this.saleSeenAt) / 1000;
      if (after < 10) {
        const key = JSON.stringify(this.lastSold);
        if (this.lastSold && p.saleKey !== key) {
          this.releaseItem(p.item);
          p.item = this.makeItem(this.lastSold);
          p.item.scale.multiplyScalar(0.42);
          p.joints.Grip_R.add(p.item);
          p.saleKey = key;
        }
        if (p.item) p.item.visible = !!this.lastSold;
        this.path(
          p,
          "checkout",
          this.lastSold
            ? [
                [0.65, -0.85],
                [0.65, 1.75],
                [2, 1.75],
                [2, 0.25],
                [2, 1.75],
                [0.25, 2.65],
              ]
            : [
                [0.65, -0.85],
                [0.65, 1.75],
                [0.25, 2.65],
              ],
          after,
          dt,
          10,
        );
      } else if (until <= 24) {
        if (p.item) p.item.visible = false;
        const enter = 24 - until;
        if (enter < 7)
          this.path(
            p,
            "enter",
            [
              [0.25, 2.65],
              [0.65, 1.75],
              [0.65, -0.85],
            ],
            enter,
            dt,
            7.01,
          );
        else {
          p.root.position.set(0.65, 0, -0.85);
          p.root.rotation.y = Math.PI;
          this.pose(p, t, { guard: 0.25 });
        }
      } else this.visibleActors.delete("town-customer");
    }
    const match = v.match;
    this.projectiles.visible = this.room === "arena";
    if (this.room === "arena") {
      if (match)
        this.renderBattle(
          match,
          v.replay ? v.replayAt : Math.max(0, clock - match.startedAt),
          dt,
        );
      else
        s.house.team.forEach((id, i) => {
          const u = s.adventurers.find((u) => u.id === id);
          if (!u) return;
          const p = this.actor("hero-" + id, 0x49605b);
          this.equip(p, u.equipment);
          p.root.position.set(-1.15 + i * 1.15, 0, 0);
          p.root.rotation.y = 0.28;
          this.pose(p, t, { guard: 0.35 });
        });
    }
    for (const [id, p] of Object.entries(this.people))
      p.root.visible = this.visibleActors.has(id);
    this.fireLight.intensity = this.reduced
      ? 11
      : 11 + Math.sin(t * 9) * 1.1 + Math.sin(t * 17) * 0.5;
    for (let i = 0; i < this.fire.children.length; i++)
      this.fire.children[i].scale.y =
        0.24 + (this.reduced ? 0 : Math.sin(t * 8 + i) * 0.05);
    let presentation = null,
      actors = {};
    if (this.room === "arena" && match) {
      const at = v.replay ? v.replayAt : Math.max(0, clock - match.startedAt);
      const units = [...match.snapshot.heroes, ...match.snapshot.enemies];
      units.forEach((u) => {
        actors[u.id] = this.people["battle-" + u.id];
      });
      presentation = {
        id: match.id,
        status: "live",
        tick: at / 50,
        units,
        events: match.result.events
          .filter((e) => e.type === "strike" && e.at <= at && at - e.at < 1000)
          .map((e) => ({
            type: "hit",
            tick: e.at / 50,
            actor: e.actorId,
            target: e.targetId,
            damage: e.damage,
            block: e.blocked,
            crit: e.critical,
          })),
      };
    }
    this.atmosphere.update(
      this.room,
      t,
      this.reduced,
      presentation,
      0,
      actors,
      this.hammerImpactAt,
    );
    if (!presentation)
      this.atmosphere.markers.forEach((m) => (m.visible = false));
    this.controls.update();
    this.drawPreview();
    if (battleCanvas && this.room === "arena") {
      const box = battleCanvas.getBoundingClientRect();
      if (box.width && box.bottom > 0 && box.top < innerHeight) {
        const ratio = this.renderer.getPixelRatio(),
          width = Math.round(box.width * ratio),
          height = Math.round(box.height * ratio);
        if (battleCanvas.width !== width || battleCanvas.height !== height) {
          battleCanvas.width = width;
          battleCanvas.height = height;
        }
        const ctx = battleCanvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        // A dedicated battle composition shares the one GPU context with the room and item inspection.
        const camera =
            this.battleCamera || (this.battleCamera = this.camera.clone()),
          aspect = width / height,
          span = Math.max(5.0, 7.2 / aspect);
        camera.position.copy(this.camera.position);
        camera.quaternion.copy(this.camera.quaternion);
        camera.left = (-span * aspect) / 2;
        camera.right = (span * aspect) / 2;
        camera.top = span / 2;
        camera.bottom = -span / 2;
        camera.updateProjectionMatrix();
        const rw = Math.min(width, this.canvas.width),
          rh = Math.min(height, this.canvas.height);
        this.renderer.setViewport(0, 0, rw / ratio, rh / ratio);
        this.renderer.setScissor(0, 0, rw / ratio, rh / ratio);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, camera);
        ctx.drawImage(
          this.canvas,
          0,
          this.canvas.height - rh,
          rw,
          rh,
          0,
          0,
          width,
          height,
        );
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(
          0,
          0,
          this.canvas.width / ratio,
          this.canvas.height / ratio,
        );
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
