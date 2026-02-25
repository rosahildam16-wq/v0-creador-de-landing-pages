import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

const publicDir = join(process.cwd(), 'public', 'images')

const movFiles = [
  'nomada-3.mov',
  'franquicia-reset.mov',
  'ultimo-video-reset.mov',
  'nomada-203-20-281-29.mov',
]

for (const file of movFiles) {
  const src = join(publicDir, file)
  const dest = join(publicDir, file.replace('.mov', '.mp4'))
  
  if (existsSync(src)) {
    copyFileSync(src, dest)
    console.log(`Copied ${file} -> ${file.replace('.mov', '.mp4')}`)
  } else {
    console.log(`SKIP: ${file} not found at ${src}`)
  }
}

console.log('Done!')
