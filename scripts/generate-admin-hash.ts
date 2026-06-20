import bcrypt from 'bcryptjs'

async function main() {
  const hash = await bcrypt.hash('K19Admin2026!', 10)
  console.log(hash)
}

main()
