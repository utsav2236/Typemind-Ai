// utils/keyMapping.js
// Maps QWERTY keyboard keys to fingers.
// Used by fingerAnalysisService to attribute keystrokes to specific fingers.

/**
 * QWERTY finger mapping.
 * Key → finger name (camelCase).
 */
const KEY_TO_FINGER = {
  // ── Left Pinky ──────────────────────────────────────────────
  '`': 'leftPinky', '1': 'leftPinky', 'q': 'leftPinky', 'a': 'leftPinky',
  'z': 'leftPinky', 'Q': 'leftPinky', 'A': 'leftPinky', 'Z': 'leftPinky',
  '~': 'leftPinky', '!': 'leftPinky',

  // ── Left Ring ────────────────────────────────────────────────
  '2': 'leftRing', 'w': 'leftRing', 's': 'leftRing', 'x': 'leftRing',
  'W': 'leftRing', 'S': 'leftRing', 'X': 'leftRing',
  '@': 'leftRing',

  // ── Left Middle ──────────────────────────────────────────────
  '3': 'leftMiddle', 'e': 'leftMiddle', 'd': 'leftMiddle', 'c': 'leftMiddle',
  'E': 'leftMiddle', 'D': 'leftMiddle', 'C': 'leftMiddle',
  '#': 'leftMiddle',

  // ── Left Index ───────────────────────────────────────────────
  '4': 'leftIndex', '5': 'leftIndex',
  'r': 'leftIndex', 't': 'leftIndex',
  'f': 'leftIndex', 'g': 'leftIndex',
  'v': 'leftIndex', 'b': 'leftIndex',
  'R': 'leftIndex', 'T': 'leftIndex',
  'F': 'leftIndex', 'G': 'leftIndex',
  'V': 'leftIndex', 'B': 'leftIndex',
  '$': 'leftIndex', '%': 'leftIndex',

  // ── Thumbs (space bar) ───────────────────────────────────────
  ' ': 'rightThumb',

  // ── Right Index ──────────────────────────────────────────────
  '6': 'rightIndex', '7': 'rightIndex',
  'y': 'rightIndex', 'u': 'rightIndex',
  'h': 'rightIndex', 'j': 'rightIndex',
  'n': 'rightIndex', 'm': 'rightIndex',
  'Y': 'rightIndex', 'U': 'rightIndex',
  'H': 'rightIndex', 'J': 'rightIndex',
  'N': 'rightIndex', 'M': 'rightIndex',
  '^': 'rightIndex', '&': 'rightIndex',

  // ── Right Middle ─────────────────────────────────────────────
  '8': 'rightMiddle', 'i': 'rightMiddle', 'k': 'rightMiddle',
  'I': 'rightMiddle', 'K': 'rightMiddle',
  '*': 'rightMiddle', ',': 'rightMiddle', '<': 'rightMiddle',

  // ── Right Ring ───────────────────────────────────────────────
  '9': 'rightRing', 'o': 'rightRing', 'l': 'rightRing',
  'O': 'rightRing', 'L': 'rightRing',
  '(': 'rightRing', '.': 'rightRing', '>': 'rightRing',

  // ── Right Pinky ──────────────────────────────────────────────
  '0': 'rightPinky', 'p': 'rightPinky', ';': 'rightPinky',
  '/': 'rightPinky', "'": 'rightPinky',
  'P': 'rightPinky', ':': 'rightPinky',
  ')': 'rightPinky', '?': 'rightPinky', '"': 'rightPinky',
  '[': 'rightPinky', ']': 'rightPinky', '\\': 'rightPinky',
  '{': 'rightPinky', '}': 'rightPinky', '|': 'rightPinky',
  '-': 'rightPinky', '_': 'rightPinky', '=': 'rightPinky', '+': 'rightPinky',

  // ── Special Keys ─────────────────────────────────────────────
  'Tab': 'leftPinky',
  'Enter': 'rightPinky',
  'Backspace': 'rightPinky',
  'Shift': 'leftPinky',         // left Shift (default)
  'ShiftLeft': 'leftPinky',
  'ShiftRight': 'rightPinky',
  'CapsLock': 'leftPinky',
};

/**
 * All valid finger names (used for initializing performance maps).
 */
export const ALL_FINGERS = [
  'leftPinky', 'leftRing', 'leftMiddle', 'leftIndex',
  'rightThumb',
  'rightIndex', 'rightMiddle', 'rightRing', 'rightPinky',
];

/**
 * Returns the finger responsible for typing a given key.
 * @param {string} key - The key character or key name (e.g. "P", "Backspace")
 * @returns {string} Finger name (e.g. "rightPinky") or "unknown"
 */
export const getFingerForKey = (key) => {
  return KEY_TO_FINGER[key] ?? 'unknown';
};

/**
 * Returns all keys assigned to a given finger.
 * @param {string} finger - Finger name (e.g. "rightPinky")
 * @returns {string[]} Array of keys for that finger
 */
export const getKeysForFinger = (finger) => {
  return Object.entries(KEY_TO_FINGER)
    .filter(([, f]) => f === finger)
    .map(([k]) => k);
};

export default KEY_TO_FINGER;
