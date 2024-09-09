import { Network } from "@/config"

export interface GetNftsParams {
    accountAddress: string,
    nftAddress: string,
    chainKey: string,
    network: Network
}