import fs from 'node:fs'

const W = 45, H = 45
const CX = 22.5

function star(cx, cy, outerR, innerR, points = 4, rotationDeg = 0) {
  const pts = []
  const n = points * 2
  for (let i = 0; i < n; i++) {
    const angleDeg = rotationDeg + (i * 360) / n - 90 // start pointing up
    const r = i % 2 === 0 ? outerR : innerR
    const rad = (angleDeg * Math.PI) / 180
    const x = cx + r * Math.cos(rad)
    const y = cy + r * Math.sin(rad)
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

function scallopedCrownPath(cx, baseY, topY, halfWidth, bumps) {
  // A crown band whose top edge is a row of rounded bumps (like little onion-domes
  // in miniature), evoking a row of iwan/arch shapes rather than plain spikes.
  const left = cx - halfWidth
  const right = cx + halfWidth
  const bumpWidth = (2 * halfWidth) / bumps
  let d = `M ${left.toFixed(2)} ${baseY} `
  for (let i = 0; i < bumps; i++) {
    const x0 = left + i * bumpWidth
    const xMid = x0 + bumpWidth / 2
    const x1 = x0 + bumpWidth
    d += `L ${x0.toFixed(2)} ${topY + 3} Q ${xMid.toFixed(2)} ${topY - 1} ${x1.toFixed(2)} ${(topY + 3).toFixed(2)} `
  }
  d += `L ${right.toFixed(2)} ${baseY} Z`
  return d
}

// Shared "robe" body silhouette used by king/queen: wide flared base, gentle
// taper up to the neck. bodyTopY controls how tall the piece reads.
function robeBody(bodyTopY, baseY, topHalfWidth, baseHalfWidth) {
  return `M ${(CX - baseHalfWidth).toFixed(2)} ${baseY} ` +
    `Q ${(CX - baseHalfWidth).toFixed(2)} ${(bodyTopY + (baseY - bodyTopY) * 0.45).toFixed(2)} ${(CX - topHalfWidth).toFixed(2)} ${bodyTopY} ` +
    `L ${(CX + topHalfWidth).toFixed(2)} ${bodyTopY} ` +
    `Q ${(CX + baseHalfWidth).toFixed(2)} ${(bodyTopY + (baseY - bodyTopY) * 0.45).toFixed(2)} ${(CX + baseHalfWidth).toFixed(2)} ${baseY} Z`
}

function baseElement(y, halfWidth) {
  return `<rect x="${(CX - halfWidth).toFixed(2)}" y="${y}" width="${(halfWidth * 2).toFixed(2)}" height="4" rx="1.6" />` +
    `<rect x="${(CX - halfWidth - 1.5).toFixed(2)}" y="${y + 4}" width="${(halfWidth * 2 + 3).toFixed(2)}" height="2.6" rx="1.3" />`
}

function domeTop(cy, r) {
  // A bulb/onion-dome silhouette (Timurid-style), narrowing to a small neck below.
  const top = cy - r
  return `M ${(CX - r).toFixed(2)} ${cy.toFixed(2)} ` +
    `C ${(CX - r).toFixed(2)} ${(cy - r * 1.15).toFixed(2)} ${(CX - r * 0.55).toFixed(2)} ${top.toFixed(2)} ${CX} ${top.toFixed(2)} ` +
    `C ${(CX + r * 0.55).toFixed(2)} ${top.toFixed(2)} ${(CX + r).toFixed(2)} ${(cy - r * 1.15).toFixed(2)} ${(CX + r).toFixed(2)} ${cy.toFixed(2)} Z`
}

const pieces = {}

// --- PAWN: small dome head, simple shoulders, base plinth. -----------------
pieces.pawn = () => `
  ${domeTop(18, 5.4)}
  <path d="${robeBody(21, 33, 3.6, 8.5)}" />
  ${baseElement(33, 9.5)}
`.trim()

// --- KING: taller robe body, onion dome, 4-point star finial on a short spire. ---
pieces.king = () => `
  <path d="${robeBody(19, 34, 6.5, 12)}" />
  ${baseElement(34, 13)}
  <rect x="${(CX - 1).toFixed(2)}" y="12" width="2" height="7" rx="1" />
  ${domeTop(19, 7)}
  <path d="${star(CX, 8, 3.1, 1.3, 4)}" />
  <rect x="${(CX - 8.5).toFixed(2)}" y="26" width="17" height="2.4" rx="1.2" class="piece-band" />
`.trim()

// --- QUEEN: robe body, scalloped iwan-arch crown, small star finials. -------
pieces.queen = () => `
  <path d="${robeBody(20, 34, 6, 11.5)}" />
  ${baseElement(34, 12.5)}
  <path d="${scallopedCrownPath(CX, 22, 13, 9, 5)}" />
  <path d="${star(CX, 10.5, 1.9, 0.8, 4)}" />
  <path d="${star(CX - 6, 15.5, 1.3, 0.55, 4)}" />
  <path d="${star(CX + 6, 15.5, 1.3, 0.55, 4)}" />
`.trim()

// --- ROOK: tapered minaret tower with a muqarnas-style crenellated crown. ---
pieces.rook = () => {
  const merlons = [0, 1, 2, 3].map((i) => {
    const x = CX - 9 + i * (18 / 4) + 1
    return `<rect x="${x.toFixed(2)}" y="9" width="2.6" height="4.5" />`
  }).join('')
  return `
  <path d="M ${(CX - 9.5).toFixed(2)} 34 L ${(CX - 8).toFixed(2)} 15 L ${(CX + 8).toFixed(2)} 15 L ${(CX + 9.5).toFixed(2)} 34 Z" />
  ${baseElement(34, 10.5)}
  <rect x="${(CX - 9).toFixed(2)}" y="13.5" width="18" height="4" rx="0.6" />
  ${merlons}
  <rect x="${(CX - 6).toFixed(2)}" y="22" width="12" height="2.2" rx="1.1" class="piece-band" />
  `.trim()
}

// --- BISHOP: round head + small symmetric tusk-curls (elephant/alfil reference). ---
pieces.bishop = () => `
  <path d="${robeBody(20, 34, 4.2, 8.5)}" />
  ${baseElement(34, 9.5)}
  <circle cx="${CX}" cy="16" r="6.2" />
  <path d="M ${(CX - 5.6).toFixed(2)} 18.5 C ${(CX - 8).toFixed(2)} 19.5 ${(CX - 8).toFixed(2)} 22 ${(CX - 5.8).toFixed(2)} 22.6" fill="none" class="piece-line" stroke-linecap="round" />
  <path d="M ${(CX + 5.6).toFixed(2)} 18.5 C ${(CX + 8).toFixed(2)} 19.5 ${(CX + 8).toFixed(2)} 22 ${(CX + 5.8).toFixed(2)} 22.6" fill="none" class="piece-line" stroke-linecap="round" />
  <path d="${star(CX, 7, 1.7, 0.7, 4)}" />
`.trim()

// --- KNIGHT: horse head profile, redesigned with a clear horizontal snout so it
// reads as a horse rather than a bird. Mostly straight edges for a clean,
// geometric, minimalist silhouette; only the neck-back and chest use a soft curve.
pieces.knight = () => `
  ${baseElement(34, 10)}
  <path d="M 14 34
           Q 12.5 24 14 16
           L 13.5 10
           L 15.5 5 L 17.5 9 L 19.5 4.5 L 21 9
           L 21.5 13
           L 24 14.5
           L 30 14.5
           L 33 15.5
           L 32.5 18
           L 29 18
           L 30 19.5
           L 26 21
           L 24 25
           Q 27 27 28 29
           Q 29.5 31.5 30 34
           Z" />
  <circle cx="26.5" cy="13" r="0.8" class="piece-eye" />
`.trim()

const roleOrder = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']
const colors = {
  white: { fill: '#f2e8d5', stroke: '#241c10', line: '#241c10', band: '#b5883f', eye: '#241c10' },
  black: { fill: '#1c150c', stroke: '#f2e8d5', line: '#f2e8d5', band: '#c9a668', eye: '#f2e8d5' },
}

function wrapSvg(inner, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <g fill="${color.fill}" stroke="${color.stroke}" stroke-width="1" stroke-linejoin="round">
    <style>.piece-band{fill:${color.band};stroke:none}.piece-line{stroke:${color.line};stroke-width:1.1}.piece-eye{fill:${color.eye};stroke:none}</style>
    ${inner}
  </g>
</svg>`
}

const outDir = new URL('../src/assets/uzbek-pieces/', import.meta.url)
fs.mkdirSync(outDir, { recursive: true })
for (const role of roleOrder) {
  for (const colorName of ['white', 'black']) {
    const svg = wrapSvg(pieces[role](), colors[colorName])
    fs.writeFileSync(new URL(`${colorName}-${role}.svg`, outDir), svg)
  }
}

// Contact sheet: all 12, alternating light/dark backdrop squares like a real board.
let cells = ''
let i = 0
for (const role of roleOrder) {
  for (const colorName of ['white', 'black']) {
    const col = i % 6
    const row = Math.floor(i / 6)
    const x = col * 50
    const y = row * 50
    const bg = (col + row) % 2 === 0 ? '#ead9b8' : '#7c5a3c'
    const svg = wrapSvg(pieces[role](), colors[colorName])
    const inner = svg.replace(/<svg[^>]*>/, '').replace('</svg>', '')
    cells += `<g transform="translate(${x},${y})"><rect width="50" height="50" fill="${bg}"/><g transform="translate(2.5,2.5)">${inner}</g></g>`
    i++
  }
}
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">${cells}</svg>`
fs.writeFileSync(new URL('../scripts/uzbek-pieces-contact-sheet.svg', import.meta.url), sheet)

// Build the actual chessground-compatible stylesheet (base64-embedded SVGs,
// one rule per role/color, matching the same selector shape Chessground's own
// bundled themes use).
let css = `/**
 * "Uzbek Lab" piece set for Chess Lab -- an original, minimalist piece set
 * drawing on Central Asian / Timurid visual motifs (onion domes, muqarnas-style
 * crenellation, scalloped iwan-arch crowns, star finials) rather than the usual
 * European Staunton silhouette, plus a nod to the historical Persian/Central
 * Asian chess tradition, where this game's "bishop" square was originally an
 * elephant (alfil) -- hence the tusk-curls on that piece.
 *
 * Generated by scripts/build-uzbek-pieces.mjs from src/assets/uzbek-pieces/*.svg.
 * Tweak the shapes in that script (or hand-edit the SVGs directly) and re-run
 * \`node scripts/build-uzbek-pieces.mjs\` to regenerate this file.
 */

`
for (const role of roleOrder) {
  for (const colorName of ['white', 'black']) {
    const svg = wrapSvg(pieces[role](), colors[colorName])
    const b64 = Buffer.from(svg).toString('base64')
    css += `.cg-wrap piece.${role}.${colorName} {\n  background-image: url('data:image/svg+xml;base64,${b64}');\n}\n`
  }
}
fs.writeFileSync(new URL('../src/styles/chessground-pieces-uzbek.css', import.meta.url), css)

console.log('done')
