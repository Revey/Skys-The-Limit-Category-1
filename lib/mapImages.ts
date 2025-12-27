// Map image mapping - uses local images in /public/maps/

export const MAP_IMAGES: Record<string, string> = {
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

export function getMapImage(mapName: string): string | null {
  const normalized = mapName.toLowerCase().trim()
  return MAP_IMAGES[normalized] || null
}

export function getMapInitial(mapName: string): string {
  return mapName.charAt(0).toUpperCase()
}
