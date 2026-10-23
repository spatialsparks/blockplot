// The frame of the 3D view, said once: where a place of the plot lies on the stage. The scene is
// in metres of the plot's own frame - x down the plot, y across it, h above sea level - and
// three.js has y for up. It imports nothing, and names no global.

/**
 * The frame of a scene: what turns a place of the plot, `[x, y, h]`, into the place of three.js
 * it is drawn at, `[x, y, z]`. The plot's x, y and height become three.js's x, -z and y: a turn
 * and no mirror image, so that from above, with x to the right, the plot's y runs up the picture
 * as it does in the top view. A height is drawn from the scene's lowest point, not from sea
 * level: the floor of the stage, y = 0, is the lowest that the ground or a thing of it reaches.
 *
 * Its `back` is the way back: the place of the plot that lies at a place of the stage. What is
 * kept of the stage for a later page is kept in the plot's frame, for that page's stage has a
 * floor of its own.
 */
export function frameOf(scene) {
  const lowest = scene.box.min[2];
  const place = ([x, y, h]) => [x, h - lowest, -y];
  place.back = ([x, y, z]) => [x, -z, y + lowest];
  return place;
}
