const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
export function armIK(forward, height) {
  const upper = 0.22,
    lower = Math.hypot(0.288, 0.025),
    d = clamp(Math.hypot(forward, height), 0.08, upper + lower - 0.001);
  const bend = -Math.acos(
    clamp((d * d - upper * upper - lower * lower) / (2 * upper * lower), -1, 1),
  );
  const shoulder =
    Math.atan2(-forward, -height) -
    Math.atan2(lower * Math.sin(bend), upper + lower * Math.cos(bend));
  return { shoulder, elbow: bend + Math.atan2(0.025, 0.288) };
}
export function hammerStroke(time) {
  const cycle = (((time / 1.45) % 1) + 1) % 1;
  const lift =
    cycle < 0.48
      ? smooth(cycle / 0.48)
      : cycle < 0.59
        ? 1
        : cycle < 0.77
          ? 1 - smooth((cycle - 0.59) / 0.18)
          : 0;
  const tilt = lift * 1.3,
    headForward = 0.82 - lift * 0.48,
    headHeight = 1.227 + lift * 0.62;
  const forward = headForward - 0.352 * Math.cos(tilt),
    height = headHeight - 0.352 * Math.sin(tilt) - 1.14;
  const arm = armIK(forward, height);
  return {
    ...arm,
    wrist: Math.PI / 2 - tilt - arm.shoulder - arm.elbow,
    lift,
    cycle,
    contact: cycle >= 0.765 && cycle < 0.82,
    headForward,
    headHeight,
  };
}
export function attackMotion(phase, age, windup = 14, strike = 8) {
  if (phase === "windup")
    return { pull: smooth(age / windup), thrust: 0, recovery: 0 };
  if (phase === "strike")
    return {
      pull: 1 - smooth(age / 3),
      thrust:
        age <= 3
          ? smooth(age / 3)
          : 1 - 0.12 * smooth((age - 3) / (strike - 3)),
      recovery: 0,
    };
  if (phase === "recover")
    return {
      pull: 0,
      thrust: 0.88 * (1 - smooth(age / 17)),
      recovery: smooth(age / 17),
    };
  return { pull: 0, thrust: 0, recovery: 0 };
}
