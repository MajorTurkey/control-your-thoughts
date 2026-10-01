export const STYLES = [
  {
    id: "photograph",
    index: "01",
    name: "Photograph",
    spare: "Skip realism.",
    directive:
      "A straightforward color photograph taken with a normal lens. Real materials, natural color, unstyled light, sharp where a camera would be sharp. Not a painting, not a cartoon, not a poster, not a render.",
  },
  {
    id: "cinema",
    index: "02",
    name: "Cinema",
    spare: "Skip cinematic.",
    directive:
      "A motion-picture still from a carefully lit scene. Anamorphic framing, shallow focus, practical lights, restrained grain. One shot, not a poster and not a photograph of a screen.",
  },
  {
    id: "field",
    index: "03",
    name: "Field",
    spare: "Skip documentary.",
    directive:
      "A scientific field photograph. Even, honest light, color as the eye would record it, detail held across the subject, the plainness of an instrument record.",
  },
  {
    id: "concept",
    index: "04",
    name: "Concept",
    spare: "Skip concept art.",
    directive:
      "Production concept art painted for a film. Designed forms, painted light, one clear idea, visible brush and value structure. Not a photograph.",
  },
  {
    id: "ink",
    index: "05",
    name: "Ink",
    spare: "Skip illustration.",
    directive:
      "An ink illustration on warm paper. Decisive line, a little wash, lots of unmarked paper. Editorial, not photoreal.",
  },
  {
    id: "miniature",
    index: "06",
    name: "Miniature",
    spare: "Skip 3D render.",
    directive:
      "A close photograph of a physical scale model. Real materials under studio light, shallow macro focus, the smallness visible in how the light falls. Not a digital render.",
  },
  {
    id: "night",
    index: "07",
    name: "Night",
    spare: "Skip moody light.",
    directive:
      "A nighttime photograph. Real darkness, lights that bloom the way a lens blooms, shadow that still holds shape. Not a blue color grade laid over daylight.",
  },
  {
    id: "schematic",
    index: "08",
    name: "Schematic",
    spare: "Skip blueprint.",
    directive:
      "A precise technical drawing on a pale ground. Clean orthographic line, even weight, no photographic texture, no dramatic light. A plate from an engineering folio.",
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
