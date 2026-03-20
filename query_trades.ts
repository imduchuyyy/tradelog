import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const trades = await prisma.trade.findMany({})
  console.log(trades)
}
main()
