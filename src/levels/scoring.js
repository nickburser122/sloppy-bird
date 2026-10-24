import { tuning } from '../config/tuning.js';

export function computeStars({ collected, total, retries, cheated }) {
  if (cheated) return 1;
  let stars = 1;
  if (total > 0 && collected / total >= tuning.scoring.collectRatio) stars++;
  if (retries === 0) stars++;
  return stars;
}
