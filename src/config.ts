import { IBridgeRange, IDelayRange, IFixedRange, IOkx, IRelayBridgeData, IToken } from './data/utils/interfaces';
import { defineChain, Hex } from 'viem';
import { arbitrum, base, linea, optimism } from 'viem/chains';

export const blast = defineChain({
    id: 81457,
    name: 'Blast',
    network: 'blast',
    nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
    },
    rpcUrls: {
        alchemy: {
            http: [],
            webSocket: [],
        },
        infura: {
            http: [],
            webSocket: [],
        },
        default: {
            http: ['https://rpc.blast.io'],
        },
        public: {
            http: ['https://rpc.ankr.com/blast'],
        },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://blastscan.io/' },
    },
});

export class OkxAuth {
    public static readonly okxApiKey: string = ''; // ясно что это
    public static readonly okxApiSecret: string = ''; // ясно что это
    public static readonly okxApiPassword: string = '.'; // ясно что это из env подтягивтаь потом
}

export class TelegramData {
    public static readonly telegramBotId: string = ''; // айди телеграм бота, которому будут отправляться логи
    public static readonly telegramId: string = ''; // телеграм айди @my_id_bot у него можно получить id
}

export class OkxData {
    public static readonly isUse: boolean = true; // использовать ли Okx в софте
    public static readonly bridgeData: IOkx[] = [
        {
            okxFee: '0.0001',
            chainName: 'ETH-Arbitrum One',
            networkName: 'Arbitrum One',
            tokenName: 'ETH',
            withdraw: { minRange: 0.0011, maxRange: 0.0017 },
            randomFixed: { minRange: 6, maxRange: 11 },
            withdrawStart: '0.5',
        },
        {
            okxFee: '0.00004',
            chainName: 'ETH-Base',
            networkName: 'Base',
            tokenName: 'ETH',
            withdraw: { minRange: 0.00204, maxRange: 0.003 },
            randomFixed: { minRange: 6, maxRange: 11 },
            withdrawStart: '0.5',
        },
        {
            okxFee: '0.00004',
            chainName: 'ETH-Optimism',
            networkName: 'Optimism',
            tokenName: 'ETH',
            withdraw: { minRange: 0.00087, maxRange: 0.0017 },
            randomFixed: { minRange: 6, maxRange: 11 },
            withdrawStart: '0.5',
        },
    ];

    public static readonly isRandomWithdraw: boolean = true;
    public static readonly delayAfterWithdraw: IBridgeRange = { minRange: 4, maxRange: 8 }; // сколько ожидать времени (в минутах) после вывода с окекса
}

export class Config {
    public static readonly isShuffleWallets: boolean = true; // перемешивать ли строки в текстовом файле для приватных ключей
    public static readonly IsUseSubaccs: boolean = false; // если использовать субакки, то бабки будут выводиться на субакки после прогона(англбридж)
    public static readonly modulesCount: IBridgeRange = { minRange: 1, maxRange: 1 }; // сколько будет модулей выполнено на аккаунте
    public static readonly retryCount: number = 15; // сколько попыток будет, чтобы получить новую сеть, значение для бриджа
    public static readonly delayBetweenAction: IDelayRange = { minRange: 2.2, maxRange: 4 }; // задержка между действиями (в секундах) в случае ошибки
    public static readonly delayBetweenAccounts: IDelayRange = { minRange: 60, maxRange: 85 }; // задержка между аккаунтами (в минутах)
    public static readonly delayBetweenModules: IDelayRange = { minRange: 1.2, maxRange: 2.5 }; // задержка между модулями (в минутах)
    public static readonly rpc = 'https://rpc.ankr.com/zksync_era';
    public static readonly ethereumRpc = 'https://rpc.ankr.com/eth'; // ethereum rpc
    public static readonly maxGwei = 4; // до какого гвея будет использоваться скрипт
    public static readonly delayBetweenGweiCheck: IDelayRange = { minRange: 0.3, maxRange: 1 }; // задержка перед получением нового гвея (в минутах)
}

export class ThrusterConfig {
    public static readonly isUse: boolean = true; // использовать ли Thruster в софте
    public static readonly circlesCount: IDelayRange = { minRange: 1, maxRange: 1 }; // сколкьо раз делать свапы
    public static readonly minSwapRangeEth: { range: IBridgeRange } = {
        range: { minRange: 0.1, maxRange: 0.16 },
    }; // ниже какой суммы свапать eth
    public static readonly minSwapRangeStable: { range: IBridgeRange } = {
        range: { minRange: 250, maxRange: 450 },
    }; // ниже какой суммы свапать стейблы
    public static readonly delayBetweenSwaps: IDelayRange = { minRange: 0.7, maxRange: 1.5 }; // задержка между свапами (в секундах)
    public static readonly swapPercentEth: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 5, maxRange: 10 },
        fixed: { minRange: 4, maxRange: 6 },
    }; // сколько eth в процентах останется после свапа
    public static readonly swapPercentStable: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.07, maxRange: 0.13 },
        fixed: { minRange: 3, maxRange: 5 },
    }; // сколько usbc в процентах останется после свапа это и выше поменять, потому что это должно быть проценты остаток
    public static readonly tokensPool: IToken[] = [
        // токены для свапов
        {
            name: 'ETH',
            contractAddress: '0x4300000000000000000000000000000000000004', // было  0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
            decimals: 18,
        },
        {
            name: 'USDB',
            contractAddress: '0x4300000000000000000000000000000000000003',
            decimals: 18,
        },
    ];
}

export class FenixConfig {
    public static readonly isUse: boolean = true; // использовать ли Fenix в софте
    public static readonly circlesCount: IDelayRange = { minRange: 1, maxRange: 1 }; // сколкьо раз делать свапы
    public static readonly minSwapRangeEth: { range: IBridgeRange } = {
        range: { minRange: 0.0001, maxRange: 0.0002 },
    }; // ниже какой суммы свапать eth
    public static readonly minSwapRangeStable: { range: IBridgeRange } = {
        range: { minRange: 0.4, maxRange: 1.2 },
    }; // ниже какой суммы свапать стейблы
    public static readonly delayBetweenSwaps: IDelayRange = { minRange: 0.7, maxRange: 1.5 }; // задержка между свапами (в секундах)
    public static readonly swapPercentEth: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 20, maxRange: 26 },
        fixed: { minRange: 4, maxRange: 6 },
    }; // сколько eth в процентах останется после свапа
    public static readonly swapPercentStable: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.6, maxRange: 1.2 },
        fixed: { minRange: 2, maxRange: 5 },
    }; // сколько usbc в процентах останется после свапа это и выше поменять, потому что это должно быть проценты остаток
}

export class RelayConfig {
    public static readonly isUse: boolean = true; // использовать ли мост relay
    public static readonly ethBridgeAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.01, maxRange: 0.02 },
        fixed: { minRange: 2, maxRange: 4 },
    }; // сколько ETH будет отправлено через бридж в сеть Blast, fixed - количество символов после запятой, т.е если выпадет рандомное количество range = 0.00001552254241 fixed будет 7
    // то будет отправлено 0.0000155
    public static readonly bridgePercentEthToBlast: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.2, maxRange: 0.4 },
        fixed: { minRange: 3, maxRange: 6 },
    }; // сколько процентов от имеющегося кол-ва будет оставаться в сети, с которой в бласт бридж идет
    public static readonly bridgePercentEth: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 55, maxRange: 70 },
        fixed: { minRange: 4, maxRange: 6 },
    }; // сколько процентов от имеющегося кол-ва будет оставаться на аккаунте ETH в сети Blast
    public static readonly data: IRelayBridgeData[] = [
        {
            chain: arbitrum,
            rpc: null,
        },
        {
            chain: optimism,
            rpc: 'https://optimism.meowrpc.com',
        },
        {
            chain: base,
            rpc: null,
        },
        {
            chain: linea,
            rpc: null,
        },
    ];
}

export class TransferConfig {
    public static readonly ethBridgeAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.149, maxRange: 0.2 },
        fixed: { minRange: 3, maxRange: 5 },
    }; // в каком диапазоне бриджить eth на биржу, fixed - количество символов после запятой, т.е если выпадет рандомное количество range = 0.00001552254241 fixed будет 7
    // то будет отправлено 0.0000155
    public static readonly bridgePercentEth: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.3, maxRange: 0.4 },
        fixed: { minRange: 4, maxRange: 6 },
    }; // сколько процентов от имеющегося кол-ва будет оставаться в сети, с которой отпрвлвяются деньги на биржу
}

export class BlazeConfig {
    public static readonly isUse: boolean = true; // использовать ли blaze минты
    public static readonly contracts: Hex[] = [
        '0xC9B827F6204a750ad8e39f8D6De01f3CD02Be131',
        '0x217FcD0642fc6522877F83cBf1b3A9AF909a1C88',
        '0x81145673461dE1F059951348C677c98da1C06D8c',
        '0xA5f7f93E6D2F955e187d77C4533C69396a9261de',
        '0xDE0E3Ec27B963546A6C5F8512ac4CE85Dc2350b6',
    ]; // адреса для минта, только со стоимостью 0.0005 eth
}

export class SpacebarConfig {
    public static readonly isUse: boolean = true; // использовать ли spacebar mint NFT
}

export class YologamesConfig {
    public static readonly isUse: boolean = true; // использовать ли yologames transfer native
}

export class CambriaConfig {
    public static readonly isUse: boolean = true; // использовать ли Cambria duel
}

export class MiscConfig {
    public static readonly isUse: boolean = true; // использовать ли misc transfer
}

export class OrbitConfig {
    public static readonly isUse: boolean = true; // использовать ли Orbit deposit
    public static readonly ethBridgeAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.0000015, maxRange: 0.000001 },
        fixed: { minRange: 8, maxRange: 13 },
    }; // в каком диапазоне получить value для минта(надо прям копейки) для, fixed - количество символов после запятой, т.е если выпадет рандомное количество range = 0.00001552254241 fixed будет 7
    // то будет отправлено 0.0000155
}

export class BlurDepositETHConfig {
    public static readonly isUse: boolean = false; // производить ли депозит в blur
    public static readonly ethDepositAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.0000015, maxRange: 0.000001 },
        fixed: { minRange: 8, maxRange: 13 },
    }; // сколько eth отпарвлять в пул
}

export class BlurWithdrawETHConfig {
    public static readonly isUse: boolean = true; // выводить ли из блюра
    public static readonly ethDepositAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.000005, maxRange: 0.000008 },
        fixed: { minRange: 7, maxRange: 10 },
    }; // сколько eth врапать
    public static readonly isWithdrawAllBalance: boolean = true; // выводить ли из блюра весь баланс, если true то выводить все, иначе будет из ethDepositAmount
}

export class BfxConfig {
    public static readonly isUse: boolean = true; // выводить ли bfx депозит
    public static readonly usdbBridgeAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.1, maxRange: 0.2 },
        fixed: { minRange: 2, maxRange: 4 },
    }; // в каком диапазоне отправлять usdb в BFX deposit(от 0.1) для, fixed - количество символов после запятой, т.е если выпадет рандомное количество range = 0.00001552254241 fixed будет 7
    // то будет отправлено 0.0000155
}

export class BlastrConfig {
    public static readonly isUseMintNFT: boolean = true; // использовать ли Blastr mint NFT
    public static readonly isUseBoostUnboost: boolean = true; // использовать ли boost/unboost
    public static readonly mintCount: IFixedRange = { minRange: 1, maxRange: 1 }; // сколько нфт минтить
    public static readonly contracts: Hex[] = [
        '0x338BCe2590495B6DE6a7D7aC8514Ad73E7Be0FFB',
        '0x5d852Bd7511277724D39eB9a134C1aE5E48a1804',
        '0x4c1bb1E30f500f6fafEB1809Fb572290029463dA',
        '0x5085bECB288309d70fdd832E47c18bC3926101Db',
        '0xcD1b5Fe42d9507eb24009d0060151318D2c0F4AF',
        '0xA4Dc5972FbE57033D93a8D8a1b80d893c7BB6685',
        '0x5BEB188B3F9cAA0869fd2BA62fDA4516573db8DB',
    ]; // только фри минты для blastr
    public static readonly boostContracts: Hex[] = [
        '0xF9D68FA74F506697Ef70F6E1E09A75BC2394E662',
        '0x88f9cabee97F2AF81b2cE0C968579cd73CD92D07',
        '0x03Ad5B13cA1a05Cb3E96678Ef3a1Fc6801670Fe1',
        '0x5092F65CE196c628e8b7219f7ede79D6838888D0',
        '0x46f5C0DC3d72690E17E079B971A75ad80bae58B0',
        '0x0e711e9943EcA5fE136d9ACf29c4B675c3afad7F',
        '0x26807dD250094e41D9133325b6bE871Ff1454E13',
        '0x3508ea096134bE423964054D338950aE3dAdC680',
        '0x045B9497214A8497aD72A45CCa9fBB164C5e95eE',
        '0x0085F5F82090478D8d840159bd91a3B07a37fC50',
        '0xE66c7C14E7035Fe158dB1f55eFF8a2CE7ca4df7c',
    ]; // контракты для буста
}

export class JuiceConfig {
    public static readonly isUse: boolean = true; // производить ли juice lend USDB
    public static readonly usdbDepositAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.01, maxRange: 0.2 },
        fixed: { minRange: 3, maxRange: 5 },
    }; // сколько usdb отправлять
}

export class WasabiConfig {
    public static readonly isUse: boolean = true; // производить ли wasabi lend USDB
    public static readonly usdbDepositAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.01, maxRange: 0.2 },
        fixed: { minRange: 3, maxRange: 5 },
    }; // сколько usdb отправлять
}
