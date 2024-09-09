import { createPublicClient, createWalletClient, http, PrivateKeyAccount, SimulateContractReturnType } from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import {
    yoloGamesContractAddress,
    yoloGamesForwardTokensAddress,
    yoloGamesModuleNameForwardNative,
    yoloGamesModuleNameForwardTokens,
} from './yoloGamesData';
import { yoloGamesABI } from '../../abis/yoloGames';

export async function yoloGamesForwardNative(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${yoloGamesModuleNameForwardNative}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const { request } = await client
        .simulateContract({
            address: yoloGamesContractAddress,
            abi: yoloGamesABI,
            functionName: 'forwardNative',
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${yoloGamesModuleNameForwardNative} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${yoloGamesModuleNameForwardNative} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${yoloGamesModuleNameForwardNative} <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}

export async function yoloGamesForwardTokens(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${yoloGamesModuleNameForwardTokens}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const { request } = await client
        .simulateContract({
            address: yoloGamesContractAddress,
            abi: yoloGamesABI,
            functionName: 'forwardTokens',
            args: [yoloGamesForwardTokensAddress, 0],
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${yoloGamesModuleNameForwardTokens} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${yoloGamesModuleNameForwardTokens} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${yoloGamesModuleNameForwardTokens} <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
