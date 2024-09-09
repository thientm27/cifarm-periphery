import { Contract, JsonRpcProvider } from "ethers"
import { evmHttpRpcUrl } from "../../rpcs"
import { GetNftsParams } from "../types.nft"
import { erc721Abi } from "../../abi"
import { Platform, chainKeyToPlatform } from "@/config"
import { PlatformNotFoundException } from "@/exceptions"

export const _getEvmNfts = async ({ nftAddress, chainKey, network }: GetNftsParams) => {
    const rpc = evmHttpRpcUrl(chainKey, network)
    const provider = new JsonRpcProvider(rpc)
    const contract = new Contract(nftAddress, erc721Abi, provider)
    const events = await contract.queryFilter("Transfer")
    console.log(events)
}

export const _getNfts = (params: GetNftsParams) => {
    const platform = chainKeyToPlatform(params.chainKey)
    switch (platform) {
    case Platform.Evm: {
        return _getEvmNfts(params)
    }
    default: throw new PlatformNotFoundException(platform)
    }
}
