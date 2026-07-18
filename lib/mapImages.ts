// Map image mapping - uses local images in /public/maps/

export const MAP_FULL_IMAGES: Record<string, string> = {
  'abyss': '/maps/abyss.jpg',
  'ascent': '/maps/ascent.png',
  'bind': '/maps/bind.png',
  'breeze': '/maps/breeze.png',
  'corrode': '/maps/corrode.jpg',
  'fracture': '/maps/fracture.webp',
  'haven': '/maps/haven.png',
  'icebox': '/maps/icebox.png',
  'lotus': '/maps/lotus.webp',
  'pearl': '/maps/pearl.webp',
  'split': '/maps/split.png',
  'sunset': '/maps/sunset.png',
}

export const MAP_MINIMAPS: Record<string, string> = {
  'abyss': '/maps/minimaps/riot/abyss.png',
  'ascent': '/maps/minimaps/riot/ascent.png',
  'bind': '/maps/minimaps/riot/bind.png',
  'breeze': '/maps/minimaps/riot/breeze.png',
  'corrode': '/maps/minimaps/riot/corrode.png',
  'fracture': '/maps/minimaps/riot/fracture.png',
  'haven': '/maps/minimaps/riot/haven.png',
  'icebox': '/maps/minimaps/riot/icebox.png',
  'lotus': '/maps/minimaps/riot/lotus.png',
  'pearl': '/maps/minimaps/riot/pearl.png',
  'split': '/maps/minimaps/riot/split.png',
  'sunset': '/maps/minimaps/riot/sunset.png',
}

export function getMapImage(mapName: string): string | null {
  const normalized = mapName.toLowerCase().trim()
  return MAP_FULL_IMAGES[normalized] || null
}

export function getMinimapImage(mapName: string): string | null {
  const normalized = mapName.toLowerCase().trim()
  return MAP_MINIMAPS[normalized] || null
}

export function getMapInitial(mapName: string): string {
  return mapName.charAt(0).toUpperCase()
}
