import bcrypt from 'bcryptjs'

const password = 'K19Admin2026!'
const hash = await bcrypt.hash(password, 10)
const isValid = await bcrypt.compare(password, hash)

console.log('Password:', password)
console.log('Hash:', hash)
console.log('Verification test:', isValid)
