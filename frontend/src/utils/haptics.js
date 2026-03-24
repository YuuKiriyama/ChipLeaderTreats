/**
 * Mobile haptic feedback (Vibration API). No-op on unsupported / desktop.
 */

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Short tap feedback — primary actions, toggles */
export function hapticLight() {
  if (canVibrate()) navigator.vibrate(12);
}

/** Stronger feedback — success, copy */
export function hapticSuccess() {
  if (canVibrate()) navigator.vibrate([15, 40, 15]);
}

/** Error / warning */
export function hapticWarning() {
  if (canVibrate()) navigator.vibrate([20, 30, 20, 30, 20]);
}
