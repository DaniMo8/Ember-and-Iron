import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MATERIALS, appearance } from "./core.js";
import { ARENA } from "./combat.js";
import {
  FLOOR_OBSTACLES,
  FORGE_STATIONS,
  VISIT_DURATIONS,
  planRoute,
  sampleRoute,
  visitorRoute,
} from "./navigation.js";
import { hammerStroke, attackMotion } from "./motion.js";
import { Atmosphere } from "./atmosphere.js";

const lerp = T.MathUtils.lerp,
  clamp = T.MathUtils.clamp;
const materialEach = (o, fn) => {
  if (o.material)
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(fn);
};
export class AtelierScene {
  constructor(
    canvas,
    { onError = () => {}, onInspect = () => {}, onPerson = () => {} } = {},
  ) {
    this.canvas = canvas;
    this.onError = onError;
    this.room = "forge";
    this.ready = false;
    this.models = {};
    this.rooms = {};
    this.people = {};
    this.items = [];
    this.time = 0;
    this.quality = "balanced";
    this.reduced = false;
    this.follow = false;
    this.inspecting = false;
    this.renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-5, 5, 4, -4, 0.1, 80);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minPolarAngle = 0.48;
    this.controls.maxPolarAngle = 1.27;
    this.controls.minZoom = 0.75;
    this.controls.maxZoom = 2.6;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.4;
    this.controls.zoomSpeed = 0.65;
    this.scene.add(new T.HemisphereLight(0xbfc9d0, 0x30251d, 1.1));
    this.key = new T.DirectionalLight(0xf2d4ae, 3.5);
    this.key.position.set(-3, 8, 5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.camera.left = -7;
    this.key.shadow.camera.right = 7;
    this.key.shadow.camera.top = 6;
    this.key.shadow.camera.bottom = -6;
    this.key.shadow.camera.near = 0.5;
    this.key.shadow.camera.far = 28;
    this.key.shadow.bias = -0.0007;
    this.key.shadow.normalBias = 0.028;
    this.key.shadow.radius = 3;
    this.scene.add(this.key);
    const fill = new T.DirectionalLight(0xa2b3c6, 0.8);
    fill.position.set(4, 4, -4);
    this.scene.add(fill);
    this.fireLight = new T.PointLight(0xff9c42, 15, 4, 1.65);
    this.fireLight.position.set(-2.2, 1.0, -0.75);
    this.scene.add(this.fireLight);
    const pmrem = new T.PMREMGenerator(this.renderer),
      environment = new RoomEnvironment();
    this.envTarget = pmrem.fromScene(environment, 0.04);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.36;
    environment.dispose();
    pmrem.dispose();
    this.ground = new T.Mesh(
      new T.PlaneGeometry(60, 60),
      new T.ShadowMaterial({ opacity: 0.18 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.39;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.actorGroup = new T.Group();
    this.scene.add(this.actorGroup);
    this.shelfGroup = new T.Group();
    this.scene.add(this.shelfGroup);
    this.fire = new T.Group();
    this.scene.add(this.fire);
    for (let i = 0; i < 3; i++) {
      const f = new T.Mesh(
        new T.SphereGeometry(1, 12, 8),
        new T.MeshBasicMaterial({
          color: i === 1 ? 0xffdb6a : 0xf6a23c,
          transparent: true,
          opacity: 0.7 - i * 0.08,
          depthWrite: false,
        }),
      );
      f.position.set(-2.34 + i * 0.12, 0.72, -0.99);
      f.scale.set(0.12, 0.29, 0.1);
      this.fire.add(f);
    }
    this.sparkGeometry = new T.BufferGeometry();
    this.sparkPositions = new Float32Array(22 * 3);
    this.sparkGeometry.setAttribute(
      "position",
      new T.BufferAttribute(this.sparkPositions, 3),
    );
    this.sparks = new T.Points(
      this.sparkGeometry,
      new T.PointsMaterial({
        color: 0xffc968,
        size: 0.026,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    this.scene.add(this.sparks);
    this.atmosphere = new Atmosphere(this.scene);
    this.loader = new GLTFLoader();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    const raycaster = new T.Raycaster();
    let press = null;
    canvas.addEventListener("pointerdown", (e) => {
      press = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("pointerup", (e) => {
      if (
        !press ||
        Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5 ||
        this.inspecting
      )
        return;
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        this.camera,
      );
      const hits = raycaster.intersectObjects(
        [
          this.actorGroup,
          this.shelfGroup,
          ...(this.workpiece ? [this.workpiece] : []),
        ],
        true,
      );
      for (const hit of hits) {
        let o = hit.object,
          item = null,
          person = null,
          visible = true;
        while (o) {
          visible &&= o.visible;
          if (o.userData.item) item = o.userData.item;
          if (o.userData.person) person = o.userData.person;
          o = o.parent;
        }
        if (!visible) continue;
        if (item) {
          onInspect(item);
          return;
        }
        if (person) {
          onPerson(person);
          return;
        }
      }
    });
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.ready = false;
      onError(
        "The 3D view paused. Your workshop is still running. Reload the page to restore the scene.",
      );
    });
    this.home();
    this.resize();
  }
  async asset(name) {
    if (!this.models[name])
      this.models[name] = this.loader
        .loadAsync(`assets/atelier/${name}.glb?v=footwork-2`)
        .then((g) => {
          g.scene.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              materialEach(o, (m) => {
                if (m.map) m.map.anisotropy = 4;
              });
            }
          });
          this.atmosphere.register(
            name === "showroom" ? "shop" : name,
            g.scene,
          );
          return g.scene;
        });
    return this.models[name];
  }
  async init() {
    const [forge, character, dagger, shield, hammer] = await Promise.all(
      ["forge", "character", "dagger", "shield", "hammer"].map((n) =>
        this.asset(n),
      ),
    );
    this.characterSource = character;
    this.daggerSource = dagger;
    this.shieldSource = shield;
    this.rooms.forge = forge;
    this.scene.add(forge);
    this.people.smith = this.person("smith", 0x8b6b45, true);
    this.people.tomas = this.person("tomas", 0x758c6c, true);
    this.people.perrin = this.person("perrin", 0x946746);
    this.people.customer = this.person("customer", 0x778b70);
    this.hammer = hammer.clone(true);
    this.hammer.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    this.hammer.scale.setScalar(0.88);
    this.people.smith.joints.Grip_R.add(this.hammer);
    for (const [name, color] of [
      ["mara", 0x315e59],
      ["renn", 0x52674d],
      ["warden", 0x9b5736],
      ["rook", 0x8c694b],
    ])
      this.people[name] = this.person(
        name,
        color,
        false,
        ["mara", "warden"].includes(name),
      );
    this.attachShield(this.people.mara);
    this.attachShield(this.people.warden);
    this.attachDagger(this.people.mara, {
      material: "iron",
      quality: 65,
      prefix: "plain",
      enchant: "none",
    });
    this.attachDagger(this.people.warden, {
      material: "iron",
      quality: 55,
      prefix: "plain",
      enchant: "none",
    });
    this.attachDagger(this.people.rook, {
      material: "iron",
      quality: 50,
      prefix: "plain",
      enchant: "none",
    });
    this.ready = true;
    this.setQuality(this.quality);
    await this.setRoom(this.room);
    return this;
  }
  person(id, color, apron = false, mail = false) {
    const visual = this.characterSource.clone(true),
      root = new T.Group(),
      materials = new Map();
    root.add(visual);
    root.name = id;
    root.scale.setScalar(id === "customer" ? 0.91 : id === "mara" ? 1.05 : 1);
    root.traverse((o) => {
      if (o.isMesh) {
        if (o.name.startsWith("Mail")) o.visible = mail;
        if (o.name.startsWith("Apron")) o.visible = apron;
        materialEach(o, (m) => {
          if (!materials.has(m)) materials.set(m, m.clone());
        });
        o.material = Array.isArray(o.material)
          ? o.material.map((m) => materials.get(m))
          : materials.get(o.material);
        materialEach(o, (m) => {
          if (m.name.includes("House teal")) {
            m.map = null;
            m.color.setHex(color);
          }
          if (m.name.includes("Warm skin") && id === "perrin")
            m.color.multiplyScalar(0.82);
        });
      }
    });
    const joints = {};
    for (const name of [
      "Hips",
      "Head",
      "Shoulder_L",
      "Shoulder_R",
      "Elbow_L",
      "Elbow_R",
      "Thigh_L",
      "Thigh_R",
      "Shin_L",
      "Shin_R",
      "Grip_L",
      "Grip_R",
    ])
      joints[name] = root.getObjectByName(name);
    // First silhouette correction; the final campaign gets new adult rigs.
    joints.Head.scale.setScalar(0.79);
    root.userData.person = id;
    const p = {
      root,
      visual,
      distance: 0,
      joints,
      phase: 0,
      item: null,
      itemKey: null,
      shield: null,
    };
    this.actorGroup.add(root);
    return p;
  }
  makeItem(input) {
    const a = appearance(input),
      root = this.daggerSource.clone(true),
      materials = new Map();
    root.traverse((o) => {
      if (o.isMesh) {
        materialEach(o, (m) => {
          if (!materials.has(m)) materials.set(m, m.clone());
        });
        o.material = Array.isArray(o.material)
          ? o.material.map((m) => materials.get(m))
          : materials.get(o.material);
        materialEach(o, (m) => {
          if (m.name === "Blade metal" || m.name === "Honed edge") {
            m.color.setHex(MATERIALS[a.material].color);
            if (m.name === "Honed edge")
              m.color.lerp(new T.Color(0xfff0d0), 0.15);
            m.roughness = clamp(0.67 - a.quality * 0.0023, 0.21, 0.64);
            m.envMapIntensity = 1.8;
          }
          if (m.name === "Inscription") {
            m.color.setHex(a.enchant === "flame" ? 0xf2ad42 : 0x93c6ed);
            m.emissive.copy(m.color);
            m.emissiveIntensity = a.enchant === "none" ? 0 : 0.85;
          }
          if (m.name === "Grip leather") {
            m.roughness = clamp(0.95 - a.quality * 0.002, 0.5, 0.95);
          }
        });
        if (o.name === "Blade") {
          o.scale.x =
            a.prefix === "piercing" ? 0.72 : a.prefix === "keen" ? 1.05 : 1;
        }
      }
    });
    const blade = root.getObjectByName("Blade");
    if (blade)
      blade.scale.x =
        a.prefix === "piercing" ? 0.72 : a.prefix === "keen" ? 1.05 : 1;
    const detail = root.getObjectByName("QualityDetail"),
      prefix = root.getObjectByName("PrefixDetail"),
      rune = root.getObjectByName("RuneDetail");
    if (detail) detail.visible = a.quality >= 95;
    if (prefix) prefix.visible = a.prefix === "precise";
    if (rune) rune.visible = a.enchant !== "none";
    root.userData.item = { ...input, ...a };
    root.userData.materials = [...materials.values()];
    return root;
  }
  releaseItem(root) {
    if (!root) return;
    root.removeFromParent();
    root.userData.materials?.forEach((m) => m.dispose());
  }
  setupPreview(canvas) {
    this.previewCanvas = canvas;
    this.previewContext = canvas.getContext("2d");
    if (!this.previewContext)
      throw new Error("Item preview canvas unavailable");
    this.previewScene = new T.Scene();
    this.previewScene.environment = this.envTarget.texture;
    this.previewScene.environmentIntensity = 1.1;
    this.previewScene.add(new T.HemisphereLight(0xd5dee4, 0x31271f, 1.5));
    const key = new T.DirectionalLight(0xf3e4cb, 4.2);
    key.position.set(-2, 3, 4);
    const rim = new T.DirectionalLight(0xa7c5df, 3.2);
    rim.position.set(3, 1, -2);
    this.previewScene.add(key, rim);
    this.previewCamera = new T.PerspectiveCamera(30, 1, 0.1, 10);
    this.previewCamera.position.set(0, 0, 1.7);
    this.previewRoot = new T.Group();
    this.previewRoot.rotation.set(0.05, -0.35, -0.75);
    this.previewScene.add(this.previewRoot);
    this.previewAbort = new AbortController();
    const options = { signal: this.previewAbort.signal };
    let press = null;
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        press = e.clientX;
        canvas.setPointerCapture(e.pointerId);
      },
      options,
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        if (press === null) return;
        this.turnPreview((e.clientX - press) * 0.016);
        press = e.clientX;
      },
      options,
    );
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      canvas.addEventListener(
        event,
        () => {
          press = null;
        },
        options,
      );
    canvas.addEventListener(
      "keydown",
      (e) => {
        if (!["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) return;
        e.preventDefault();
        if (e.key === "Home") this.previewRoot.rotation.y = -0.35;
        else this.turnPreview(e.key === "ArrowLeft" ? -0.18 : 0.18);
        this.previewDirty = true;
      },
      options,
    );
    this.previewObserver = new ResizeObserver(() => {
      this.previewDirty = true;
    });
    this.previewObserver.observe(canvas);
  }
  previewDraft(input) {
    if (!this.previewRoot) return;
    const key = JSON.stringify(appearance(input));
    if (key === this.previewKey) return;
    this.releaseItem(this.previewItem);
    this.previewItem = this.makeItem(input);
    const bounds = new T.Box3().setFromObject(this.previewItem);
    this.previewItem.position.sub(bounds.getCenter(new T.Vector3()));
    this.previewRoot.add(this.previewItem);
    this.previewKey = key;
    this.previewDirty = true;
  }
  turnPreview(amount) {
    if (!this.previewRoot) return;
    this.previewRoot.rotation.y += amount;
    this.previewDirty = true;
  }
  drawPreview() {
    if (!this.previewDirty || !this.previewItem || this.room !== "forge")
      return;
    const canvas = this.previewCanvas,
      box = canvas.getBoundingClientRect();
    if (!box.width || !box.height || box.bottom < 0 || box.top > innerHeight)
      return;
    const ratio = Math.min(this.renderer.getPixelRatio(), 1.5);
    const width = Math.min(this.canvas.width, Math.round(box.width * ratio));
    const height = Math.min(this.canvas.height, Math.round(box.height * ratio));
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    this.previewCamera.aspect = width / height;
    this.previewCamera.updateProjectionMatrix();
    const pixelRatio = this.renderer.getPixelRatio();
    // Draw only when the design, angle or size changes. Reuse the room's
    // WebGL context, then copy the item into its independent UI canvas.
    this.renderer.setViewport(0, 0, width / pixelRatio, height / pixelRatio);
    this.renderer.setScissor(0, 0, width / pixelRatio, height / pixelRatio);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.previewScene, this.previewCamera);
    this.previewContext.clearRect(0, 0, width, height);
    this.previewContext.drawImage(
      this.canvas,
      0,
      this.canvas.height - height,
      width,
      height,
      0,
      0,
      width,
      height,
    );
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(
      0,
      0,
      this.canvas.width / pixelRatio,
      this.canvas.height / pixelRatio,
    );
    this.previewDirty = false;
  }
  attachDagger(p, input) {
    const key = JSON.stringify(input);
    if (key === p.itemKey) return;
    this.releaseItem(p.item);
    p.item = this.makeItem(input);
    p.item.scale.setScalar(0.55);
    p.item.position.set(0, -0.06, 0.025);
    p.item.rotation.x = 1.5;
    p.joints.Grip_R.add(p.item);
    p.itemKey = key;
  }
  attachShield(p) {
    p.shield = this.shieldSource.clone(true);
    p.shield.scale.setScalar(1.02);
    p.shield.position.set(-0.015, 0.04, 0.06);
    p.joints.Grip_L.add(p.shield);
  }
  async setRoom(room) {
    this.room = room;
    if (!this.ready) return;
    if (!this.rooms[room]) {
      const asset = await this.asset(room === "shop" ? "showroom" : room);
      if (this.room !== room) return;
      this.rooms[room] = asset;
      this.scene.add(asset);
    }
    this.inspecting = false;
    this.releaseItem(this.inspected);
    this.inspected = null;
    for (const [id, r] of Object.entries(this.rooms)) r.visible = id === room;
    this.actorGroup.visible = true;
    this.shelfGroup.visible = room === "shop";
    this.fire.visible = room === "forge";
    this.fireLight.visible = room === "forge";
    this.sparks.visible = room === "forge";
    for (const [id, p] of Object.entries(this.people))
      p.root.visible =
        room === "forge"
          ? ["smith", "tomas"].includes(id)
          : room === "shop"
            ? ["perrin", "customer"].includes(id)
            : ["mara", "renn", "warden", "rook"].includes(id);
    this.people.smith.root.position.set(0.35, 0, 1.18);
    this.people.smith.routeKey = null;
    this.people.tomas.root.position.set(1.62, 0, -0.35);
    this.people.perrin.root.position.set(2.03, 0, -1.23);
    this.home();
    this.resize();
  }
  home() {
    this.follow = false;
    this.controls.target.set(0, this.room === "arena" ? 0.65 : 1.35, 0);
    this.camera.position.set(
      ...(this.room === "arena" ? [2, 10.5, 12] : [8, 8.4, 11]),
    );
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  resize() {
    const box = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, box.width),
      h = Math.max(1, box.height),
      aspect = w / h;
    this.renderer.setSize(w, h, false);
    const span = this.inspecting
      ? Math.max(2.25, 2.1 / aspect)
      : Math.max(this.room === "arena" ? 7.2 : 8.0, 9.1 / aspect);
    const scenic = document.body.classList.contains("scenic-mode");
    const offsetX = !scenic && w > 800 ? span * aspect * 0.1 : 0;
    const offsetY = !scenic && w <= 800 ? -span * 0.13 : 0;
    this.camera.left = (-span * aspect) / 2 + offsetX;
    this.camera.right = (span * aspect) / 2 + offsetX;
    this.camera.top = span / 2 + offsetY;
    this.camera.bottom = -span / 2 + offsetY;
    this.camera.updateProjectionMatrix();
  }
  setQuality(q) {
    this.previewDirty = true;
    this.quality = q;
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, q === "high" ? 2 : q === "low" ? 1 : 1.5),
    );
    this.renderer.shadowMap.enabled = q !== "low";
    this.key.shadow.mapSize.set(
      q === "high" ? 2048 : 1024,
      q === "high" ? 2048 : 1024,
    );
    if (this.key.shadow.map) {
      this.key.shadow.map.dispose();
      this.key.shadow.map = null;
    }
    this.resize();
  }
  inspect(input) {
    if (!this.ready) return;
    const already = this.inspecting;
    this.inspecting = true;
    for (const r of Object.values(this.rooms)) r.visible = false;
    this.actorGroup.visible = false;
    this.shelfGroup.visible = false;
    this.fire.visible = false;
    this.fireLight.visible = false;
    this.sparks.visible = false;
    if (this.workpiece) this.workpiece.visible = false;
    this.releaseItem(this.inspected);
    this.inspected = this.makeItem(input);
    this.inspected.scale.setScalar(1.65);
    this.inspected.position.set(0, 0.04, 0);
    this.scene.add(this.inspected);
    if (!already) {
      this.camera.position.set(1.1, 1.04, 4.5);
      this.controls.target.set(0, 0.9, 0);
      this.camera.zoom = 1;
      this.controls.update();
    }
    this.resize();
  }
  refreshItems(s, draft, battle) {
    const worn =
      this.replaying || battle?.status === "live"
        ? battle?.item
        : s.items.find((i) => i.location === "team");
    if (worn) this.attachDagger(this.people.renn, worn);
    const active = s.queue[0] || draft,
      workKey = JSON.stringify(active);
    if (this.workKey !== workKey) {
      this.releaseItem(this.workpiece);
      this.workpiece = this.makeItem(active);
      this.workpiece.position.set(-1.09, 1.127, 0.28);
      this.workpiece.rotation.z = -Math.PI / 2;
      this.workpiece.rotation.x = -Math.PI / 2;
      this.workpiece.scale.setScalar(0.55);
      this.scene.add(this.workpiece);
      this.workKey = workKey;
    }
    this.workpiece.visible = this.room === "forge" && !this.inspecting;
    const displayed = s.items.filter((i) => i.location === "shelf"),
      shelfKey =
        JSON.stringify(displayed) +
        (s.visitor.phase === "checkout" ? s.visitor.itemId : "");
    if (shelfKey !== this.shelfKey) {
      for (const item of this.items) this.releaseItem(item);
      this.items = [];
      const positions = [
        [-2.43, 0.96, -1.61],
        [-0.48, 0.96, -1.61],
        [-0.56, 0.89, 0.3],
      ];
      displayed.forEach((i, n) => {
        if (
          n > 2 ||
          (s.visitor.phase === "checkout" && s.visitor.itemId === i.id)
        )
          return;
        const item = this.makeItem(i);
        item.position.set(...positions[n]);
        item.scale.setScalar(n === 2 ? 0.64 : 0.88);
        item.rotation.z = n === 2 ? 0 : -Math.PI / 2;
        if (n === 2) item.rotation.x = Math.PI / 2;
        this.shelfGroup.add(item);
        this.items.push(item);
      });
      this.shelfKey = shelfKey;
    }
    const carrying = ["checkout", "leave"].includes(s.visitor.phase)
      ? s.items.find((i) => i.id === s.visitor.itemId)
      : null;
    if (carrying) this.attachDagger(this.people.customer, carrying);
    if (this.people.customer.item)
      this.people.customer.item.visible = !!carrying;
  }
  turn(p, angle, dt) {
    const delta = Math.atan2(
      Math.sin(angle - p.root.rotation.y),
      Math.cos(angle - p.root.rotation.y),
    );
    p.root.rotation.y += delta * Math.min(1, dt * 12);
  }
  pose(
    p,
    time,
    {
      walk = 0,
      guard = 0,
      hammer = false,
      hurt = 0,
      block = 0,
      yielded = false,
      attackPhase = null,
      attackAge = 0,
      legacy = false,
    } = {},
  ) {
    const j = p.joints,
      phase = p.distance * 11,
      leg = Math.sin(phase) * walk * 0.46;
    let bladeAngle = Math.PI / 2;
    p.visual.position.set(0, 0, 0);
    p.visual.rotation.set(0, 0, 0);
    j.Thigh_L.rotation.x = leg;
    j.Thigh_R.rotation.x = -leg;
    j.Shin_L.rotation.x = Math.max(0, -leg) * 0.72;
    j.Shin_R.rotation.x = Math.max(0, leg) * 0.72;
    j.Hips.position.y =
      0.72 +
      (this.reduced || hammer
        ? 0
        : Math.abs(Math.sin(phase)) * walk * 0.012 +
          Math.sin(time * 1.7) * 0.002);
    j.Shoulder_R.rotation.set(
      walk ? leg * 0.55 : -0.38 - guard * 0.25,
      0,
      -0.04,
    );
    j.Shoulder_L.rotation.set(
      walk ? -leg * 0.55 : -0.28 - guard * 0.52,
      0,
      0.04,
    );
    j.Elbow_R.rotation.x = -0.36;
    j.Elbow_L.rotation.x = -0.25 - guard * 0.18;
    j.Head.rotation.set(
      hurt * 0.12,
      this.reduced ? 0 : Math.sin(time * 0.65) * 0.025,
      0,
    );
    if (attackPhase) {
      const m = attackMotion(
        attackPhase,
        attackAge,
        legacy ? 9 : ARENA.windup,
        legacy ? 8 : ARENA.strike,
      );
      bladeAngle = 0.52 + m.thrust * 1.05;
      j.Shoulder_R.rotation.x = -0.58 + m.pull * 0.33 - m.thrust * 0.94;
      j.Elbow_R.rotation.x = -1.0 - m.pull * 0.4 + m.thrust * 0.86;
      j.Shoulder_R.rotation.z = -0.05 - m.pull * 0.16;
      p.visual.position.z = m.thrust * 0.13;
      p.visual.rotation.y = -m.pull * 0.12 + m.thrust * 0.1;
      j.Thigh_R.rotation.x -= m.thrust * 0.12;
    }
    if (block) {
      j.Shoulder_L.rotation.x = -1.13;
      j.Elbow_L.rotation.x = -0.32;
    }
    p.visual.rotation.x = -hurt * 0.13;
    if (hammer) {
      const stroke = hammerStroke(time);
      j.Shoulder_R.rotation.set(stroke.shoulder, 0, 0);
      j.Elbow_R.rotation.x = stroke.elbow;
      j.Shoulder_L.rotation.x = -0.9;
      j.Elbow_L.rotation.x = -0.55;
      this.hammer.rotation.set(stroke.wrist, Math.PI / 2, 0);
      if (stroke.contact && Math.floor(time / 1.45) !== this.lastHammerCycle) {
        this.lastHammerCycle = Math.floor(time / 1.45);
        this.hammerImpactAt = time;
      }
    } else if (p === this.people.smith)
      this.hammer.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    if (yielded) {
      j.Thigh_L.rotation.x = -0.95;
      j.Shin_L.rotation.x = 1.7;
      j.Thigh_R.rotation.x = -0.8;
      j.Shin_R.rotation.x = 1.65;
      j.Hips.position.y = 0.72;
      j.Head.rotation.x = 0.5;
      p.visual.position.y = -0.29;
      p.visual.rotation.x = 0.28;
      j.Shoulder_R.rotation.x = 0.1;
      j.Elbow_R.rotation.x = -0.12;
      j.Shoulder_L.rotation.x = -0.2;
      bladeAngle = 2.55;
    }
    // The wrist turns the point into a thrust; the shield stays upright on the forearm.
    if (p.item)
      p.item.rotation.x =
        bladeAngle - j.Shoulder_R.rotation.x - j.Elbow_R.rotation.x;
    if (p.shield)
      p.shield.rotation.x = -j.Shoulder_L.rotation.x - j.Elbow_L.rotation.x;
  }
  walk(p, station, dt, time) {
    const target = FORGE_STATIONS[station],
      key = station;
    if (p.routeKey !== key) {
      p.route = planRoute(
        [p.root.position.x, p.root.position.z],
        target.position,
        FLOOR_OBSTACLES.forge,
      );
      p.routeIndex = 1;
      p.routeKey = key;
    }
    let remaining = dt * 1.18,
      moved = 0;
    while (remaining > 0 && p.routeIndex < p.route.length) {
      const next = p.route[p.routeIndex],
        dx = next[0] - p.root.position.x,
        dz = next[1] - p.root.position.z,
        d = Math.hypot(dx, dz);
      const step = Math.min(d, remaining);
      if (d > 1e-7) {
        p.root.position.x += (dx / d) * step;
        p.root.position.z += (dz / d) * step;
        this.turn(p, Math.atan2(dx, dz), dt);
      }
      moved += step;
      remaining -= step;
      if (d <= step + 0.001) p.routeIndex++;
      else break;
    }
    p.distance += moved;
    const walking = p.routeIndex < p.route.length;
    const facing = Math.atan2(
      target.look[0] - p.root.position.x,
      target.look[1] - p.root.position.z,
    );
    if (!walking) this.turn(p, facing, dt);
    this.pose(p, time, { walk: walking ? 1 : 0 });
    return (
      walking ||
      Math.abs(
        Math.atan2(
          Math.sin(p.root.rotation.y - facing),
          Math.cos(p.root.rotation.y - facing),
        ),
      ) > 0.04
    );
  }
  customer(s, time, dt) {
    const p = this.people.customer,
      v = s.visitor;
    p.root.visible =
      this.room === "shop" && !this.inspecting && v.phase !== "absent";
    const progress = clamp(
      (s.clock - v.phaseAt) / VISIT_DURATIONS[v.phase],
      0,
      1,
    );
    const sample = sampleRoute(visitorRoute(v), progress),
      moving = ["enter", "checkout", "leave"].includes(v.phase);
    const d = Math.hypot(
      sample.x - p.root.position.x,
      sample.z - p.root.position.z,
    );
    p.distance += Math.min(d, 0.15);
    p.root.position.set(sample.x, 0, sample.z);
    this.turn(p, moving ? sample.heading : Math.PI, dt);
    this.pose(p, time, { walk: moving ? 1 : 0, guard: moving ? 0 : 0.2 });
  }
  update(s, draft, dt, battleOverride = null) {
    if (!this.ready) return;
    this.time += Math.min(dt, 0.1);
    this.replaying = !!battleOverride;
    const time = this.time,
      battle = battleOverride || s.battle;
    this.refreshItems(s, draft, battle);
    this.sparks.visible =
      this.room === "forge" && !this.inspecting && !this.reduced;
    if (!this.inspecting) {
      if (this.room === "forge") {
        const job = s.queue[0],
          progress = job
            ? clamp((s.clock - job.startedAt) / job.duration, 0, 1)
            : 0;
        const station = job
          ? progress < 0.22
            ? "heat"
            : progress > 0.8
              ? "finish"
              : "hammer"
          : "idle";
        const walking = this.walk(this.people.smith, station, dt, time);
        if (!walking)
          this.pose(this.people.smith, time, {
            hammer: station === "hammer",
            guard: station === "finish" ? 0.4 : 0,
          });
        this.people.tomas.root.rotation.y = -2.687;
        this.pose(this.people.tomas, time + 4, { guard: 0.3 });
        this.people.tomas.joints.Shoulder_R.rotation.x =
          -0.9 + (this.reduced ? 0 : Math.sin(time * 2.2) * 0.08);
        this.people.tomas.joints.Elbow_R.rotation.x = -0.65;
        this.people.tomas.joints.Shoulder_L.rotation.x = -0.85;
        // Heating is temporary work feedback; the finished metal keeps its own appearance.
        this.workpiece.traverse((o) =>
          materialEach(o, (m) => {
            if (m.name === "Blade metal") {
              m.emissive.setHex(0xff3b05);
              m.emissiveIntensity = job
                ? Math.max(0, 0.72 - progress) * 0.7
                : 0;
            }
          }),
        );
        this.fire.children.forEach((f, i) => {
          f.scale.y = 0.23 + (this.reduced ? 0 : Math.sin(time * 5 + i) * 0.06);
          f.position.y =
            0.7 + (this.reduced ? 0 : Math.sin(time * 4 + i) * 0.025);
        });
        this.fireLight.intensity =
          13 + (this.reduced ? 0 : Math.sin(time * 7) * 1.1);
        for (let i = 0; i < 22; i++) {
          const cycle = (time * 0.35 + i * 0.123) % 1;
          this.sparkPositions[i * 3] =
            -2.2 + Math.sin(i * 9.2) * 0.29 + Math.sin(cycle * 5 + i) * 0.07;
          this.sparkPositions[i * 3 + 1] = 0.54 + cycle * 0.62;
          this.sparkPositions[i * 3 + 2] = -1 + Math.cos(i * 3.3) * 0.21;
        }
        this.sparkGeometry.attributes.position.needsUpdate = true;
      } else if (this.room === "shop") {
        this.customer(s, time, dt);
        this.people.perrin.root.rotation.y = 0.2;
        this.pose(this.people.perrin, time + 3, { guard: 0.17 });
      } else {
        const units = battle?.units || [
          { id: "mara", x: -1.65, z: 0, hp: 1 },
          { id: "renn", x: -2.65, z: -1.1, hp: 1 },
          { id: "warden", x: 1.65, z: 0, hp: 1 },
          { id: "rook", x: 2.65, z: 1.1, hp: 1 },
        ];
        const fraction = battleOverride
          ? 0
          : clamp((s.clock - (battle?.tickAt || s.clock)) / 50, 0, 1);
        for (const u of units) {
          const p = this.people[u.id],
            x =
              battle?.status === "live" && Number.isFinite(u.prevX)
                ? lerp(u.prevX, u.x, fraction)
                : u.x,
            z =
              battle?.status === "live" && Number.isFinite(u.prevZ)
                ? lerp(u.prevZ, u.z, fraction)
                : u.z;
          p.distance += Math.min(
            0.12,
            Math.hypot(x - p.root.position.x, z - p.root.position.z),
          );
          p.root.position.set(x, 0, z);
          const target = units.find((t) => t.id === u.target);
          this.turn(
            p,
            target
              ? Math.atan2(target.x - x, target.z - z)
              : x < 0
                ? Math.PI / 2
                : -Math.PI / 2,
            dt,
          );
          const age = battle ? battle.tick - u.phaseAt + fraction : 0;
          this.pose(p, time, {
            walk:
              (u.moving || (battle?.version === 1 && u.phase === "approach")) &&
              battle?.status === "live"
                ? 1
                : 0,
            guard: 0.75,
            attackPhase: battle?.status === "live" ? u.phase : "ready",
            attackAge: age,
            legacy: battle?.version === 1,
            hurt:
              battle?.status === "live"
                ? Math.max(0, 1 - (battle.tick - u.hurtAt + fraction) / 7)
                : 0,
            block: battle?.status === "live" && battle.tick - u.blockAt < 10,
            yielded: u.hp <= 0,
          });
        }
        if (this.follow) {
          const p = this.people.renn.root.position;
          this.controls.target.lerp(new T.Vector3(p.x, 0.8, p.z), 0.05);
        }
      }
    }
    this.atmosphere.root.visible = !this.inspecting;
    this.atmosphere.update(
      this.room,
      time,
      this.reduced,
      battle,
      battleOverride
        ? 0
        : clamp((s.clock - (battle?.tickAt || s.clock)) / 50, 0, 1),
      this.people,
      this.hammerImpactAt,
    );
    this.controls.update();
    this.drawPreview();
    this.renderer.render(this.scene, this.camera);
  }
  stats() {
    const i = this.renderer.info;
    return `${i.render.calls} draw calls · ${Math.round(i.render.triangles / 1000)}k triangles · ${i.memory.textures} textures · Three.js ${T.REVISION}`;
  }
  dispose() {
    this.atmosphere.dispose();
    this.previewObserver?.disconnect();
    this.previewAbort?.abort();
    this.releaseItem(this.previewItem);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.envTarget.dispose();
  }
}
