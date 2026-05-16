import wordlist from 'eff-diceware-passphrase/wordlist.json'

// EFF Long Wordlist: 7776 words, ~12.92 bits of entropy each.
// 5 words ≈ 64 bits, which is unbreakable in practice for AES-256/PBKDF2 ZIPs.

const WORD_COUNT = wordlist.length

function pickIndex() {
  // Rejection sampling to avoid modulo bias.
  const max = Math.floor(0xffffffff / WORD_COUNT) * WORD_COUNT
  const buf = new Uint32Array(1)
  while (true) {
    crypto.getRandomValues(buf)
    if (buf[0] < max) return buf[0] % WORD_COUNT
  }
}

export function generatePassphrase(count = 5, separator = '-') {
  const words = new Array(count)
  for (let i = 0; i < count; i++) words[i] = wordlist[pickIndex()]
  return words.join(separator)
}
