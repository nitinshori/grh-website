import { config } from 'dotenv'
config({ path: '.env.local' })

const url = process.env.DATABASE_URL || ''
const newUrl = process.env.DATABASE_URL_NEW || ''

const region = (u) => u.match(/\.([a-z]{2}-[a-z]+-\d+)\./)?.[1] || '(unknown)'
const host = (u) => u.match(/@([^/:]+)/)?.[1] || '(none)'

console.log('DATABASE_URL     →', host(url), '/', region(url))
console.log('DATABASE_URL_NEW →', host(newUrl), '/', region(newUrl))
console.log()
console.log(region(url) === 'eu-west-2'
  ? '✅ Local DATABASE_URL points at eu-west-2 (same as production)'
  : '⚠️  Local DATABASE_URL is NOT eu-west-2 — seed script wrote to wrong DB.')
