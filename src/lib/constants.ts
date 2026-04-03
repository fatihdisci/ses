export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

export const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.heic'

export const PHOTO_SLOTS = ['top', 'bottom'] as const
export type PhotoSlot = (typeof PHOTO_SLOTS)[number]

export const PHOTO_SLOT_LABELS: Record<PhotoSlot, string> = {
  top: 'Top of Foot',
  bottom: 'Sole of Foot',
}

export const PRICE_USD = 1.99
export const PRICE_DISPLAY = '$1.99'

// Loading messages shown during AI analysis
export const LOADING_MESSAGES = [
  'Consulting ancient Babylonian charts...',
  'Mapping reflexology zones...',
  'Analysing toe length ratios...',
  'Tracing the lines of your sole...',
  'Cross-referencing Eastern Podomancy scrolls...',
  'Decoding the arch of destiny...',
  'Aligning with lunar foot meridians...',
  'Reading the wisdom etched in your soles...',
] as const
