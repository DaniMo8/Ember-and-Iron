/* Original modal chamber scores and procedural foley. No samples or network requests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EIHouseAudio = factory();
})(globalThis, function () {
  "use strict";
  const themes = {
    smith: {
      title: "Vellum & Ember",
      bpm: 66,
      root: 50,
      scale: [0, 2, 3, 5, 7, 9, 10],
      chords: [0, 3, 5, 4, 0, 5, 3, 4],
      lead: "flute",
      pluck: "lute",
      motif: [4, 2, 1, 0, 2, 4, 5, 3],
      air: 420,
      foley: "hearth",
    },
    mine: {
      title: "Beneath the Mountain",
      bpm: 52,
      root: 40,
      scale: [0, 1, 3, 5, 7, 8, 10],
      chords: [0, 1, 0, 5, 3, 0, 1, 0],
      lead: "glass",
      pluck: "harp",
      motif: [0, 4, 1, 0, 6, 4, 2, 1],
      air: 180,
      foley: "drip",
    },
    smelter: {
      title: "River of Bronze",
      bpm: 60,
      root: 43,
      scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, 5, 3, 4, 0, 3, 5, 4],
      lead: "bowed",
      pluck: "dulcimer",
      motif: [0, 2, 4, 3, 2, 1, 4, 0],
      air: 580,
      foley: "bellows",
    },
    forge: {
      title: "The Hammer’s Measure",
      bpm: 82,
      root: 50,
      scale: [0, 2, 3, 5, 7, 8, 10],
      chords: [0, 3, 0, 4, 5, 3, 4, 0],
      lead: "dulcimer",
      pluck: "lute",
      motif: [0, 4, 2, 4, 5, 4, 2, 1],
      air: 820,
      foley: "hammer",
    },
    shop: {
      title: "A Brass Bell at the Door",
      bpm: 76,
      root: 55,
      scale: [0, 2, 4, 5, 7, 9, 11],
      chords: [0, 4, 5, 3, 0, 5, 3, 4],
      lead: "flute",
      pluck: "lute",
      motif: [2, 4, 5, 4, 2, 1, 0, 2],
      air: 1250,
      foley: "wood",
    },
    arena: {
      title: "Banners in the Dust",
      bpm: 90,
      root: 45,
      scale: [0, 2, 3, 5, 7, 9, 10],
      chords: [0, 0, 3, 4, 5, 3, 4, 0],
      lead: "horn",
      pluck: "dulcimer",
      motif: [0, 4, 0, 2, 5, 4, 2, 0],
      air: 680,
      foley: "drum",
    },
    employees: {
      title: "The Long Table",
      bpm: 68,
      root: 53,
      scale: [0, 2, 4, 5, 7, 9, 10],
      chords: [0, 3, 0, 4, 5, 3, 4, 0],
      lead: "flute",
      pluck: "lute",
      motif: [0, 2, 4, 5, 4, 2, 1, 0],
      air: 320,
      foley: "hearth",
    },
    legacy: {
      title: "Names in Starlight",
      bpm: 48,
      root: 50,
      scale: [0, 2, 4, 7, 9],
      chords: [0, 3, 1, 4, 0, 2, 3, 0],
      lead: "glass",
      pluck: "harp",
      motif: [0, 2, 4, 3, 2, 1, 3, 0],
      air: 260,
      foley: "shimmer",
    },
  };
  const degree = (theme, n) =>
    theme.root +
    theme.scale[
      ((n % theme.scale.length) + theme.scale.length) % theme.scale.length
    ] +
    12 * Math.floor(n / theme.scale.length);
  function score(room) {
    const t = themes[room] || themes.smith,
      events = [],
      beat = 60 / t.bpm;
    // Four eight-bar phrases: statement, answer, a higher middle phrase, return.
    for (let bar = 0; bar < 32; bar++) {
      const chord = t.chords[bar % 8],
        phrase = Math.floor(bar / 8),
        start = bar * 4;
      for (const d of [chord, chord + 2, chord + 4])
        events.push({
          at: start * beat,
          duration: 3.85 * beat,
          midi: degree(t, d),
          voice: "pad",
          gain: 0.024,
        });
      events.push({
        at: start * beat,
        duration: 3.5 * beat,
        midi: degree(t, chord) - 12,
        voice: "bass",
        gain: 0.052,
      });
      for (let i = 0; i < 8; i++)
        events.push({
          at: (start + i * 0.5) * beat,
          duration: 1.8,
          midi: degree(t, chord + [0, 2, 4, 2, 0, 4, 2, 4][i]) + 12,
          voice: t.pluck,
          gain: room === "mine" ? 0.023 : 0.038,
        });
      const rhythm =
        room === "mine" || room === "legacy" ? [0.5, 2.5] : [0, 1.5, 2.5, 3.25];
      rhythm.forEach((offset, i) => {
        if ((bar % 8 === 7 && i > 1) || (bar % 4 === 3 && i === 3)) return;
        const d = t.motif[(bar * 2 + i) % 8] + (phrase === 2 ? 2 : 0);
        events.push({
          at: (start + offset) * beat,
          duration: (i === rhythm.length - 1 ? 1.8 : 1.15) * beat,
          midi: degree(t, d) + 12,
          voice: t.lead,
          gain: 0.052,
        });
      });
      if (room === "arena")
        for (const offset of [0, 2, 3.5])
          events.push({
            at: (start + offset) * beat,
            duration: 0.5,
            voice: "drum",
            gain: offset === 0 ? 0.14 : 0.065,
          });
      if (bar % 2 === 0)
        events.push({
          at: (start + 1) * beat,
          duration: 0.5,
          voice: "foley",
          effect: t.foley,
          gain: 0.1,
        });
    }
    return {
      room: themes[room] ? room : "smith",
      title: t.title,
      duration: 128 * beat,
      events: events.sort((a, b) => a.at - b.at),
    };
  }
  const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
  function seeded(seed) {
    let n = seed >>> 0;
    return () => {
      n = (1664525 * n + 1013904223) >>> 0;
      return n / 4294967296;
    };
  }
  class Soundscape {
    constructor() {
      this.context = null;
      this.room = "smith";
      this.settings = { master: 0.6, music: 0.4, effects: 0.45, muted: false };
      this.visible = true;
      this.unlocked = false;
      this.layer = null;
      this.timer = null;
      this.buffers = new Map();
      this.effectAt = 0;
    }
    setVolumes(settings) {
      Object.assign(this.settings, settings);
      this.applyVolumes();
    }
    connect(context) {
      this.context = context;
      const c = context;
      this.master = c.createGain();
      this.music = c.createGain();
      this.effects = c.createGain();
      this.music.connect(this.master);
      this.effects.connect(this.master);
      this.master.gain.value = this.settings.muted ? 0 : this.settings.master;
      this.music.gain.value = this.settings.music;
      this.effects.gain.value = this.settings.effects;
      // A quiet, original stereo room impulse gives synthesized instruments natural space.
      const reverb = c.createConvolver(),
        wet = c.createGain(),
        impulse = c.createBuffer(2, c.sampleRate * 1.8, c.sampleRate),
        rand = seeded(7351);
      for (let ch = 0; ch < 2; ch++) {
        const d = impulse.getChannelData(ch);
        for (let i = 0; i < d.length; i++)
          d[i] =
            (rand() * 2 - 1) *
            Math.exp((-7 * i) / d.length) *
            Math.min(1, i / 250);
      }
      reverb.buffer = impulse;
      wet.gain.value = 0.17;
      this.music.connect(reverb);
      reverb.connect(wet);
      wet.connect(this.master);
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -14;
      limiter.knee.value = 10;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.006;
      limiter.release.value = 0.2;
      this.master.connect(limiter);
      limiter.connect(c.destination);
      this.applyVolumes();
    }
    applyVolumes() {
      if (!this.context) return;
      const t = this.context.currentTime;
      this.master.gain.setTargetAtTime(
        this.settings.muted ? 0 : this.settings.master,
        t,
        0.06,
      );
      this.music.gain.setTargetAtTime(this.settings.music, t, 0.06);
      this.effects.gain.setTargetAtTime(this.settings.effects, t, 0.06);
    }
    async unlock() {
      if (!this.context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return false;
        this.connect(new Audio());
      }
      this.unlocked = true;
      try {
        if (this.visible) await this.context.resume();
      } catch {
        return false;
      }
      if (!this.layer) this.startRoom();
      return this.context.state === "running";
    }
    setRoom(room) {
      const next = themes[room] ? room : "smith";
      if (next === this.room) return;
      this.room = next;
      if (this.unlocked) this.startRoom();
    }
    setVisible(visible) {
      this.visible = visible;
      if (!this.context) return;
      if (visible && this.unlocked) {
        this.context.resume().catch(() => {});
        if (!this.layer) this.startRoom();
      } else this.context.suspend().catch(() => {});
    }
    startRoom() {
      const c = this.context;
      if (!c) return;
      const now = c.currentTime;
      if (this.layer) {
        const old = this.layer;
        old.music.gain.cancelScheduledValues(now);
        old.effects.gain.cancelScheduledValues(now);
        old.music.gain.setTargetAtTime(0, now, 0.28);
        old.effects.gain.setTargetAtTime(0, now, 0.28);
        setTimeout(() => this.disposeLayer(old), 1600);
      }
      const layer = {
        music: c.createGain(),
        effects: c.createGain(),
        sources: new Set(),
        score: score(this.room),
        origin: now + 0.08,
        index: 0,
        cycle: 0,
      };
      layer.music.gain.value = 0;
      layer.effects.gain.value = 0;
      layer.music.connect(this.music);
      layer.effects.connect(this.effects);
      layer.music.gain.linearRampToValueAtTime(1, now + 1.1);
      layer.effects.gain.linearRampToValueAtTime(1, now + 1.1);
      this.layer = layer;
      this.air(layer, themes[this.room].air);
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.pump(), 80);
      this.pump();
    }
    pump() {
      if (!this.visible || !this.layer || this.context.state !== "running")
        return;
      const l = this.layer,
        horizon = this.context.currentTime + 0.22;
      let limit = 0;
      while (limit++ < 100) {
        const event = l.score.events[l.index],
          at = l.origin + l.cycle * l.score.duration + event.at;
        if (at > horizon) break;
        if (at >= this.context.currentTime - 0.05)
          this.note(event, Math.max(at, this.context.currentTime), l);
        if (++l.index === l.score.events.length) {
          l.index = 0;
          l.cycle++;
        }
      }
    }
    keep(source, layer) {
      layer.sources.add(source);
      source.onended = () => {
        layer.sources.delete(source);
        source.disconnect();
      };
      return source;
    }
    disposeLayer(layer) {
      for (const source of layer.sources) {
        try {
          source.stop();
        } catch {}
        source.disconnect();
      }
      layer.sources.clear();
      layer.music.disconnect();
      layer.effects.disconnect();
    }
    noise() {
      const c = this.context,
        key = "noise";
      if (this.buffers.has(key)) return this.buffers.get(key);
      const b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate),
        d = b.getChannelData(0),
        rand = seeded(2819);
      let brown = 0;
      for (let i = 0; i < d.length; i++) {
        brown = (brown + 0.025 * (rand() * 2 - 1)) / 1.025;
        d[i] = brown * 4;
      }
      this.buffers.set(key, b);
      return b;
    }
    air(layer, cutoff) {
      const c = this.context,
        s = this.keep(c.createBufferSource(), layer),
        filter = c.createBiquadFilter(),
        g = c.createGain();
      s.buffer = this.noise();
      s.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      g.gain.value = 0.055;
      s.connect(filter);
      filter.connect(g);
      g.connect(layer.effects);
      s.start();
      s.onended = () => {
        layer.sources.delete(s);
        s.disconnect();
        filter.disconnect();
        g.disconnect();
      };
    }
    pluck(midi, voice) {
      const key = voice + ":" + midi;
      if (this.buffers.has(key)) return this.buffers.get(key);
      const c = this.context,
        seconds = voice === "harp" ? 3.5 : 2.4,
        b = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate),
        d = b.getChannelData(0),
        period = Math.max(2, Math.round(c.sampleRate / freq(midi))),
        ring = new Float32Array(period),
        rand = seeded(midi * 471 + (voice === "lute" ? 11 : 29));
      for (let i = 0; i < period; i++)
        ring[i] =
          (rand() * 2 - 1) * 0.65 + Math.sin((i / period) * Math.PI * 2) * 0.35;
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const p = i % period,
          v = ring[p];
        ring[p] = (v + last) * 0.5 * (voice === "dulcimer" ? 0.996 : 0.998);
        last = v;
        d[i] = v * Math.min(1, i / (c.sampleRate * 0.004));
      }
      if (this.buffers.size > 80)
        this.buffers.delete(this.buffers.keys().next().value);
      this.buffers.set(key, b);
      return b;
    }
    note(e, at, layer) {
      if (e.voice === "foley") {
        this.foley(e.effect, at, layer, e.gain);
        return;
      }
      if (e.voice === "drum") {
        this.foley("drum", at, layer, e.gain, true);
        return;
      }
      const c = this.context,
        g = c.createGain(),
        duration = e.duration;
      g.connect(layer.music);
      if (["lute", "harp", "dulcimer"].includes(e.voice)) {
        const s = this.keep(c.createBufferSource(), layer);
        s.buffer = this.pluck(e.midi, e.voice);
        s.connect(g);
        g.gain.setValueAtTime(e.gain, at);
        g.gain.setTargetAtTime(0.0001, at + Math.min(duration, 1.8), 0.18);
        s.start(at);
        s.stop(at + s.buffer.duration);
        s.onended = () => {
          layer.sources.delete(s);
          s.disconnect();
          g.disconnect();
        };
        return;
      }
      const soft = ["pad", "bowed", "bass"].includes(e.voice),
        attack = soft ? 0.35 : 0.09;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(e.gain, at + attack);
      g.gain.setTargetAtTime(
        0.0001,
        at + Math.max(attack, duration * 0.68),
        soft ? 0.45 : 0.24,
      );
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value =
        e.voice === "horn" ? 900 : e.voice === "pad" ? 620 : 2400;
      filter.connect(g);
      const partials =
        e.voice === "glass"
          ? [
              [1, 1],
              [2.01, 0.23],
              [3.98, 0.08],
            ]
          : e.voice === "flute"
            ? [
                [1, 1],
                [2, 0.15],
                [3, 0.04],
              ]
            : soft
              ? [
                  [1, 0.65],
                  [1.003, 0.35],
                ]
              : [
                  [1, 1],
                  [2, 0.2],
                ];
      let alive = partials.length;
      partials.forEach(([ratio, level]) => {
        const o = this.keep(c.createOscillator(), layer),
          v = c.createGain();
        o.type = soft ? "triangle" : "sine";
        o.frequency.value = freq(e.midi) * ratio;
        v.gain.value = level;
        o.connect(v);
        v.connect(filter);
        o.start(at);
        o.stop(at + duration + 2);
        o.onended = () => {
          layer.sources.delete(o);
          o.disconnect();
          v.disconnect();
          if (--alive === 0) {
            filter.disconnect();
            g.disconnect();
          }
        };
      });
    }
    foley(id, at, layer = this.layer, volume = 0.14, musical = false) {
      if (!layer) return;
      const c = this.context,
        g = c.createGain(),
        filter = c.createBiquadFilter();
      g.connect(musical ? layer.music : layer.effects);
      if (["hearth", "bellows", "pour", "wood"].includes(id)) {
        const source = this.keep(c.createBufferSource(), layer);
        source.buffer = this.noise();
        filter.type = "bandpass";
        filter.frequency.value =
          id === "hearth" ? 1700 : id === "wood" ? 850 : 480;
        filter.Q.value = 0.5;
        source.connect(filter);
        filter.connect(g);
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(volume, at + 0.04);
        g.gain.exponentialRampToValueAtTime(
          0.0001,
          at + (id === "bellows" || id === "pour" ? 1.4 : 0.3),
        );
        source.start(at);
        source.stop(at + 1.6);
        source.onended = () => {
          layer.sources.delete(source);
          source.disconnect();
          filter.disconnect();
          g.disconnect();
        };
        return;
      }
      const notes =
        id === "coin" || id === "chime"
          ? [1175, 1568, 2093]
          : id === "shimmer"
            ? [523.25, 783.99, 1046.5]
            : id === "hammer"
              ? [370, 1017, 1890]
              : id === "pick"
                ? [820, 1540]
                : id === "drip"
                  ? [880, 1763]
                  : id === "drum"
                    ? [90, 135]
                    : [440];
      let alive = notes.length;
      notes.forEach((hz, i) => {
        const o = this.keep(c.createOscillator(), layer),
          env = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(hz, at);
        if (id === "drum" || id === "drip")
          o.frequency.exponentialRampToValueAtTime(hz * 0.45, at + 0.17);
        env.gain.setValueAtTime(0, at);
        env.gain.linearRampToValueAtTime(volume / (i + 1), at + 0.005);
        env.gain.exponentialRampToValueAtTime(
          0.0001,
          at + (id === "shimmer" ? 2 : id === "chime" ? 0.8 : 0.28),
        );
        o.connect(env);
        env.connect(g);
        g.gain.value = 1;
        o.start(at + i * 0.017);
        o.stop(at + 2.4);
        o.onended = () => {
          layer.sources.delete(o);
          o.disconnect();
          env.disconnect();
          if (--alive === 0) {
            g.disconnect();
            filter.disconnect();
          }
        };
      });
    }
    effect(id) {
      if (
        !this.context ||
        !this.visible ||
        !this.unlocked ||
        !this.layer ||
        this.settings.muted
      )
        return;
      const now = this.context.currentTime;
      if (now - this.effectAt < 0.06) return;
      this.effectAt = now;
      this.foley(id, now, this.layer, id === "ui" ? 0.022 : 0.12);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.layer) {
        this.disposeLayer(this.layer);
        this.layer = null;
      }
      this.context?.suspend().catch(() => {});
    }
  }
  async function renderPreview(room, seconds = 12, settings = {}) {
    const length = Math.max(1, Math.min(60, seconds)),
      context = new OfflineAudioContext(2, Math.ceil(24000 * length), 24000),
      player = new Soundscape();
    player.setVolumes(settings);
    player.connect(context);
    const layer = {
      music: player.music,
      effects: player.effects,
      sources: new Set(),
    };
    player.air(layer, (themes[room] || themes.smith).air);
    for (const event of score(room).events) {
      if (event.at >= length) break;
      player.note(event, event.at, layer);
    }
    return context.startRendering();
  }
  return { themes, score, Soundscape, renderPreview };
});
