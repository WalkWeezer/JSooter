export type MaskDef = {
  id: string;
  nameKey: string;
  descKey: string;
  costImpulses: number;
  perk: 'dash' | 'silencer' | 'vision' | 'none';
};

export const MASKS: MaskDef[] = [
  {
    id: 'iskra',
    nameKey: 'masks.iskra_name',
    descKey: 'masks.iskra_desc',
    costImpulses: 0,
    perk: 'dash',
  },
  {
    id: 'glushitel',
    nameKey: 'masks.glushitel_name',
    descKey: 'masks.glushitel_desc',
    costImpulses: 40,
    perk: 'silencer',
  },
  {
    id: 'cassette',
    nameKey: 'masks.cassette_name',
    descKey: 'masks.cassette_desc',
    costImpulses: 60,
    perk: 'vision',
  },
];

export function getMask(id: string): MaskDef {
  return MASKS.find((m) => m.id === id) || MASKS[0];
}
