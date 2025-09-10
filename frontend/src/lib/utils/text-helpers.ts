export function getFallbackText(text: string | null | undefined, fallback: string = '---') {
  return text ? text.trim() : fallback
}
