// A cut through the scene: the house opened from the top, a level at a time. It imports nothing
// and names no global.

/**
 * The solids that show at a cut: the scene's own, in their order. 'all' shows every one. A level
 * - a height in metres above sea level, one of the scene's `levels` - shows each solid whose
 * `floor` is at that level or below it, and no other. What shows, shows whole, however far it
 * rises above the level: nothing is cut in two, and nothing is faded.
 */
export function shown(scene, cut) {
  return scene.solids.filter((solid) => cut === 'all' || solid.floor <= cut);
}

/**
 * The parts that show at a cut: the scene's own, in their order. 'all' shows every one. A level
 * shows each part whose `floor` is at that level or below it - but not what is `over` a thing
 * that stands on that very level. So the storey the cut stops at has no roof, and is looked
 * into from above; what stands lower keeps its own. A part shows whole or not at all, too.
 */
export function partsShown(scene, cut) {
  const open = (part) => part.over === true && part.floor === cut;
  return scene.parts.filter((part) => cut === 'all' || (part.floor <= cut && !open(part)));
}
