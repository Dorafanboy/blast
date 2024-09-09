import { IBridgeRange, IFixedRange, IPreparedStageData, IRelayBridgeData, ISwapData, IToken } from './interfaces';
import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    Hex,
    http,
    parseEther,
    parseUnits,
    PrivateKeyAccount,
    PublicClient,
    SimulateContractReturnType,
    WalletClient,
} from 'viem';
import { blast, Config, RelayConfig, ThrusterConfig, TransferConfig } from '../../config';
import { delay } from '../helpers/delayer';
import { printError, printInfo, printSuccess } from '../logger/logPrinter';
import { erc20ABI } from '../../abis/erc20';
import { stagesData } from './utilsData';
import { infinityAmountApprove, offset } from '../../core/thruster/thrusterData';
import { addTextMessage } from '../telegram/telegramBot';

export async function getValue(
    client: PublicClient,
    address: Hex,
    bridgeRange: IBridgeRange,
    fixedRange: IFixedRange,
    decimals: number,
    tokenBalance: bigint = BigInt(-1),
): Promise<bigint> {
    const balance = tokenBalance == BigInt(-1) ? await getBridgeBalance(client, address) : tokenBalance;

    let value = 0,
        fixed,
        currentTry = 0;
    let weiValue: bigint = parseEther('0');

    if (balance == parseEther('0')) {
        return BigInt(-1);
    }

    while (weiValue > balance || weiValue == parseEther('0')) {
        if (currentTry < Config.retryCount) {
            value = Math.random() * (bridgeRange.maxRange - bridgeRange.minRange) + bridgeRange.minRange;
            fixed = Math.floor(Math.random() * (fixedRange.maxRange - fixedRange.minRange) + fixedRange.minRange);

            weiValue = parseUnits(value.toFixed(fixed), decimals);

            if (weiValue > balance) {
                printInfo(
                    `Полученное значение для свапа ${value.toFixed(
                        fixed,
                    )} больше чем баланс ${Number(formatUnits(balance, decimals)).toFixed(fixed)}`,
                );

                currentTry++;
                await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
            } else {
                return weiValue;
            }
        } else {
            printInfo(`Не было найдено необходимого кол-во средств для свапа в сети ${client.chain?.name}\n`);

            return BigInt(-1);
        }
    }

    return weiValue;
}

export async function getValue2(
    client: PublicClient,
    address: Hex,
    bridgeRange: IBridgeRange,
    fixedRange: IFixedRange,
    isBridge: boolean,
    tokenBalance: bigint = BigInt(-1),
): Promise<bigint> {
    const balance = tokenBalance == BigInt(-1) ? await getBridgeBalance(client, address) : tokenBalance;

    let value = 0,
        fixed,
        currentTry = 0;
    let weiValue: bigint = parseEther('0');
    const decimals = isBridge ? 18 : 6;

    if (balance == parseEther('0')) {
        return BigInt(-1);
    }

    while (weiValue > balance || weiValue == parseEther('0')) {
        if (currentTry < Config.retryCount) {
            value = Math.random() * (bridgeRange.maxRange - bridgeRange.minRange) + bridgeRange.minRange;
            fixed = Math.floor(Math.random() * (fixedRange.maxRange - fixedRange.minRange) + fixedRange.minRange);

            weiValue = parseEther(value.toFixed(fixed));
            const compareValue = isBridge ? weiValue : parseUnits(value.toFixed(fixed), 6);

            if (compareValue > balance) {
                printInfo(
                    `Полученное значение для ${isBridge ? 'бриджа' : 'свапа'} ${value.toFixed(
                        fixed,
                    )} больше чем баланс ${Number(formatUnits(balance, decimals)).toFixed(fixed)}`,
                );

                currentTry++;
                await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
            } else {
                return isBridge ? weiValue : parseUnits(value.toFixed(fixed), 6);
            }
        } else {
            printInfo(
                `Не было найдено необходимого кол-во средств для ${isBridge ? 'бриджа' : 'свапа'} в сети ${
                    client.chain?.name
                }\n`,
            );

            return BigInt(-1);
        }
    }

    return isBridge ? weiValue : parseUnits(value.toFixed(fixed), 6);
}

export async function getBridgeBalance(client: PublicClient, address: Hex) {
    const balance = await client.getBalance({
        address: address,
    });

    await checkZeroBalance(client, balance);

    return balance;
}

async function checkZeroBalance(client: PublicClient, balance: bigint, tokenName: string = '') {
    if (balance == parseEther('0')) {
        printInfo(`Баланс аккаунта в токене ${tokenName} сети ${client.chain?.name} равен нулю\n`);

        await delay(1, 2, false);

        return parseEther('0');
    }
}

export async function giveApprove(
    client: PublicClient,
    walletClient: WalletClient,
    account: PrivateKeyAccount,
    token: IToken,
    spender: Hex,
    value: bigint,
) {
    const allowance = await client.readContract({
        address: token.contractAddress,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [account.address, spender],
    });

    if (allowance < BigInt(value!)) {
        printInfo(`Произвожу approve ${formatUnits(value!, token.decimals)} ${token.name}`);

        const { request } = await client
            .simulateContract({
                address: token.contractAddress,
                abi: erc20ABI,
                functionName: 'approve',
                args: [spender, value!],
                account: account,
            })
            .then((request) => request as unknown as SimulateContractReturnType)
            .catch((e) => {
                printError(`Произошла ошибка во время выполнения approve ${token.name} - ${e}`);
                return { request: undefined };
            });

        if (request !== undefined && request.account !== undefined) {
            const approveHash = await walletClient.writeContract(request).catch((e) => {
                printError(`Произошла ошибка во время выполнения approve ${token.name} - ${e}`);
                return false;
            });

            if (approveHash === false) {
                return false;
            }

            const url = `${blast.blockExplorers?.default.url + '/tx/' + approveHash}`;

            printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

            await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);
        }
    }
}

export async function getSwapBalance(client: PublicClient, address: Hex, tokenAddress: Hex, tokenName: string = '') {
    const balance = await client.readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [address],
    });

    await checkZeroBalance(client, parseUnits(balance.toString(), 0), tokenName);

    return balance;
}

export async function getSwapData(
    isEth: boolean,
    client: PublicClient,
    address: Hex,
    moduleName: string,
    range: IBridgeRange,
    fixed: IFixedRange,
    ethMinRange?: string,
    stableMinRange?: string,
): Promise<ISwapData> {
    let currentTry: number = 0;

    while (currentTry <= Config.retryCount) {
        if (currentTry == Config.retryCount) {
            printError(
                `Не нашел баланс для свапа в ${moduleName} [getSwapData (current Try)]. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return {
                value: BigInt(-1),
                srcToken: null,
                dstToken: null,
            };
        }

        const srcToken = await findTokenWithBalance(client, address, isEth, ethMinRange!, stableMinRange!);
        if (srcToken == null) {
            printError(`Не нашел баланс для свапа в ${moduleName} [getSwapData (srcToken is null)].`);
            return {
                value: BigInt(-1),
                srcToken: null,
                dstToken: null,
            };
        }

        const dstToken = await getRandomToken(srcToken.name);

        // value = await getValue(client, address, range, fixed, srcToken.decimals, balance);
        //
        // printInfo(
        //     `Пытаюсь произвести свап в сети ${client.chain?.name} на сумму ${formatUnits(value, srcToken.decimals)} ${srcToken.name} -> ${dstToken.name}`,
        // );

        currentTry++;

        return {
            value: BigInt(0),
            srcToken: srcToken,
            dstToken: dstToken,
        };
    }

    return {
        value: BigInt(-1),
        srcToken: null,
        dstToken: null,
    };
}

export async function findTokenWithBalance(
    client: PublicClient,
    address: string,
    isEth: boolean,
    ethMinRange: string,
    stableMinRange: string,
): Promise<IToken | null> {
    ThrusterConfig.tokensPool.sort(() => Math.random() - 0.5);

    if (isEth) {
        const token = ThrusterConfig.tokensPool.find((token) => token.name === 'ETH')!;

        const balance = await getBridgeBalance(client, <`0x${string}`>address);

        printInfo(`Пытаюсь найти баланс в токене ${token.name}`);

        if (balance > parseEther(ethMinRange)) {
            return token;
        }
    } else {
        const filteredTokens = ThrusterConfig.tokensPool.filter((token) => token.name !== 'ETH');

        for (let i = 0; i < filteredTokens.length; i++) {
            const token = filteredTokens[i];

            const balance = await getSwapBalance(client, <`0x${string}`>address, token.contractAddress, token.name);

            printInfo(`Пытаюсь найти баланс в токене ${token.name}`);

            if (balance > parseUnits(stableMinRange, token.decimals)) {
                return token;
            }
        }
    }

    return null;
}

function getRandomToken(excludeTokenName: string): IToken {
    const filteredTokens = ThrusterConfig.tokensPool.filter((token) => token.name !== excludeTokenName);

    filteredTokens.sort(() => Math.random() - 0.5);

    const randomIndex = Math.floor(Math.random() * filteredTokens.length);
    return filteredTokens[randomIndex];
}

export async function prepareStage(
    moduleName: string,
    isEth: boolean,
    account: PrivateKeyAccount,
): Promise<IPreparedStageData> {
    //printInfo(`Выполняю модуль ${moduleName} from ${isEth ? 'ETH' : 'STABLE'}`);

    // @ts-ignore
    const client: PublicClient = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const stageData = stagesData.find((data) => data.moduleName === moduleName);
    if (stageData == undefined) {
        printError(`Ошибка в поиске даты`);
        return {
            client: client,
            swapData: null,
        };
    }

    const range = isEth ? stageData?.ethValue.range : stageData?.stableValue.range;
    const fixed = isEth ? stageData?.ethValue.fixed : stageData?.stableValue.fixed;

    const minRange = isEth ? stageData?.minEthValue.range : stageData?.minStableValue.range;

    const swapData = await getSwapData(
        isEth,
        client,
        account.address,
        moduleName,
        range,
        fixed,
        minRange?.minRange.toString(),
        minRange?.minRange.toString(),
    );

    if (swapData.value == BigInt(-1)) {
        printError(`Не нашел баланс для свапа в ${moduleName}[prepareStage].`);
        return {
            client: client,
            swapData: swapData,
        };
    }

    const newFixed = Math.floor(Math.random() * (fixed?.maxRange - fixed.minRange) + fixed.minRange);
    const newPercent = (Math.random() + offset) * (range.maxRange - range.minRange) + range.minRange;

    printInfo(`Буду оставлять ${newPercent.toFixed(newFixed)}% ${swapData.srcToken?.name} на аккаунте `);

    const balance =
        swapData.srcToken!.name == 'ETH'
            ? await getBridgeBalance(client, account.address)
            : await getSwapBalance(client, account.address, swapData.srcToken!.contractAddress);

    const scaleFactor = BigInt(10 ** newFixed);
    const percentBigInt = BigInt(Math.round(newPercent * Number(scaleFactor)));
    const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));

    printInfo(
        `Оставлю на балансе аккаунта ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ${swapData.srcToken?.name}`,
    ); // to fixed норм сделать

    const value = balance - bridgeValue;
    let str = value.toString();
    str = str.substring(0, str.length - (18 - newFixed)) + '0'.repeat(18 - newFixed);
    const fixedValue = BigInt(str);
    swapData.value = fixedValue;

    if (swapData.srcToken!.name != 'ETH') {
        await giveApprove(
            client!,
            walletClient,
            account,
            swapData.srcToken!,
            stageData.spenderContractAddress,
            infinityAmountApprove,
        );
    }

    printInfo(
        `Произвожу свап в сети ${client!.chain?.name} на сумму ${formatUnits(swapData.value, swapData!.srcToken?.decimals!)} ${swapData.srcToken!.name} -> ${swapData.dstToken!.name}`,
    );

    return {
        client: client,
        swapData: swapData,
    };
}

export async function transfer(account: PrivateKeyAccount, addressToWithdraw: string) {
    let currentTry = 0,
        value;

    if (addressToWithdraw == '0x') {
        printInfo(`Аккаунт для субсчета не указан => выводить на биржу не надо.`);
        return true;
    }

    let client: PublicClient;
    let data: IRelayBridgeData | null;

    while (currentTry <= Config.retryCount) {
        if (currentTry == Config.retryCount) {
            printError(`Произошла ошибка во время выполнения модуля Withdraw to subacc`);

            return false;
        }

        printInfo(`Ищу сеть, в которую отправить средства и затем на биржу.`);

        data = await findNetworkWithBalance(account);

        client = createPublicClient({
            chain: data!.chain,
            transport: data!.rpc! == null ? http() : http(data!.rpc!),
        });

        const fixed = Math.floor(
            Math.random() *
                (TransferConfig.bridgePercentEth.fixed.maxRange - TransferConfig.bridgePercentEth.fixed.minRange) +
                TransferConfig.bridgePercentEth.fixed.minRange,
        );

        const percent =
            (Math.random() + offset) *
                (TransferConfig.bridgePercentEth.range.maxRange - TransferConfig.bridgePercentEth.range.minRange) +
            TransferConfig.bridgePercentEth.range.minRange;

        const balance = await getBridgeBalance(client, account.address);

        printInfo(`Буду оставлять ${percent.toFixed(fixed)}% на аккаунте ETH`);

        const scaleFactor = BigInt(10 ** fixed);
        const percentBigInt = BigInt(Math.round(percent * Number(scaleFactor)));
        const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));

        printInfo(
            `Оставлю на балансе аккаунта в сети ${blast.name} ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ETH`,
        );

        const bridgeValue2 = balance - bridgeValue;
        let str = bridgeValue2.toString();
        str = str.substring(0, str.length - (18 - fixed)) + '0'.repeat(18 - fixed);

        value = BigInt(str);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        }
    }

    const walletClient = createWalletClient({
        chain: data!.chain,
        transport: data!.rpc! == null ? http() : http(data!.rpc!),
    });

    printInfo(
        `Буду выводить на субадрес - ${addressToWithdraw} ${formatUnits(value!, 18)} ETH, сеть - ${data!.chain.name}`,
    );

    const prepareTransaction = await walletClient.prepareTransactionRequest({
        account,
        to: <`0x${string}`>addressToWithdraw,
        data: '0x',
        value: value!,
    });

    const signature = await walletClient.signTransaction(prepareTransaction).catch((e) => {
        printError(`Произошла ошибка во время выполнения модуля Withdraw to subacc - ${e}`);
        return undefined;
    });

    if (signature !== undefined) {
        const hash = await walletClient.sendRawTransaction({ serializedTransaction: signature }).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля Withdraw to subacc - ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${data!.chain.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(
            `✅Transfer: withdraw from ${data!.chain.name} ${formatUnits(
                value!,
                18,
            )} ETH to ${addressToWithdraw} <a href='${url}'>link</a>`,
        );
    }

    return true;
}

async function findNetworkWithBalance(account: PrivateKeyAccount): Promise<IRelayBridgeData | null> {
    for (let i = 0; i < RelayConfig.data.length; i++) {
        const chain = RelayConfig.data[i];

        const client = createPublicClient({
            chain: chain.chain,
            transport: chain.rpc == null ? http() : http(chain.rpc),
        });

        printInfo(`Пытаюсь найти баланс ETH в сети ${chain.chain.name}`);

        const balance = await getBridgeBalance(client, account.address);

        if (balance > parseUnits(RelayConfig.ethBridgeAmount.range.minRange.toString(), 18)) {
            return chain;
        }
    }

    return null;
}
