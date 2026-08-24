/**
 * Letters whose English name starts with a vowel sound, so an initialism
 * beginning with one takes "an": an EUR ad, an IDR ad, an SGD ad.
 * Every other letter takes "a": a ZAR ad, a USD ad, a GBP ad.
 *
 * "U" is deliberately absent: it is pronounced "you", a /j/ consonant onset,
 * so "a USD ad" is correct.
 */
const VOWEL_SOUND_LETTERS = new Set(["A", "E", "F", "H", "I", "L", "M", "N", "O", "R", "S", "X"])

/**
 * English indefinite article for a currency code, which is read out
 * letter-by-letter. Only meaningful for English copy — other locales translate
 * these sentences without an English article.
 */
export function indefiniteArticleFor(code: string): "a" | "an" {
  const firstLetter = code.trim().charAt(0).toUpperCase()
  return VOWEL_SOUND_LETTERS.has(firstLetter) ? "an" : "a"
}
