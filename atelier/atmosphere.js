import * as T from "three";

// Ambient motion and transient combat cues never alter the simulation.
export class Atmosphere {
  constructor(scene) {
    this.root = new T.Group();
    scene.add(this.root);
    this.cloth = [];
    this.resources = new Set();
    const own = (r) => {
      this.resources.add(r);
      return r;
    };
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d"),
      gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(215,207,191,.30)");
    gradient.addColorStop(0.45, "rgba(176,173,164,.12)");
    gradient.addColorStop(1, "rgba(140,140,140,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const smokeTexture = own(new T.CanvasTexture(canvas));
    this.smoke = Array.from({ length: 5 }, () => {
      const sprite = new T.Sprite(
        own(
          new T.SpriteMaterial({
            map: smokeTexture,
            transparent: true,
            depthWrite: false,
            opacity: 0.35,
          }),
        ),
      );
      this.root.add(sprite);
      return sprite;
    });
    const dustGeometry = own(new T.BufferGeometry());
    this.dustPositions = new Float32Array(32 * 3);
    dustGeometry.setAttribute(
      "position",
      new T.BufferAttribute(this.dustPositions, 3),
    );
    this.dust = new T.Points(
      dustGeometry,
      own(
        new T.PointsMaterial({
          color: 0xd9c29a,
          size: 0.013,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        }),
      ),
    );
    this.root.add(this.dust);
    const ringGeometry = own(new T.RingGeometry(0.29, 0.305, 40));
    this.ripples = Array.from({ length: 3 }, () => {
      const mesh = new T.Mesh(
        ringGeometry,
        own(
          new T.MeshBasicMaterial({
            color: 0xa5c3bb,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            side: T.DoubleSide,
          }),
        ),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(-2.65, 0.821, 1.41);
      this.root.add(mesh);
      return mesh;
    });
    this.markers = Array.from({ length: 4 }, (_, i) => {
      const mesh = new T.Mesh(
        own(new T.RingGeometry(0.36, 0.383, 40)),
        own(
          new T.MeshBasicMaterial({
            color: i < 2 ? 0x819f98 : 0xad7968,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            side: T.DoubleSide,
          }),
        ),
      );
      mesh.rotation.x = -Math.PI / 2;
      this.root.add(mesh);
      return mesh;
    });
    this.labels = Array.from({ length: 8 }, () => {
      const sprite = new T.Sprite(
        own(
          new T.SpriteMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
          }),
        ),
      );
      sprite.renderOrder = 10;
      this.root.add(sprite);
      return { sprite, key: null, texture: null };
    });
    this.sparkGeometry = own(new T.BufferGeometry());
    this.sparkPositions = new Float32Array(14 * 3);
    this.sparkGeometry.setAttribute(
      "position",
      new T.BufferAttribute(this.sparkPositions, 3),
    );
    this.sparks = new T.Points(
      this.sparkGeometry,
      own(
        new T.PointsMaterial({
          color: 0xffd08a,
          size: 0.036,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        }),
      ),
    );
    this.root.add(this.sparks);
  }
  register(room, asset) {
    asset.traverse((o) => {
      if (o.isMesh && o.userData.ambient === "cloth") {
        o.geometry = o.geometry.clone();
        this.resources.add(o.geometry);
        const position = o.geometry.attributes.position,
          original = position.array.slice();
        let top = -Infinity,
          bottom = Infinity;
        for (let i = 0; i < position.count; i++) {
          top = Math.max(top, position.getY(i));
          bottom = Math.min(bottom, position.getY(i));
        }
        this.cloth.push({ room, position, original, top, bottom });
      }
    });
  }
  update(room, time, reduced, battle, fraction, people, hammerImpactAt) {
    for (const c of this.cloth) {
      if (c.room !== room) continue;
      for (let i = 0; i < c.position.count; i++) {
        const x = c.original[i * 3],
          y = c.original[i * 3 + 1],
          z = c.original[i * 3 + 2],
          weight = (c.top - y) / Math.max(0.01, c.top - c.bottom);
        c.position.setZ(
          i,
          z +
            (reduced
              ? 0
              : Math.sin(time * 1.2 + x * 2.3 + y * 3) * 0.022 * weight),
        );
      }
      c.position.needsUpdate = true;
    }
    this.dust.visible = !reduced;
    for (let i = 0; i < 32; i++) {
      this.dustPositions[i * 3] =
        Math.sin(i * 7.31) * 3.1 + Math.sin(time * 0.09 + i) * 0.12;
      this.dustPositions[i * 3 + 1] = 0.3 + ((i * 0.317 + time * 0.019) % 2.4);
      this.dustPositions[i * 3 + 2] =
        Math.cos(i * 3.27) * 2.2 + Math.sin(time * 0.08 + i) * 0.1;
    }
    this.dust.geometry.attributes.position.needsUpdate = true;
    this.smoke.forEach((s, i) => {
      s.visible = room === "forge" && !reduced;
      const t = (time * 0.12 + i * 0.2) % 1;
      s.position.set(
        -2.2 + Math.sin(t * 4 + i) * 0.065,
        1.05 + t * 1.18,
        -1.1 - t * 0.2,
      );
      s.scale.setScalar(0.25 + t * 0.38);
      s.material.opacity = Math.sin(t * Math.PI) * 0.34;
    });
    this.ripples.forEach((r, i) => {
      r.visible = room === "forge" && !reduced;
      const t = (time * 0.18 + i / 3) % 1;
      r.scale.setScalar(0.12 + t * 0.68);
      r.material.opacity = (1 - t) * 0.16;
    });
    this.markers.forEach((m, i) => {
      const u = battle?.units[i],
        id = u?.id || ["mara", "renn", "warden", "rook"][i],
        p = people[id];
      m.visible = room === "arena";
      if (p) m.position.set(p.root.position.x, 0.087, p.root.position.z);
      m.material.opacity = u?.hp <= 0 ? 0.1 : 0.48;
    });
    const recent =
      room === "arena" && battle?.status === "live"
        ? battle.events
            .filter((e) => e.type === "hit" && battle.tick - e.tick < 20)
            .slice(-8)
        : [];
    this.labels.forEach((label, i) => {
      const e = recent[i];
      label.sprite.visible = !!e;
      if (!e) return;
      const key = `${battle.id}:${e.tick}:${e.actor}:${e.damage}:${e.block}:${e.crit}`;
      if (label.key !== key) {
        label.texture?.dispose();
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 80;
        const ctx = c.getContext("2d");
        ctx.textAlign = "center";
        ctx.font = "bold 32px Georgia";
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#161c1d";
        ctx.fillStyle = e.block ? "#b5d5cf" : e.crit ? "#efc47e" : "#f4e5ca";
        const text = `${Math.ceil(e.damage)}${e.block ? " · BLOCK" : e.crit ? " !" : ""}`;
        ctx.strokeText(text, 128, 46);
        ctx.fillText(text, 128, 46);
        label.texture = new T.CanvasTexture(c);
        label.sprite.material.map = label.texture;
        label.sprite.material.needsUpdate = true;
        label.key = key;
      }
      const p = people[e.target].root.position,
        age = (battle.tick - e.tick + fraction) / 20;
      label.sprite.position.set(p.x, 1.95 + age * 0.38, p.z);
      label.sprite.scale.set(1.15, 0.36, 1);
      label.sprite.material.opacity = 1 - age;
    });
    const hit = recent.at(-1),
      hitAge = hit ? (battle.tick - hit.tick + fraction) / 20 : 10;
    const forgeAge = time - (hammerImpactAt ?? -10),
      forge = room === "forge" && forgeAge < 0.23;
    const combat = room === "arena" && hitAge < 0.24;
    this.sparks.visible = !reduced && (forge || combat);
    if (this.sparks.visible) {
      const p = combat ? people[hit.target].root.position : null,
        age = combat ? hitAge : forgeAge;
      const x = p ? p.x : -1.09,
        y = p ? 1.05 : 1.14,
        z = p ? p.z : 0.28;
      for (let i = 0; i < 14; i++) {
        this.sparkPositions[i * 3] = x + Math.sin(i * 4.61) * age * 1.6;
        this.sparkPositions[i * 3 + 1] =
          y + Math.sin(i * 2.3) * age * 0.9 - age * age * 2;
        this.sparkPositions[i * 3 + 2] = z + Math.cos(i * 4.61) * age * 1.6;
      }
      this.sparks.material.opacity = 1 - age / 0.25;
      this.sparkGeometry.attributes.position.needsUpdate = true;
    }
  }
  dispose() {
    this.labels.forEach((l) => l.texture?.dispose());
    this.resources.forEach((r) => r.dispose());
    this.root.removeFromParent();
  }
}
