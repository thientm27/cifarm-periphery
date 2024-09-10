import { Contract, JsonRpcProvider } from "ethers"
import { evmHttpRpcUrl } from "../../rpcs"
import { GetNftsParams, GetNftsResult, NftResult } from "../common"
import { erc721Abi } from "../../abis"
import { Platform, chainKeyToPlatform } from "@/config"
import { PlatformNotFoundException } from "@/exceptions"
import { MulticallProvider } from "@ethers-ext/provider-multicall"

export const _getEvmNfts = async ({
    nftAddress,
    chainKey,
    network,
    accountAddress,
    skip,
    take
}: GetNftsParams): Promise<GetNftsResult> => {
    const rpc = evmHttpRpcUrl(chainKey, network)
    const provider = new JsonRpcProvider(rpc)
    const contract = new Contract(nftAddress, erc721Abi, provider)
    const balance = Number(await contract
        .getFunction("balanceOf")
        .staticCall(accountAddress))

    const multicaller = new MulticallProvider(provider)
    const multicallerContract = new Contract(nftAddress, erc721Abi, multicaller)

    const promises: Array<Promise<void>> = []
    const tokenIds: Array<number> = []
    for (let index = skip; index < Math.min(balance, skip + take); index++) {
        promises.push(
            (async () => {
                const tokenId = await multicallerContract
                    .getFunction("tokenOfOwnerByIndex")
                    .staticCall(accountAddress, index)
                tokenIds.push(Number(tokenId))
            })(),
        )
    }
    await Promise.all(promises)

    const records: Array<NftResult> = []
    for (const tokenId of tokenIds) {
        promises.push(
            (async () => {
                const tokenURI = await multicallerContract
                    .getFunction("tokenURI")
                    .staticCall(tokenId)
                records.push({
                    tokenId,
                    tokenURI
                })
            })(),
        )
    }
    await Promise.all(promises)

    return {
        count: balance,
        records
    }
}

export const _getNfts = (params: GetNftsParams) => {
    const platform = chainKeyToPlatform(params.chainKey)
    switch (platform) {
    case Platform.Evm: {
        return _getEvmNfts(params)
    }
    default:
        throw new PlatformNotFoundException(platform)
    }
}