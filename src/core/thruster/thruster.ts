import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config, ThrusterConfig } from '../../config';
import { createWalletClient, encodeFunctionData, formatUnits, http, PrivateKeyAccount, zeroAddress } from 'viem';
import {
    findTokenWithBalance,
    getBridgeBalance,
    getSwapBalance,
    getSwapData,
    giveApprove,
    prepareStage,
} from '../../data/utils/utils';
import {
    blastWETHContractAddress,
    infinityAmountApprove,
    offset,
    selector,
    thrusterContractAddress,
    thrusterModuleName,
} from './thrusterData';
import { generateTokenTest, getQuote } from './thrusterRequester';
import console from 'node:console';
import { thrusterABI } from '../../abis/thrusterABI';
import { delay } from '../../data/helpers/delayer';
import { IPreparedStageData, IToken } from '../../data/utils/interfaces';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { bfxDeposit } from '../bfx/bfx';

export async function thrusterSwap(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${thrusterModuleName}`);

    const circlesCount = Math.floor(
        Math.random() * (ThrusterConfig.circlesCount.maxRange - ThrusterConfig.circlesCount.minRange) +
            ThrusterConfig.circlesCount.minRange,
    );

    printInfo(`Было выбрано рандомно ${circlesCount} кругов`);

    const isDepositBfx = false;

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    let volume = BigInt(0);

    const token = await generateTokenTest();
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
                printError(`Не удалось произвести swap ${thrusterModuleName}`);
                return false;
            }

            isEth = Math.random() < 0.5; //Math.random() < 0.5

            printInfo(`Буду производить свап из ${isEth ? 'ETH' : 'not ETH'}`);

            prepareStageData = await prepareStage(thrusterModuleName, isEth, account);

            if (prepareStageData.swapData?.value == BigInt(-1)) {
                printError(`Не удалось произвести swap ${thrusterModuleName}, буду пробовать снова`);
                printInfo(`Текущая попытка: ${currentTry + 1}/${Config.retryCount}, is eth - ${isEth}`);
                isEth = Math.random() < 0.5; //Math.random() < 0.5
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

                // const srcToken = await findTokenWithBalance(
                //     prepareStageData.client!,
                //     account.address,
                //     isEth,
                //     ThrusterConfig.minSwapRangeStable.range.minRange.toString(),
                //     ThrusterConfig.minSwapRangeStable.range.minRange.toString(),
                // );

                // if (srcToken != null) {
                //     printInfo(`Токен больше минималки из конфига.`);
                //     if (dstTokens.length == 0) {
                //         prepareStageData!.swapData!.srcToken = srcToken;
                //
                //         const range = ThrusterConfig.swapPercentStable.range;
                //         const fixed = ThrusterConfig.swapPercentStable.fixed;
                //
                //         const newFixed = Math.floor(
                //             Math.random() * (fixed?.maxRange - fixed.minRange) + fixed.minRange,
                //         );
                //         const newPercent =
                //             (Math.random() + offset) * (range.maxRange - range.minRange) + range.minRange;
                //
                //         printInfo(
                //             `Буду оставлять ${newPercent.toFixed(newFixed)}% ${prepareStageData.swapData?.srcToken.name} на аккаунте `,
                //         );
                //
                //         const balance = await getSwapBalance(
                //             prepareStageData.client!,
                //             account.address,
                //             prepareStageData.swapData?.srcToken.contractAddress!,
                //         );
                //
                //         const scaleFactor = BigInt(10 ** newFixed);
                //         const percentBigInt = BigInt(Math.round(newPercent * Number(scaleFactor)));
                //         const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));
                //
                //         printInfo(
                //             `Оставлю на балансе аккаунта ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ${prepareStageData.swapData?.srcToken.name}`,
                //         );
                //
                //         const value = balance - bridgeValue;
                //         let str = value.toString();
                //         str = str.substring(0, str.length - (18 - newFixed)) + '0'.repeat(18 - newFixed);
                //         const fixedValue = BigInt(str);
                //         prepareStageData!.swapData!.value = fixedValue;
                //
                //         await giveApprove(
                //             prepareStageData.client!,
                //             walletClient,
                //             account,
                //             prepareStageData!.swapData!.srcToken,
                //             thrusterContractAddress,
                //             infinityAmountApprove,
                //         );
                //
                //         printInfo(
                //             `Произвожу свап в сети ${prepareStageData.client!.chain?.name} на сумму ${formatUnits(prepareStageData.swapData?.value!, prepareStageData.swapData?.srcToken.decimals!)} ${prepareStageData.swapData?.srcToken.name} -> ${prepareStageData.swapData?.dstToken!.name}`,
                //         );
                //
                //         printInfo(
                //             `Произвожу свап ${formatUnits(prepareStageData.swapData?.value!, prepareStageData.swapData?.srcToken.decimals!)} ${prepareStageData.swapData?.srcToken.name} -> ETH`,
                //         );
                //
                //         await thrusterMakeTx(account, prepareStageData, isEth, i);
                //     }
                //
                //     for (let j = 0; j < dstTokens.length; j++) {
                //         prepareStageData!.swapData!.srcToken = dstTokens[j];
                //
                //         const range = ThrusterConfig.swapPercentStable.range;
                //         const fixed = ThrusterConfig.swapPercentStable.fixed;
                //
                //         const newFixed = Math.floor(
                //             Math.random() * (fixed?.maxRange - fixed.minRange) + fixed.minRange,
                //         );
                //         const newPercent =
                //             (Math.random() + offset) * (range.maxRange - range.minRange) + range.minRange;
                //
                //         printInfo(
                //             `Буду оставлять ${newPercent.toFixed(newFixed)}% ${prepareStageData.swapData?.srcToken.name} на аккаунте `,
                //         );
                //
                //         const balance = await getSwapBalance(
                //             prepareStageData.client!,
                //             account.address,
                //             prepareStageData.swapData?.srcToken.contractAddress!,
                //         );
                //
                //         const scaleFactor = BigInt(10 ** newFixed);
                //         const percentBigInt = BigInt(Math.round(newPercent * Number(scaleFactor)));
                //         const bridgeValue = (BigInt(balance.toString()) * percentBigInt) / (scaleFactor * BigInt(100));
                //
                //         printInfo(
                //             `Оставлю на балансе аккаунта ${Number(formatUnits(bridgeValue, 18)).toFixed(18)} ${prepareStageData.swapData?.srcToken.name}`,
                //         );
                //
                //         const value = balance - bridgeValue;
                //         let str = value.toString();
                //         str = str.substring(0, str.length - (18 - newFixed)) + '0'.repeat(18 - newFixed);
                //         const fixedValue = BigInt(str);
                //         prepareStageData!.swapData!.value = fixedValue;
                //
                //         await giveApprove(
                //             prepareStageData.client!,
                //             walletClient,
                //             account,
                //             prepareStageData!.swapData!.srcToken,
                //             thrusterContractAddress,
                //             infinityAmountApprove,
                //         );
                //
                //         printInfo(
                //             `Произвожу свап в сети ${prepareStageData.client!.chain?.name} на сумму ${formatUnits(prepareStageData.swapData?.value!, prepareStageData.swapData?.srcToken.decimals!)} ${prepareStageData.swapData?.srcToken.name} -> ${prepareStageData.swapData?.dstToken!.name}`,
                //         );
                //
                //         printInfo(
                //             `Произвожу свап ${prepareStageData.swapData?.value} ${prepareStageData.swapData?.srcToken.name} -> ETH`,
                //         );
                //
                //         await thrusterMakeTx(account, prepareStageData, isEth, i);
                //     }
                // }

                // return true;
            }
        }

        await thrusterMakeTx(account, prepareStageData, isEth, i);

        // if (isDepositBfx == false && Math.random() < 0.5 && prepareStageData.swapData?.dstToken?.name == 'USDB') {
        //     isDepositBfx = true;
        //     printInfo(`Буду выполнять депозит в BFX`);
        //     await bfxDeposit(account);
        // }
    }

    printInfo(`Прогон объемов завершен, общая сумма: ${formatUnits(BigInt(volume), 18)} ETH`);

    // if (isDepositBfx == false) {
    //     printInfo(`Т.к BFX не был депозит так выполнен, выполню принудительно`);
    //     await bfxDeposit(account);
    // }

    return true;

    function combineStrings(str1: string | undefined, str2: string | undefined): string {
        const s1 = str1!.slice(2);
        const s2 = str2!.slice(2);

        const combined = '0x' + s1 + selector + s2;

        return combined;
    }

    async function thrusterMakeTx(
        account: PrivateKeyAccount,
        prepareStageData: IPreparedStageData,
        isEth: boolean,
        i: number,
    ) {
        if (prepareStageData.swapData?.dstToken?.name != 'ETH') {
            if (!dstTokens.includes(prepareStageData.swapData?.dstToken!)) {
                printInfo(`Добавил новый токен для будущей отправки в ETH\n`);
                dstTokens.push(prepareStageData.swapData?.dstToken!);
            }
        }

        const combined = combineStrings(
            prepareStageData.swapData?.srcToken?.contractAddress.toString(),
            isEth == false && i == circlesCount - 1
                ? blastWETHContractAddress
                : prepareStageData.swapData?.dstToken?.contractAddress.toString(),
        );

        const block = await prepareStageData.client!.getBlock();
        const deadline = block.timestamp + BigInt(600);

        const quoteData = await getQuote(
            {
                amount: prepareStageData.swapData?.value.toString(),
                tokenIn: prepareStageData.swapData?.srcToken?.contractAddress.toString(),
                tokenOut:
                    isEth == false && i == circlesCount - 1
                        ? blastWETHContractAddress.toString()
                        : prepareStageData.swapData?.dstToken?.contractAddress.toString(),
                type: 'EXACT_A',
                chainId: '81457',
            },
            token,
        );

        const minAmountOut = Math.round(Number(quoteData.quote) - Number(quoteData.quote) * quoteData.priceImpact);

        const firstData = encodeFunctionData({
            abi: thrusterABI,
            functionName: 'exactInput',
            args: [
                {
                    path: combined,
                    recipient: prepareStageData.swapData?.srcToken?.name == 'ETH' ? account.address : zeroAddress,
                    deadline: deadline,
                    amountIn: prepareStageData.swapData?.value,
                    amountOutMinimum: minAmountOut,
                },
            ],
        });

        const secondData =
            prepareStageData.swapData?.srcToken?.name == 'ETH'
                ? '0x12210e8a'
                : encodeFunctionData({
                      abi: thrusterABI,
                      functionName: 'unwrapWETH9',
                      args: [minAmountOut, account.address],
                  });

        const results = encodeFunctionData({
            abi: thrusterABI,
            functionName: 'multicall',
            args: [[firstData, secondData]],
        });

        const preparedTransaction = await walletClient.prepareTransactionRequest({
            account,
            to: thrusterContractAddress,
            data: results,
            value:
                prepareStageData.swapData!.srcToken!.name == 'ETH'
                    ? BigInt(prepareStageData.swapData!.value)
                    : BigInt(0),
        });

        volume += prepareStageData!.swapData?.value!;

        const signature = await walletClient.signTransaction(preparedTransaction).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля prepare ${thrusterModuleName} ${e}`);
            return undefined;
        });

        if (signature !== undefined) {
            const hash = await walletClient.sendRawTransaction({ serializedTransaction: signature }).catch((e) => {
                printError(`Произошла ошибка во время выполнения модуля ${thrusterModuleName} ${e}`);
                return false;
            });

            if (hash == false) {
                return false;
            }

            const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

            printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

            await addTextMessage(
                `✅${thrusterModuleName}: swap ${formatUnits(prepareStageData.swapData!.value!, prepareStageData.swapData!.srcToken?.decimals!)} ${prepareStageData.swapData!.srcToken!.name} -> ${prepareStageData.swapData!.dstToken!.name} <a href='${url}'>link</a>`,
            );
        }

        await delay(ThrusterConfig.delayBetweenSwaps.minRange, ThrusterConfig.delayBetweenSwaps.maxRange, true);
    }
}
