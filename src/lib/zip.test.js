import { describe, it, expect, beforeAll } from 'vitest'
import { configure } from '@zip.js/zip.js'
import { MODES, createZip } from './zip.js'

// zip.js spawns Web Workers by default; tell it not to in Node.
beforeAll(() => {
  configure({ useWebWorkers: false })
})

// ZIP local file header layout (little-endian):
// offset  size  field
// 0       4     signature (0x04034b50)
// 4       2     version needed to extract
// 6       2     general purpose bit flag  -- bit 0 == encrypted
// 8       2     compression method        -- 0=stored, 8=deflate, 99=AES (WinZip)
// 10      4     mod time / date
// 14      4     CRC-32
// 18      4     compressed size
// 22      4     uncompressed size
// 26      2     filename length
// 28      2     extra field length
// 30      n     filename
// 30+n    m     extra fields
function parseLocalFileHeader(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(0, true) !== 0x04034b50) {
    throw new Error('not a ZIP local file header')
  }
  return {
    flags: view.getUint16(6, true),
    compressionMethod: view.getUint16(8, true),
    filenameLength: view.getUint16(26, true),
    extraFieldLength: view.getUint16(28, true),
  }
}

// Extra field record: id (2) + size (2) + payload (size bytes).
// The WinZip AES extra field has id 0x9901 and payload:
//   2 bytes vendor version (AE-1 = 1, AE-2 = 2)
//   2 bytes vendor ID ("AE")
//   1 byte  encryption strength (1=128, 2=192, 3=256)
//   2 bytes actual compression method
function findAesExtra(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 0
  while (offset + 4 <= bytes.length) {
    const id = view.getUint16(offset, true)
    const size = view.getUint16(offset + 2, true)
    if (id === 0x9901) {
      return {
        version: view.getUint16(offset + 4, true),
        vendor: String.fromCharCode(bytes[offset + 6], bytes[offset + 7]),
        strength: bytes[offset + 8],
        actualMethod: view.getUint16(offset + 9, true),
      }
    }
    offset += 4 + size
  }
  return null
}

async function buildAndInspect({ mode, password }) {
  const chunks = []
  const writable = new WritableStream({
    write(chunk) { chunks.push(chunk) },
  })

  const blob = new Blob(['Hello eazip.ch!\n'])
  const file = Object.assign(blob, { name: 'hello.txt' })

  await createZip({ files: [file], writable, mode, password })

  const total = chunks.reduce((s, c) => s + c.byteLength, 0)
  const bytes = new Uint8Array(total)
  let pos = 0
  for (const c of chunks) {
    bytes.set(c, pos)
    pos += c.byteLength
  }
  const header = parseLocalFileHeader(bytes)
  const extraStart = 30 + header.filenameLength
  const extra = bytes.slice(extraStart, extraStart + header.extraFieldLength)
  return { header, aes: findAesExtra(extra), totalBytes: total }
}

describe('createZip - encryption mode wiring', () => {
  it('mode "none" produces a plain deflated ZIP, no encryption', async () => {
    const { header, aes } = await buildAndInspect({ mode: MODES.NONE })
    expect(header.flags & 1).toBe(0)
    expect(header.compressionMethod).toBe(8)
    expect(aes).toBeNull()
  })

  it('mode "legacy" produces a ZipCrypto deflated entry with no AES extra field', async () => {
    const { header, aes } = await buildAndInspect({
      mode: MODES.LEGACY,
      password: 'testpass',
    })
    expect(header.flags & 1).toBe(1)
    expect(header.compressionMethod).toBe(8)
    expect(aes).toBeNull()
  })

  it('mode "modern" produces method 99 with an AE extra field marking AES-256', async () => {
    const { header, aes } = await buildAndInspect({
      mode: MODES.MODERN,
      password: 'testpass',
    })
    expect(header.flags & 1).toBe(1)
    expect(header.compressionMethod).toBe(99)
    expect(aes).not.toBeNull()
    expect(aes.vendor).toBe('AE')
    expect(aes.strength).toBe(3) // 3 == AES-256
    expect(aes.actualMethod).toBe(8) // underlying compression is still deflate
  })

  it('legacy mode requires a password', async () => {
    await expect(buildAndInspect({ mode: MODES.LEGACY })).rejects.toThrow()
  })

  it('modern mode requires a password', async () => {
    await expect(buildAndInspect({ mode: MODES.MODERN })).rejects.toThrow()
  })
})
