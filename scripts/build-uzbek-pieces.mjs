import fs from 'node:fs'

const W = 45, H = 45
const CX = 22.5

function star(cx, cy, outerR, innerR, points, rotationDeg = 0) {
  const pts = []
  const n = points * 2
  for (let i = 0; i < n; i++) {
    const angleDeg = rotationDeg + (i * 360) / n - 90
    const r = i % 2 === 0 ? outerR : innerR
    const rad = (angleDeg * Math.PI) / 180
    pts.push(`${(cx + r * Math.cos(rad)).toFixed(2)},${(cy + r * Math.sin(rad)).toFixed(2)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

// Smooth, continuous robe/torso silhouette -- flares out gently from a narrow
// top to a wide base. Used (with different sizes) for pawn/king/queen/bishop so
// the family reads as one set.
function robeBody(topY, baseY, topHalfWidth, baseHalfWidth) {
  const ctrlY = topY + (baseY - topY) * 0.42
  return `M ${(CX - baseHalfWidth).toFixed(2)} ${baseY}
    Q ${(CX - baseHalfWidth).toFixed(2)} ${ctrlY.toFixed(2)} ${(CX - topHalfWidth).toFixed(2)} ${topY}
    L ${(CX + topHalfWidth).toFixed(2)} ${topY}
    Q ${(CX + baseHalfWidth).toFixed(2)} ${ctrlY.toFixed(2)} ${(CX + baseHalfWidth).toFixed(2)} ${baseY} Z`
}

function baseElement(y, halfWidth) {
  return `<rect x="${(CX - halfWidth).toFixed(2)}" y="${y}" width="${(halfWidth * 2).toFixed(2)}" height="4" rx="1.6" />` +
    `<rect x="${(CX - halfWidth - 1.5).toFixed(2)}" y="${y + 4}" width="${(halfWidth * 2 + 3).toFixed(2)}" height="2.6" rx="1.3" />`
}

const pieces = {}

// --- PAWN: round head overlapping the body directly (no gap), simple + clean. ---
pieces.pawn = () => `
  <circle cx="${CX}" cy="16.5" r="5.6" />
  <path d="${robeBody(19.5, 33, 3.6, 8.5)}" />
  ${baseElement(33, 9.5)}
`.trim()

// --- KING: round head+crown band, a tall cross-topped spire, sash band on the robe. ---
pieces.king = () => `
  <path d="${robeBody(19, 34, 6.3, 12)}" />
  ${baseElement(34, 13)}
  <rect x="${(CX - 8.5).toFixed(2)}" y="25.5" width="17" height="2.4" rx="1.2" class="piece-band" />
  <circle cx="${CX}" cy="17.5" r="6.6" />
  <rect x="${(CX - 8).toFixed(2)}" y="21.5" width="16" height="2.6" rx="1" />
  <rect x="${(CX - 1.1).toFixed(2)}" y="7" width="2.2" height="8" rx="0.6" />
  <rect x="${(CX - 3.4).toFixed(2)}" y="9.6" width="6.8" height="2.2" rx="0.6" />
`.trim()

// --- QUEEN: taller/narrower body, a sharply-pointed crown (distinct from the
// king's dome and the rook's flat crenellations), star finials on each point. ---
pieces.queen = () => {
  const points = [-8, -4, 0, 4, 8]
  const spikes = points.map((dx) => {
    const topY = dx === 0 ? 9 : 12
    return `L ${(CX + dx - 2).toFixed(2)} 19 L ${(CX + dx).toFixed(2)} ${topY} L ${(CX + dx + 2).toFixed(2)} 19`
  }).join(' ')
  const crown = `M ${(CX - 10).toFixed(2)} 22 L ${(CX - 10).toFixed(2)} 19 ${spikes} L ${(CX + 10).toFixed(2)} 19 L ${(CX + 10).toFixed(2)} 22 Z`
  const finials = points.map((dx) => star(CX + dx, dx === 0 ? 7.3 : 10.3, 1.5, 0.6, 4)).map((d) => `<path d="${d}" />`).join('')
  return `
  <path d="${robeBody(21, 34, 5.6, 11)}" />
  ${baseElement(34, 12)}
  <path d="${crown}" />
  ${finials}
  `.trim()
}

// --- ROOK: tapered fortress tower, bold crenellations. -----------------------
pieces.rook = () => {
  const merlons = [0, 1, 2, 3].map((i) => {
    const x = CX - 9 + i * (18 / 4) + 0.8
    return `<rect x="${x.toFixed(2)}" y="8.5" width="3" height="5" />`
  }).join('')
  return `
  <path d="M ${(CX - 9.5).toFixed(2)} 34 L ${(CX - 8).toFixed(2)} 15 L ${(CX + 8).toFixed(2)} 15 L ${(CX + 9.5).toFixed(2)} 34 Z" />
  ${baseElement(34, 10.5)}
  <rect x="${(CX - 9.2).toFixed(2)}" y="13" width="18.4" height="4.5" rx="0.6" />
  ${merlons}
  <rect x="${(CX - 6).toFixed(2)}" y="23" width="12" height="2.2" rx="1.1" class="piece-band" />
  `.trim()
}

// --- BISHOP: classic round head + a bold mitre slit (the universal bishop cue),
// plus small tusk-curls for the historical elephant (alfil) reference. No star
// finial here -- that's the king/queen's motif, and this needs its own silhouette. ---
pieces.bishop = () => `
  <path d="${robeBody(21, 34, 4.4, 9)}" />
  ${baseElement(34, 10)}
  <circle cx="${CX}" cy="17.5" r="6.2" />
  <circle cx="${CX}" cy="8.6" r="1.7" />
  <rect x="${(CX - 7.5).toFixed(2)}" y="24.5" width="15" height="2.4" rx="1.2" class="piece-band" />
  <path d="M ${(CX - 5.8).toFixed(2)} 19 C ${(CX - 8.6).toFixed(2)} 19.9 ${(CX - 8.6).toFixed(2)} 22.8 ${(CX - 6).toFixed(2)} 23.4" fill="none" class="piece-line" stroke-linecap="round" stroke-width="1.3" />
  <path d="M ${(CX + 5.8).toFixed(2)} 19 C ${(CX + 8.6).toFixed(2)} 19.9 ${(CX + 8.6).toFixed(2)} 22.8 ${(CX + 6).toFixed(2)} 23.4" fill="none" class="piece-line" stroke-linecap="round" stroke-width="1.3" />
  <path d="M ${(CX - 4.4).toFixed(2)} 12.2 L ${(CX + 3.6).toFixed(2)} 19.4" fill="none" class="piece-line" stroke-linecap="round" stroke-width="1.8" />
`.trim()

// --- KNIGHT: iconic chess-knight silhouette -- one smooth arched neck curve,
// one smooth face curve, and a long straight-ish snout in between. Built from a
// few large curves rather than many short segments to keep the outline clean.
pieces.knight = () => `
  ${baseElement(34, 10.5)}
  <path d="M 13 34
           C 11.8 26 12.6 20.5 15.5 15.5
           C 17.3 12.3 19.6 9.8 22.7 8.3
           C 21.9 9.6 21.8 10.7 22.6 11.5
           C 26.5 11.1 30.5 13 33.4 17.4
           C 34.1 18.5 33.7 19.6 32.4 19.6
           C 31.6 18.3 30.2 17.6 28.8 18
           L 29.6 20.3 L 26.6 19.6
           C 25.4 21 25.6 22.7 27 24
           C 23.6 24.6 21.4 26.7 20.8 29.6
           C 20.5 31.1 20.8 32.6 21.6 34
           Z" />
  <circle cx="25.4" cy="12.6" r="0.9" class="piece-eye" />
`.trim()

const roleOrder = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']
const colors = {
  white: { fill: '#f2e8d5', stroke: '#241c10', line: '#241c10', band: '#b5883f', eye: '#241c10' },
  black: { fill: '#1c150c', stroke: '#f2e8d5', line: '#f2e8d5', band: '#c9a668', eye: '#f2e8d5' },
}

function wrapSvg(inner, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
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
    css += `.piece-set-uzbek .cg-wrap piece.${role}.${colorName} {\n  background-image: url('data:image/svg+xml;base64,${b64}');\n}\n`
  }
}
fs.writeFileSync(new URL('../src/styles/chessground-pieces-uzbek.css', import.meta.url), css)

console.log('done')
