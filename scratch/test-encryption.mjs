import { ZipWriter, BlobReader, BlobWriter, configure } from '@zip.js/zip.js'
import { writeFile } from 'node:fs/promises'

configure({ useWebWorkers: false })

async function buildZip({ mode, password }) {
  const writerOptions = { bufferedWrite: true, keepOrder: true }
  const usesPassword = mode === 'legacy' || mode === 'modern'
  if (usesPassword) {
    writerOptions.password = password
    writerOptions.encryptionStrength = mode === 'modern' ? 3 : undefined
    writerOptions.zipCrypto = mode === 'legacy'
  }
  const writer = new ZipWriter(new BlobWriter('application/zip'), writerOptions)
  await writer.add('hello.txt', new BlobReader(new Blob(['Hello eazip.ch!\n'])))
  const blob = await writer.close()
  return new Uint8Array(await blob.arrayBuffer())
}

const legacy = await buildZip({ mode: 'legacy', password: 'testpass' })
const modern = await buildZip({ mode: 'modern', password: 'testpass' })

await writeFile('/tmp/eazip-legacy.zip', legacy)
await writeFile('/tmp/eazip-modern.zip', modern)
console.log('legacy bytes:', legacy.length)
console.log('modern bytes:', modern.length)
