import { Chain, Hex, PrivateKeyAccount, PublicClient } from 'viem';

export interface IBridgeRange {
    readonly minRange: number;
    readonly maxRange: number;
}

export interface IFixedRange extends IBridgeRange {}

export interface IDelayRange extends IBridgeRange {}

export interface IFunction {
    readonly func: (account: PrivateKeyAccount) => Promise<boolean>;
    readonly isUse: boolean;
}

export interface IThrusterSwapData {
    readonly amount: string | undefined;
    readonly tokenIn: string | undefined;
    readonly tokenOut: string | undefined;
    readonly type: string | undefined;
    readonly chainId: string | undefined;
}

export interface IThrusterApiKeyData {
    readonly exp: number;
    readonly iat: number;
}

export type TokenName = 'USDT' | 'USDC' | 'USDC.e' | 'USDbC' | 'ETH' | 'DAI' | 'USDB';

export interface IToken {
    readonly name: TokenName;
    readonly contractAddress: Hex;
    readonly decimals: number;
}

export interface IStageData {
    readonly moduleName: string;
    readonly spenderContractAddress: Hex;
    readonly ethValue: { range: IBridgeRange; fixed: IFixedRange };
    readonly stableValue: { range: IBridgeRange; fixed: IFixedRange };
    readonly minEthValue: { range: IBridgeRange };
    readonly minStableValue: { range: IBridgeRange };
}

export interface IPreparedStageData {
    readonly client: PublicClient | null;
    swapData: ISwapData | null;
}

export interface ISwapData {
    value: bigint;
    srcToken: IToken | null;
    readonly dstToken: IToken | null;
}

export interface IRoute {
    tokenIn: string;
    tokenOut: string;
    feeTier: number;
    poolAddress: string;
    poolVersion: string;
    hasFee: boolean;
}

export interface IThrusterQuoteData {
    quote: string;
    poolPrice: string;
    priceImpact: number;
    route: IRoute[];
}

export interface IRelayBridgeData {
    readonly chain: Chain;
    readonly rpc: string | null;
}

export interface IRelayConfigRequestData {
    readonly originChainId: number;
    readonly destinationChainId: number;
    readonly currency: string;
    readonly user: string;
}

export interface IRelayConfigResponseData {
    readonly enabled: boolean;
    readonly capacityPerRequest: string | null;
}

export interface IRelayBridgeRequestData
    extends Pick<IRelayConfigRequestData, 'originChainId' | 'destinationChainId' | 'currency' | 'user'> {
    readonly recipient: string;
    readonly amount: string;
    readonly usePermit: boolean;
    readonly useExternalLiquidity: boolean;
    readonly source: string;
}

export interface IRelayBridgeResponseData {
    readonly to: Hex;
    readonly data: Hex;
    readonly value: bigint;
}

export interface IOkx {
    readonly okxFee: string;
    readonly chainName: string;
    readonly networkName: string;
    readonly tokenName: string;
    readonly withdraw: IBridgeRange;
    readonly randomFixed: IFixedRange;
    readonly withdrawStart: string;
}

export interface IBlastr {
    readonly accountAddress: string;
    readonly contractAddress: string;
}

export interface IFenixData {
    readonly inTokenAddress: string | undefined;
    readonly outTokenAddress: string | undefined;
    readonly amount: string | undefined;
    readonly slippage: string;
    readonly account: string;
}
