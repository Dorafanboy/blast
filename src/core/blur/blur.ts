import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { mainnet } from 'viem/chains';
import { blast, BlurDepositETHConfig, BlurWithdrawETHConfig, Config } from '../../config';
import { getSwapBalance, getValue } from '../../data/utils/utils';
import { delay } from '../../data/helpers/delayer';
import { blurContractAddress, blurDepositModuleName, blurDepositSignature, blurWithdrawModuleName } from './blurData';
import { blurABI } from '../../abis/blur';
import { addTextMessage } from '../../data/telegram/telegramBot';

export async function blurDepositETH(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blurDepositModuleName}`);

    let currentTry: number = 0,
        value = BigInt(0);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    while (currentTry <= Config.retryCount) {
        if (currentTry == Config.retryCount) {
            printError(
                `Не нашел баланс для ${blurDepositModuleName} в сети Blast. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        value = await getValue(
            client,
            account.address,
            BlurDepositETHConfig.ethDepositAmount.range,
            BlurDepositETHConfig.ethDepositAmount.fixed,
            18,
        );

        printInfo(`Пытаюсь произвести deposit ${formatUnits(value, 18)} ETH в сети ${blast.name}`);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        } else {
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }

    printInfo(`Буду производить deposit ${formatUnits(value, 18)} ETH в сети ${blast.name}`);

    const preparedTransaction = await walletClient!.prepareTransactionRequest({
        account,
        to: blurContractAddress,
        data: blurDepositSignature,
        value: value,
    });

    const signature = await walletClient.signTransaction(preparedTransaction).catch((e) => {
        printError(`Произошла ошибка во время выполнения модуля ${blurDepositModuleName} - ${e}`);
        return undefined;
    });

    if (signature !== undefined) {
        const hash = await walletClient.sendRawTransaction({ serializedTransaction: signature }).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blurDepositModuleName} - ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(
            `✅${blurDepositModuleName}: deposit for ${formatUnits(value, 18)} ETH <a href='${url}'>link</a>`,
        );

        if (BlurWithdrawETHConfig.isUse) {
            await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);
            await blurWithdrawETH(account);
        }
    }

    return true;
}

export async function blurWithdrawETH(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blurWithdrawModuleName}`);

    let currentTry: number = 0,
        value = BigInt(0);

    const client = createPublicClient({
        chain: mainnet,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    if (BlurWithdrawETHConfig.isWithdrawAllBalance == false) {
        while (currentTry <= Config.retryCount) {
            if (currentTry == Config.retryCount) {
                printError(
                    `Не нашел баланс для ${blurWithdrawModuleName} в сети Ethereum. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
                );
                return false;
            }

            value = await getValue(
                client,
                account.address,
                BlurWithdrawETHConfig.ethDepositAmount.range,
                BlurWithdrawETHConfig.ethDepositAmount.fixed,
                18,
            );

            printInfo(`Пытаюсь произвести withdraw ${formatUnits(value, 18)} ETH в сети ${mainnet.name}`);

            currentTry++;

            if (value != null && value != BigInt(-1)) {
                currentTry = Config.retryCount + 1;
            } else {
                await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
            }
        }
    } else {
        const balance = await getSwapBalance(client, account.address, blurContractAddress, 'ETH');
        value = balance;
        printInfo(`Буду выводить весь заведенный ETH в Blur(${formatUnits(value, 18)} ETH)`);
    }

    const walletClient = createWalletClient({
        chain: mainnet,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    printInfo(`Буду производить withdraw ${formatUnits(value, 18)} ETH в сети ${mainnet.name}`);

    const request = await client
        .simulateContract({
            address: blurContractAddress,
            abi: blurABI,
            functionName: 'withdraw',
            account: account,
            args: [value],
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blurWithdrawModuleName} - ${e}`);
            return { transferRequest: undefined };
        });

    if (request !== undefined && 'request' in request) {
        const hash = await walletClient.writeContract(request!.request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blurWithdrawModuleName} - ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${mainnet.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);
    }

    return true;
}
