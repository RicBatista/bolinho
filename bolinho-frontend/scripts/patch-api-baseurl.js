const fs = require('fs')
const p = require('path').join(__dirname, '..', 'src', 'services', 'api.js')
let s = fs.readFileSync(p, 'utf8')
const oldFn = `function buildApiBaseURL() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) return '/api'
  let base = raw.replace(/\\/+$/, '')
  if (base.endsWith('/api')) base = base.slice(0, -4).replace(/\\/+$/, '')
  return \`\${base}/api\`
}`
const newFn = `function buildApiBaseURL() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) {
    if (import.meta.env.PROD) {
      console.warn(
        '[api] VITE_API_URL vazia no build. Defina no Railway (Build Time) ou as chamadas usam /api no mesmo host.'
      )
    }
    return '/api'
  }
  let base = raw.replace(/\\/+$/, '')
  if (!/^https?:\\/\\//i.test(base)) {
    base = \`https://\${base.replace(/^\\/+$/, '')}\`
  }
  if (base.endsWith('/api')) base = base.slice(0, -4).replace(/\\/+$/, '')
  return \`\${base.replace(/\\/+$/, '')}/api\`
}`
if (!s.includes(oldFn)) {
  console.error('Expected block not found in api.js')
  process.exit(1)
}
fs.writeFileSync(p, s.replace(oldFn, newFn), 'utf8')
console.log('patched', p)
