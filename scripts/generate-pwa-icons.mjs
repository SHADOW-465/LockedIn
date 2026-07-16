import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const iconsDir = path.join(root, 'public', 'icons')
fs.mkdirSync(iconsDir, { recursive: true })

function svg(size, { maskable = false } = {}) {
  const pad = maskable ? size * 0.18 : size * 0.12
  const inner = size - pad * 2
  const cx = size / 2
  const cy = size / 2 + size * 0.04
  const bodyW = inner * 0.48
  const bodyH = inner * 0.38
  const bodyX = cx - bodyW / 2
  const bodyY = cy - bodyH * 0.15
  const shackleR = bodyW * 0.28
  const shackleY = bodyY
  const stroke = Math.max(2, size * 0.045)
  const radius = maskable ? size * 0.22 : size * 0.18

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0D110C"/>
  <path d="M ${cx - shackleR} ${shackleY} A ${shackleR} ${shackleR} 0 0 1 ${cx + shackleR} ${shackleY}"
        fill="none" stroke="#C3F400" stroke-width="${stroke}" stroke-linecap="round"/>
  <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${bodyW * 0.12}" fill="#C3F400"/>
  <circle cx="${cx}" cy="${bodyY + bodyH * 0.38}" r="${bodyW * 0.1}" fill="#0D110C"/>
  <rect x="${cx - bodyW * 0.05}" y="${bodyY + bodyH * 0.42}" width="${bodyW * 0.1}" height="${bodyH * 0.28}"
        rx="${bodyW * 0.03}" fill="#0D110C"/>
</svg>`)
}

const jobs = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const job of jobs) {
  const out = path.join(iconsDir, job.name)
  await sharp(svg(job.size, { maskable: !!job.maskable })).png().toFile(out)
  console.log('wrote', path.relative(root, out))
}

const logo = path.join(root, 'public', 'LockedIn-logo.png')
await sharp(svg(512)).png().toFile(logo)
console.log('wrote', path.relative(root, logo))
