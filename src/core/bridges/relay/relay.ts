import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    parseUnits,
    PrivateKeyAccount,
    PublicClient,
    zeroAddress,
} from 'viem';
import { relayModuleNameFromBlast, relayModuleNameToBlast } from './relayData';
import { printError, printInfo, printSuccess } from '../../../data/logger/logPrinter';
import { blast, Config, RelayConfig, ThrusterConfig, TransferConfig } from '../../../config';
import { getBridgeBalance, getSwapBalance, getValue2 } from '../../../data/utils/utils';
import { delay } from '../../../data/helpers/delayer';
import {
    IRelayBridgeData,
    IRelayBridgeRequestData,
    IRelayBridgeResponseData,
    IRelayConfigRequestData,
} from '../../../data/utils/interfaces';
import { getBridgeData, getConfigData } from './relayRequester';
import { SendRawTransactionParameters, SignTransactionParameters } from 'viem/actions';
import { offset } from '../../thruster/thrusterData';
import { zkSync } from 'viem/chains';
import { checkGwei } from '../../../data/helpers/gweiChecker';

export async function relayBridgeToBlast(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${relayModuleNameToBlast}`);

    let currentTry: number = 0,
        value;

    let client: PublicClient;
    let data: IRelayBridgeData;
    let fee: bigint;
    let bridgeDataResponse: IRelayBridgeResponseData;

    while (currentTry <= Config.retryCount) {
        if (currentTry >= Config.retryCount) {
            printError(
                `Не нашел баланс для бриджа из сетей. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        for (let i = 0; i < RelayConfig.data.length; i++) {
            data = RelayConfig.data[i];

            client = createPublicClient({
                chain: data.chain,
                transport: data.rpc == null ? http() : http(data.rpc),
            });

            const balance = await getBridgeBalance(client, account.address);

            if (balance < parseUnits(RelayConfig.ethBridgeAmount.range.minRange.toString(), 18)) {
                continue;
            }

            let findValueRetryCount = 0;

            while (findValueRetryCount <= Config.retryCount) {
                const fixed = Math.floor(
                    Math.random() *
                        (RelayConfig.bridgePercentEthToBlast.fixed.maxRange -
                            RelayConfig.bridgePercentEthToBlast.fixed.minRange) +
                        RelayConfig.bridgePercentEthToBlast.fixed.minRange,
                );

                const percent =
                    (Math.random() + offset) *
                        (RelayConfig.bridgePercentEthToBlast.range.maxRange -
                            RelayConfig.bridgePercentEthToBlast.range.minRange) +
                    RelayConfig.bridgePercentEthToBlast.range.minRange;

                const balance = await getBridgeBalance(client, account.address);

                printInfo(`Буду оставлять ${percent.toFixed(fixed)}% на аккаунте ETH`);

                const scaleFactor = BigInt(10 ** fixed);
                const percentBigInt = BigInt(Math.round(percent * Number(scaleFactor)));
                const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));

                printInfo(
                    `Оставлю на балансе аккаунта в сети ${blast.name} ${Number(formatUnits(bridgeValue, 18)).toFixed(
                        18,
                    )} ETH`,
                );

                const bridgeValue2 = balance - bridgeValue;
                let str = bridgeValue2.toString();
                str = str.substring(0, str.length - (18 - fixed)) + '0'.repeat(18 - fixed);

                value = BigInt(str);
                const configData: IRelayConfigRequestData = {
                    originChainId: data!.chain.id,
                    destinationChainId: 81457,
                    currency: zeroAddress,
                    user: zeroAddress,
                };

                const configDataResponse = await getConfigData(configData);

                if (value != null && value != BigInt(-1)) {
                    if (configDataResponse.enabled == false) {
                        printError(`Бридж ${data!.chain.name} -> Blast не доступен`);
                        return false;
                    } else {
                        printSuccess(`Бридж ${data!.chain.name} -> Blast доступен`);

                        if (Number(value!.toString()) > Number(configDataResponse.capacityPerRequest!.toString())) {
                            printError(
                                `Лимит для бриджа ${data!.chain.name} -> Blast (${formatUnits(BigInt(configDataResponse.capacityPerRequest!), 18)}) меньше чем сумма бриджа ${formatUnits(value!, 18)} ETH`,
                            );
                            return false;
                        }

                        const bridgeData: IRelayBridgeRequestData = {
                            user: account.address.toString(),
                            originChainId: data!.chain.id,
                            destinationChainId: 81457,
                            currency: 'eth',
                            recipient: account.address,
                            amount: value!.toString(),
                            usePermit: false,
                            useExternalLiquidity: false,
                            source: 'relay.link',
                        };

                        bridgeDataResponse = await getBridgeData(bridgeData);
                    }

                    fee = BigInt(bridgeDataResponse.value) - value!;

                    printInfo(
                        `Пытаюсь произвести бридж ${formatUnits(value!, 18)} ${data!.chain.nativeCurrency.symbol}, fee - ${formatUnits(fee!, 18)} ETH ${data!.chain.name} -> Blast\n`,
                    );

                    const sumResult = fee + value!;

                    if (balance > sumResult) {
                        printInfo(`Баланс - ${formatUnits(balance, 18)} ETH, надо - ${formatUnits(sumResult, 18)} ETH`);
                        currentTry = Config.retryCount + 1;
                        findValueRetryCount = Config.retryCount + 1;
                        i = RelayConfig.data.length + 1;
                    } else {
                        printInfo(`Недостаточно баланса для бриджа - ${findValueRetryCount}/${Config.retryCount}.`);
                        await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
                        findValueRetryCount++;
                    }
                }
            }
        }

        currentTry++;
    }

    printInfo(
        `Произвожу бридж ${formatUnits(value!, 18)} ${data!.chain.nativeCurrency.symbol}, fee - ${formatUnits(fee!, 18)} ETH ${data!.chain.name} -> Blast\n`,
    );

    const walletClient = createWalletClient({
        chain: data!.chain,
        transport: data!.rpc == null ? http() : http(data!.rpc),
    });

    const request = await walletClient
        .prepareTransactionRequest({
            account,
            to: bridgeDataResponse!.to,
            data: bridgeDataResponse!.data,
            value: BigInt(bridgeDataResponse!.value),
        })
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${relayModuleNameToBlast} - ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const signature = await walletClient.signTransaction(request as SignTransactionParameters);
        const params: SendRawTransactionParameters = {
            serializedTransaction: signature,
        };

        const hash = await walletClient.sendRawTransaction(params);

        const url = `${data!.chain.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);
    }

    return true;
}

export async function relayBridgeFromBlast(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${relayModuleNameFromBlast}`);

    let currentTry: number = 0,
        value;

    let client: PublicClient;
    let fee: bigint;
    let bridgeDataResponse: IRelayBridgeResponseData;
    let randomData: IRelayBridgeData;

    while (currentTry <= Config.retryCount) {
        if (currentTry >= Config.retryCount) {
            printError(
                `Не нашел баланс для бриджа из сетей. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        const randomIndex = Math.floor(Math.random() * RelayConfig.data.length);
        randomData = RelayConfig.data[randomIndex];

        client = createPublicClient({
            chain: zkSync,
            transport: Config.rpc == null ? http() : http(Config.rpc),
        }) as PublicClient;

        const balance = await getBridgeBalance(client, account.address);

        console.log(balance, parseUnits(RelayConfig.ethBridgeAmount.range.minRange.toString(), 18));

        if (balance < parseUnits(RelayConfig.ethBridgeAmount.range.minRange.toString(), 18)) {
            console.log('sffss');
            continue;
        }

        let findValueRetryCount = 0;

        while (findValueRetryCount <= Config.retryCount) {
            const fixed = Math.floor(
                Math.random() *
                    (RelayConfig.bridgePercentEth.fixed.maxRange - RelayConfig.bridgePercentEth.fixed.minRange) +
                    RelayConfig.bridgePercentEth.fixed.minRange,
            );

            const percent =
                (Math.random() + offset) *
                    (RelayConfig.bridgePercentEth.range.maxRange - RelayConfig.bridgePercentEth.range.minRange) +
                RelayConfig.bridgePercentEth.range.minRange;

            const balance = await getBridgeBalance(client, account.address);

            printInfo(`Буду оставлять ${percent.toFixed(fixed)}% на аккаунте ETH`);

            const scaleFactor = BigInt(10 ** fixed);
            const percentBigInt = BigInt(Math.round(percent * Number(scaleFactor)));
            const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));

            printInfo(
                `Оставлю на балансе аккаунта в сети ZkSync ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ETH`,
            );

            const bridgeValue2 = balance - bridgeValue;
            let str = bridgeValue2.toString();
            str = str.substring(0, str.length - (18 - fixed)) + '0'.repeat(18 - fixed);

            value = BigInt(str);

            const configData: IRelayConfigRequestData = {
                originChainId: 324,
                destinationChainId: 1,
                currency: zeroAddress,
                user: zeroAddress,
            };

            await checkGwei();

            const configDataResponse = await getConfigData(configData);

            if (value != null && value != BigInt(-1)) {
                if (configDataResponse.enabled == false) {
                    printError(`Бридж ZkSync -> Ethereum не доступен`);
                    return false;
                } else {
                    printSuccess(`Бридж ZkSync -> Ethereum доступен`);

                    if (Number(value!.toString()) > Number(configDataResponse.capacityPerRequest!.toString())) {
                        printError(
                            `Лимит для бриджа ZkSync -> Ethereum (${formatUnits(BigInt(configDataResponse.capacityPerRequest!), 18)}) меньше чем сумма бриджа ${formatUnits(value!, 18)} ETH`,
                        );
                        return false;
                    }

                    const bridgeData: IRelayBridgeRequestData = {
                        user: account.address.toString(),
                        originChainId: 324,
                        destinationChainId: 1,
                        currency: 'eth',
                        recipient: account.address,
                        amount: value!.toString(),
                        usePermit: false,
                        useExternalLiquidity: false,
                        source: 'relay.link',
                    };

                    bridgeDataResponse = await getBridgeData(bridgeData);
                }

                fee = BigInt(bridgeDataResponse.value) - value!;

                printInfo(
                    `Пытаюсь произвести бридж ${formatUnits(value!, 18)} ${blast!.nativeCurrency.symbol}, fee - ${formatUnits(fee!, 18)} ETH ZkSync -> Ethereum\n`,
                );

                const sumResult = fee + value!;

                if (balance > sumResult) {
                    printInfo(`Баланс - ${formatUnits(balance, 18)} ETH, надо - ${formatUnits(sumResult, 18)} ETH`);
                    currentTry = Config.retryCount + 1;
                    findValueRetryCount = Config.retryCount + 1;
                } else {
                    printInfo(`Недостаточно баланса для бриджа - ${findValueRetryCount}/${Config.retryCount}.`);
                    await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
                    findValueRetryCount++;
                }
            }
        }

        currentTry++;
    }

    printInfo(
        `Произвожу бридж ${formatUnits(value!, 18)} ${blast.nativeCurrency.symbol}, fee - ${formatUnits(fee!, 18)} ETH ZkSync -> Ethereum\n`,
    );

    const walletClient = createWalletClient({
        chain: zkSync,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const request = await walletClient
        .prepareTransactionRequest({
            account,
            to: bridgeDataResponse!.to,
            data: bridgeDataResponse!.data,
            value: BigInt(bridgeDataResponse!.value),
        })
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${relayModuleNameFromBlast} - ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const signature = await walletClient.signTransaction(request as SignTransactionParameters);
        const params: SendRawTransactionParameters = {
            serializedTransaction: signature,
        };

        const hash = await walletClient.sendRawTransaction(params);

        const url = `${zkSync!.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);
    }

    return true;
}
