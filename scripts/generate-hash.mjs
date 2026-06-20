import bcrypt from 'bcryptjs'

const password = 'K19Admin2026!'
const hash = await bcrypt.hash(password, 10)
console.log('Password:', password)
console.log('Hash:', hash)
