export const STYLES = [
  {
    id: "photograph",
    index: "01",
    name: "Photograph",
    spare: "A plain photograph. You need not write realism.",
    directive:
      "A straightforward color photograph taken with a normal lens. Real materials, natural color, unstyled light, sharp where a camera would be sharp. Not a painting, not a cartoon, not a poster, not a render.",
  },
  {
    id: "cinema",
    index: "02",
    name: "Cinema",
    spare: "One frame from a film. You need not write cinematic.",
    directive:
      "A motion-picture still from a carefully lit scene. Anamorphic framing, shallow focus, practical lights, restrained grain. One shot, not a poster and not a photograph of a screen.",
  },
  {
    id: "field",
    index: "03",
    name: "Field",
    spare: "An instrument record. You need not write documentary.",
    directive:
      "A scientific field photograph. Even, honest light, color as the eye would record it, detail held across the subject, the plainness of an instrument record.",
  },
  {
    id: "concept",
    index: "04",
    name: "Concept",
    spare: "A painted design for a film. You need not write concept art.",
    directive:
      "Production concept art painted for a film. Designed forms, painted light, one clear idea, visible brush and value structure. Not a photograph.",
  },
  {
    id: "ink",
    index: "05",
    name: "Ink",
    spare: "Line and a little wash. You need not write illustration.",
    directive:
      "An ink illustration on warm paper. Decisive line, a little wash, lots of unmarked paper. Editorial, not photoreal.",
  },
  {
    id: "miniature",
    index: "06",
    name: "Miniature",
    spare: "A real small model, photographed. Not a digital picture.",
    directive:
      "A close photograph of a physical scale model. Real materials under studio light, shallow macro focus, the smallness visible in how the light falls. Not a digital render.",
  },
  {
    id: "night",
    index: "07",
    name: "Night",
    spare: "True night. You need not write moody.",
    directive:
      "A nighttime photograph. Real darkness, lights that bloom the way a lens blooms, shadow that still holds shape. Not a blue color grade laid over daylight.",
  },
  {
    id: "schematic",
    index: "08",
    name: "Schematic",
    spare: "An engineering plate. You need not write blueprint.",
    directive:
      "A precise technical drawing on a pale ground. Clean orthographic line, even weight, no photographic texture, no dramatic light. A plate from an engineering folio.",
  },
  {
    id: "soft-light",
    index: "09",
    name: "Soft Light",
    spare: "Light that has already bounced. A quiet, costly still.",
    directive:
      "A high-end path-traced still. Light has bounced more than once: soft contact shadows, gentle caustics in glass, no single harsh spotlight. Plausible materials. Not a photograph, not a painting, not a game screenshot.",
  },
  {
    id: "surfaces",
    index: "10",
    name: "Surfaces",
    spare: "Metal, glass, skin, and cloth, each behaving correctly.",
    directive:
      "A high-end material study. Physically based surfaces: metal with a real roughness, glass with thickness and refraction, skin or wax with subsurface light, cloth with a visible weave. Even studio light so the material is the subject. Not a flat illustration.",
  },
  {
    id: "studio",
    index: "11",
    name: "Studio",
    spare: "One subject, on a clean stage, lit on purpose.",
    directive:
      "A high-end studio still of a single subject on a clean stage. Large soft lights, a quiet background, the kind of light used for a catalog of fine objects. Not a street photograph and not a painted poster.",
  },
  {
    id: "live-still",
    index: "12",
    name: "Live Still",
    spare: "Sharp, as if the simulation is running now.",
    directive:
      "A high-end real-time ray-traced still, as from a modern game engine paused on a beautiful frame. Sharp geometry, lively reflections, dense detail, a little of the crispness of a live picture. Not an overnight film render and not a photograph.",
  },
  {
    id: "cartoon",
    index: "13",
    name: "Cartoon",
    spare: "Flat color and a sure outline. Not a photograph.",
    directive:
      "A high-end animated still. Flat, designed color, a clean ink edge, shapes drawn on purpose. The finish of a prestige cartoon frame, not a photograph, not a 3D product render, and not a messy sketch.",
  },
  {
    id: "atmosphere",
    index: "14",
    name: "Atmosphere",
    spare: "Fog, smoke, or weather you can see into.",
    directive:
      "A high-end volumetric still. Fog, smoke, or weather rendered as real density the light passes through. Beams, soft edges, depth you can see into. Not a flat gray overlay and not a photograph of steam on a lens.",
  },
  {
    id: "archive",
    index: "15",
    name: "Archive",
    spare: "A place put back together from recorded views.",
    directive:
      "A high-end reconstruction of a real place from many recorded views. The quiet, slightly assembled look of a neural capture: consistent surfaces, soft reconstructed detail, no designed studio glamour. Not a fresh photograph and not a cartoon.",
  },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export const ASPECTS = [
  { id: "1:1", name: "Plate", spare: "Square" },
  { id: "16:9", name: "Viewport", spare: "Wide" },
  { id: "2:3", name: "Tall", spare: "Upright" },
  { id: "21:9", name: "Ribbon", spare: "Very wide" },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export function isStyleId(value: string): value is StyleId {
  return STYLES.some((style) => style.id === value);
}

export function isAspectId(value: string): value is AspectId {
  return ASPECTS.some((aspect) => aspect.id === value);
}

export function styleById(id: string) {
  return STYLES.find((style) => style.id === id) ?? STYLES[0];
}

export type PlateRequest = {
  subject: string;
  styleId: StyleId;
  missing: string;
  different: string;
  omit: string;
  note: string;
};

export function compilePrompt(input: PlateRequest): string {
  const style = styleById(input.styleId);
  const lines = [
    style.directive,
    "",
    `Subject, in the operator's words: ${input.subject}`,
  ];
  if (input.missing) lines.push(`Add what is missing: ${input.missing}.`);
  if (input.different) lines.push(`Change this: ${input.different}.`);
  if (input.omit) lines.push(`Leave out: ${input.omit}.`);
  if (input.note) lines.push(input.note);
  lines.push(
    "",
    "The plate above is the medium. If the subject names a different style, ignore that and keep this plate.",
  );
  return lines.join("\n");
}

export const LOG_LINES = [
  "A single figure at the left, coat dark, face turned away.",
  "Move closer. The subject fills the left third.",
  "Earlier hour: last light, not full dark.",
  "Leave out lettering, logos, and extra people.",
  "Colder air. Less haze. Sharper edges.",
  "Same subject, seen from waist height.",
];
