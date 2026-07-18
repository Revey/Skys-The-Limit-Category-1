export interface MapSettings {
  xMultiplier: number
  yMultiplier: number
  xScalarToAdd: number
  yScalarToAdd: number
}

export const MAP_SETTINGS: Record<string, MapSettings> = {
  ascent: { xMultiplier: 7e-05, yMultiplier: -7e-05, xScalarToAdd: 0.813895, yScalarToAdd: 0.573242 },
  split: { xMultiplier: 7.8e-05, yMultiplier: -7.8e-05, xScalarToAdd: 0.842188, yScalarToAdd: 0.697578 },
  fracture: { xMultiplier: 7.8e-05, yMultiplier: -7.8e-05, xScalarToAdd: 0.556952, yScalarToAdd: 1.155886 },
  bind: { xMultiplier: 5.9e-05, yMultiplier: -5.9e-05, xScalarToAdd: 0.576941, yScalarToAdd: 0.967566 },
  breeze: { xMultiplier: 7e-05, yMultiplier: -7e-05, xScalarToAdd: 0.465123, yScalarToAdd: 0.833078 },
  abyss: { xMultiplier: 8.1e-05, yMultiplier: -8.1e-05, xScalarToAdd: 0.5, yScalarToAdd: 0.5 },
  lotus: { xMultiplier: 7.2e-05, yMultiplier: -7.2e-05, xScalarToAdd: 0.454789, yScalarToAdd: 0.917752 },
  sunset: { xMultiplier: 7.8e-05, yMultiplier: -7.8e-05, xScalarToAdd: 0.5, yScalarToAdd: 0.515625 },
  pearl: { xMultiplier: 7.8e-05, yMultiplier: -7.8e-05, xScalarToAdd: 0.480469, yScalarToAdd: 0.916016 },
  icebox: { xMultiplier: 7.2e-05, yMultiplier: -7.2e-05, xScalarToAdd: 0.460214, yScalarToAdd: 0.304687 },
  corrode: { xMultiplier: 7e-05, yMultiplier: -7e-05, xScalarToAdd: 0.526158, yScalarToAdd: 0.5 },
  haven: { xMultiplier: 7.5e-05, yMultiplier: -7.5e-05, xScalarToAdd: 1.09345, yScalarToAdd: 0.642728 },
}
