import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config, FenixConfig } from '../../config';
import { createWalletClient, formatUnits, http, PrivateKeyAccount } from 'viem';
import { findTokenWithBalance, getSwapBalance, giveApprove, prepareStage } from '../../data/utils/utils';
import console from 'node:console';
import { delay } from '../../data/helpers/delayer';
import { IPreparedStageData, IToken } from '../../data/utils/interfaces';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { eeContractAddress, fenixContractAddress, fenixModuleName } from './fenixData';
import { infinityAmountApprove, offset } from '../thruster/thrusterData';
import { fenixGetTxData } from './fenixRequester';

export async function fenixSwap(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${fenixModuleName}`);

    const circlesCount = Math.floor(
        Math.random() * (FenixConfig.circlesCount.maxRange - FenixConfig.circlesCount.minRange) +
            FenixConfig.circlesCount.minRange,
    );

    printInfo(`Было выбрано рандомно ${circlesCount} кругов`);

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    let volume = BigInt(0);

    let dstTokens: IToken[] = [];

    for (let i = 0; i < circlesCount; i++) {
        let currentTry: number = 0;
        let isEth = Math.random() < 0.5; //Math.random() < 0.5
        let prepareStageData: IPreparedStageData = {
            client: null,
            swapData: null,
        };

        printInfo(`Произвожу ${i + 1}/${circlesCount} кругов`);

        while (currentTry <= Config.retryCount) {
            if (currentTry >= Config.retryCount) {
                printError(`Не удалось произвести swap ${fenixModuleName}`);
                return false;
            }

            isEth = false; //Math.random() < 0.5

            printInfo(`Буду производить свап из ${isEth ? 'ETH' : 'not ETH'}`);

            prepareStageData = await prepareStage(fenixModuleName, isEth, account);

            if (prepareStageData.swapData?.value == BigInt(-1)) {
                printError(`Не удалось произвести swap ${fenixModuleName}, буду пробовать снова`);
                printInfo(`Текущая попытка: ${currentTry + 1}/${Config.retryCount}`);
                currentTry++;
            } else {
                currentTry = Config.retryCount + 1;
            }

            if (isEth && i == circlesCount - 1) {
                printInfo(
                    `Т.к это последний круг, и вся основная сумма находится в ETH, дальше не будет произведено свапа`,
                );
                printInfo(`Прогон объемов завершен, общая сумма: ${formatUnits(BigInt(volume), 18)} ETH`);
                return true;
            }

            if (isEth == false && i == circlesCount - 1) {
                dstTokens = dstTokens.sort(() => Math.random() - 0.5);
                printInfo(
                    `Т.к это последний круг, то буду отправлять всю сумму в ETH, перемешал dstTokens, количество токенов - ${dstTokens.length}`,
                ); // сделать проверку что там хотя бы минималка есть

                const srcToken = await findTokenWithBalance(
                    prepareStageData.client!,
                    account.address,
                    isEth,
                    FenixConfig.minSwapRangeStable.range.minRange.toString(),
                    FenixConfig.minSwapRangeStable.range.minRange.toString(),
                );

                if (srcToken != null) {
                    printInfo(`Токен больше минималки из конфига.`);
                    if (dstTokens.length == 0) {
                        prepareStageData!.swapData!.srcToken = srcToken;

                        const range = FenixConfig.swapPercentStable.range;
                        const fixed = FenixConfig.swapPercentStable.fixed;

                        const newFixed = Math.floor(
                            Math.random() * (fixed?.maxRange - fixed.minRange) + fixed.minRange,
                        );
                        const newPercent =
                            (Math.random() + offset) * (range.maxRange - range.minRange) + range.minRange;

                        printInfo(
                            `Буду оставлять ${newPercent.toFixed(newFixed)}% ${prepareStageData.swapData?.srcToken.name} на аккаунте `,
                        );

                        const balance = await getSwapBalance(
                            prepareStageData.client!,
                            account.address,
                            prepareStageData.swapData?.srcToken.contractAddress!,
                        );

                        const scaleFactor = BigInt(10 ** newFixed);
                        const percentBigInt = BigInt(Math.round(newPercent * Number(scaleFactor)));
                        const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));

                        printInfo(
                            `Оставлю на балансе аккаунта ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ${prepareStageData.swapData?.srcToken.name}`,
                        );

                        const value = balance - bridgeValue;
                        let str = value.toString();
                        str = str.substring(0, str.length - (18 - newFixed)) + '0'.repeat(18 - newFixed);
                        const fixedValue = BigInt(str);
                        prepareStageData!.swapData!.value = fixedValue;

                        await giveApprove(
                            prepareStageData.client!,
                            walletClient,
                            account,
                            prepareStageData!.swapData!.srcToken,
                            fenixContractAddress,
                            infinityAmountApprove,
                        );

                        printInfo(
                            `Произвожу свап в сети ${prepareStageData.client!.chain?.name} на сумму ${formatUnits(prepareStageData.swapData?.value!, prepareStageData.swapData?.srcToken.decimals!)} ${prepareStageData.swapData?.srcToken.name} -> ${prepareStageData.swapData?.dstToken!.name}`,
                        );

                        printInfo(
                            `Произвожу свап ${formatUnits(prepareStageData.swapData?.value!, prepareStageData.swapData?.srcToken.decimals!)} ${prepareStageData.swapData?.srcToken.name} -> ETH`,
                        );

                        await fenixMakeTx(account, prepareStageData);
                    }

                    for (let j = 0; j < dstTokens.length; j++) {
                        prepareStageData!.swapData!.srcToken = dstTokens[j];

                        const range = FenixConfig.swapPercentStable.range;
                        const fixed = FenixConfig.swapPercentStable.fixed;

                        const newFixed = Math.floor(
                            Math.random() * (fixed?.maxRange - fixed.minRange) + fixed.minRange,
                        );
                        const newPercent =
                            (Math.random() + offset) * (range.maxRange - range.minRange) + range.minRange;

                        printInfo(
                            `Буду оставлять ${newPercent.toFixed(newFixed)}% ${prepareStageData.swapData?.srcToken.name} на аккаунте `,
                        );

                        const balance = await getSwapBalance(
                            prepareStageData.client!,
                            account.address,
                            prepareStageData.swapData?.srcToken.contractAddress!,
                        );

                        const scaleFactor = BigInt(10 ** newFixed);
                        const percentBigInt = BigInt(Math.round(newPercent * Number(scaleFactor)));
                        const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));

                        printInfo(
                            `Оставлю на балансе аккаунта ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ${prepareStageData.swapData?.srcToken.name}`,
                        );

                        const value = balance - bridgeValue;
                        let str = value.toString();
                        str = str.substring(0, str.length - (18 - newFixed)) + '0'.repeat(18 - newFixed);
                        const fixedValue = BigInt(str);
                        prepareStageData!.swapData!.value = fixedValue;

                        await giveApprove(
                            prepareStageData.client!,
                            walletClient,
                            account,
                            prepareStageData!.swapData!.srcToken,
                            fenixContractAddress,
                            infinityAmountApprove,
                        );

                        printInfo(
                            `Произвожу свап в сети ${prepareStageData.client!.chain?.name} на сумму ${formatUnits(prepareStageData.swapData?.value!, prepareStageData.swapData?.srcToken.decimals!)} ${prepareStageData.swapData?.srcToken.name} -> ${prepareStageData.swapData?.dstToken!.name}`,
                        );

                        printInfo(
                            `Произвожу свап ${prepareStageData.swapData?.value} ${prepareStageData.swapData?.srcToken.name} -> ETH`,
                        );

                        await fenixMakeTx(account, prepareStageData);
                    }
                }

                return true;
            }
        }

        await fenixMakeTx(account, prepareStageData);
    }

    printInfo(`Прогон объемов завершен, общая сумма: ${formatUnits(BigInt(volume), 18)} ETH`);

    return true;

    async function fenixMakeTx(account: PrivateKeyAccount, prepareStageData: IPreparedStageData) {
        if (prepareStageData.swapData?.dstToken?.name != 'ETH') {
            if (!dstTokens.includes(prepareStageData.swapData?.dstToken!)) {
                printInfo(`Добавил новый токен для будущей отправки в ETH\n`);
                dstTokens.push(prepareStageData.swapData?.dstToken!);
            }
        }

        const data = await fenixGetTxData({
            inTokenAddress: prepareStageData.swapData?.srcToken?.contractAddress.toString(),
            outTokenAddress:
                prepareStageData.swapData?.dstToken?.name == 'ETH'
                    ? eeContractAddress
                    : prepareStageData.swapData?.dstToken?.contractAddress.toString(),
            amount: formatUnits(
                prepareStageData.swapData!.value!,
                prepareStageData.swapData!.srcToken?.decimals!,
            ).toString(),
            slippage: '0.5',
            account: account.address,
        });

        const preparedTransaction = await walletClient.prepareTransactionRequest({
            account,
            to: fenixContractAddress,
            data: data,
            value:
                prepareStageData.swapData!.srcToken!.name == 'ETH'
                    ? BigInt(prepareStageData.swapData!.value)
                    : BigInt(0),
        });

        volume += prepareStageData!.swapData?.value!;

        const signature = await walletClient.signTransaction(preparedTransaction).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля prepare ${fenixModuleName} ${e}`);
            return undefined;
        });

        if (signature !== undefined) {
            const hash = await walletClient.sendRawTransaction({ serializedTransaction: signature }).catch((e) => {
                printError(`Произошла ошибка во время выполнения модуля ${fenixModuleName} ${e}`);
                return false;
            });

            if (hash == false) {
                return false;
            }

            const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

            printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

            await addTextMessage(
                `✅${fenixModuleName}: swap ${formatUnits(prepareStageData.swapData!.value!, prepareStageData.swapData!.srcToken?.decimals!)} ${prepareStageData.swapData!.srcToken!.name} -> ${prepareStageData.swapData!.dstToken!.name} <a href='${url}'>link</a>`,
            );
        }

        await delay(FenixConfig.delayBetweenSwaps.minRange, FenixConfig.delayBetweenSwaps.maxRange, true);
    }
}
