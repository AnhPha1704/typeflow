/**
 * Pure scoring functions — no React dependencies, easy to unit-test.
 */

/**
 * Calculate Words Per Minute.
 * Uses the standard "1 word = 5 characters" convention.
 */
export function calcWPM(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return Math.round((correctChars / 5) / minutes);
}

/**
 * Calculate accuracy as percentage of correct characters typed.
 * NFC-normalises both strings before comparison (critical for Vietnamese).
 */
export function calcAccuracy(input: string, target: string): number {
  const norm  = input.normalize('NFC');
  const tgt   = target.normalize('NFC');
  if (norm.length === 0) return 0;

  let correct = 0;
  for (let i = 0; i < Math.min(norm.length, tgt.length); i++) {
    if (norm[i] === tgt[i]) correct++;
  }
  return Math.round((correct / norm.length) * 100);
}

/**
 * Count correct characters between normalised input and target.
 */
export function countCorrect(input: string, target: string): number {
  const norm = input.normalize('NFC');
  const tgt  = target.normalize('NFC');
  let correct = 0;
  for (let i = 0; i < Math.min(norm.length, tgt.length); i++) {
    if (norm[i] === tgt[i]) correct++;
  }
  return correct;
}
