import { GraphQLClient, gql } from 'graphql-request'
import fs from 'fs'
import path from "path";
import { allTokenAddresses } from '../contractTokenAbi'

export async function currencySaver() {
  const blockGqlQuery = (currentDateFrom: number, currentDateTo: number) => {
    return gql`
        query GetBlock {
            blocks(
              first: 1
              orderBy: timestamp
              orderDirection: desc
              where: { timestamp_gt: ${currentDateFrom}, timestamp_lt: ${currentDateTo} }
              subgraphError: allow
            ) {
              number
            }
        }
  `
  }
  const ubeGqlQuery = (tokenId: string, block: number) => {
    return gql`
        query Token  {
            token(id: "${tokenId}", block: {number:${block}}) {
              name
              symbol
              derivedCUSD
            }
          }
  `
  }

  const endpointBlock = 'https://api.thegraph.com/subgraphs/name/ubeswap/celo-blocks'
  const endpointUbe = 'https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap'

  setInterval(async function () {
    let currency = [];
    let currentDateTo = new Date().getTime()
    currentDateTo = Math.floor(currentDateTo / 1000) - 80
    const currentDateFrom = currentDateTo - 600

    const graphQLClientBlock = new GraphQLClient(endpointBlock)
    const graphQLClientUbe = new GraphQLClient(endpointUbe)

    const currentBlockQuery = blockGqlQuery(currentDateFrom, currentDateTo)
    const currentData = await graphQLClientBlock.request(currentBlockQuery)
    const currentBlockNumber = currentData.blocks[0].number

    const yesterdayDateTo = currentDateTo - 86400;
    const yesterdayDateFrom = currentDateTo - 87000;

    const yesterdayBlockQuery = blockGqlQuery(yesterdayDateFrom, yesterdayDateTo)
    const yesterdayData = await graphQLClientBlock.request(yesterdayBlockQuery)
    const yesterdayBlockNumber = yesterdayData.blocks[0].number

    for await (var token of allTokenAddresses) {

      let currentUbeQuery = ubeGqlQuery(token.tokenAddress.toLowerCase(), currentBlockNumber)
      let currentUbeData = await graphQLClientUbe.request(currentUbeQuery)
      let currentReserveUSD = currentUbeData.token.derivedCUSD

      let yesterdaytUbeQuery = ubeGqlQuery(token.tokenAddress.toLowerCase(), yesterdayBlockNumber)
      let yesterdayUbeData = await graphQLClientUbe.request(yesterdaytUbeQuery)
      let yesterdayReserveUSD = yesterdayUbeData.token.derivedCUSD

      let percent_24 = ((currentReserveUSD - yesterdayReserveUSD) / currentReserveUSD) * 100

      let data = {
        name: token.tokenName,
        price: currentReserveUSD,
        percent_24
      }
      currency.push(data)
    }
    fs.writeFileSync(path.join(__dirname, "..", "..", "currency.txt"), JSON.stringify(currency))
  }, 150000)
}
