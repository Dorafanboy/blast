import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    parseUnits,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, BlastrConfig, Config } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import {
    blastrContractAddress,
    blastrModuleNameBoost,
    blastrModuleNameMintNFT,
    blastrModuleNameUnBoost,
} from './blastrData';
import { blastrABI } from '../../abis/blastr';
import { loadData, saveData } from '../jsonWorker/jsonWorker';
import { blastrBoostABI } from '../../abis/blastrBoost';
import axios from 'axios';
import { IFenixData } from '../../data/utils/interfaces';

export async function blastrMintNFT(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blastrModuleNameMintNFT}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const contract = BlastrConfig.contracts[Math.floor(Math.random() * BlastrConfig.contracts.length)];
    const nftAmount =
        Math.floor(Math.random() * (BlastrConfig.mintCount.maxRange - BlastrConfig.mintCount.minRange + 1)) +
        BlastrConfig.mintCount.minRange;

    printInfo(`Буду минтить контракт: ${contract}, count: ${nftAmount}`);

    const { request } = await client
        .simulateContract({
            address: contract,
            abi: blastrABI,
            functionName: 'publicMint',
            args: [nftAmount],
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blastrModuleNameMintNFT} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blastrModuleNameMintNFT} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(
            `✅${blastrModuleNameMintNFT}: mint ${contract} ${nftAmount} amount <a href='${url}'>link</a>`,
        );

        return true;
    }

    return false;
}

export async function blastrBoost(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blastrModuleNameBoost}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const contract = BlastrConfig.boostContracts[Math.floor(Math.random() * BlastrConfig.boostContracts.length)];

    printInfo(`Буду бустить контракт: ${contract} за ${formatUnits(parseUnits('1', 16), 18)} ETH`);

    const { request } = await client
        .simulateContract({
            address: blastrContractAddress,
            abi: blastrBoostABI,
            functionName: 'boost',
            args: [1, contract], // 1 nft
            account: account,
            value: parseUnits('1', 16),
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blastrModuleNameBoost} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blastrModuleNameBoost} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(
            `✅${blastrModuleNameBoost}: boost ${contract} for ${formatUnits(parseUnits('1', 16), 18)} ETH <a href='${url}'>link</a>`,
        );

        saveData({
            accountAddress: account.address,
            contractAddress: contract,
        });

        return true;
    }

    return false;
}

export async function blastrUnBoost(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blastrModuleNameUnBoost}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const data = await loadData(account.address);

    if (data == null) {
        printError(`Не найден адрес контракта для unboost'а`);
        return false;
    }

    printInfo(`Буду забирать буст контракта: ${data.contractAddress}`);

    const { request } = await client
        .simulateContract({
            address: blastrContractAddress,
            abi: blastrBoostABI,
            functionName: 'refund',
            args: [data.contractAddress], // 1 nft
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blastrModuleNameUnBoost} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blastrModuleNameUnBoost} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${blastrModuleNameUnBoost}: unBoost ${data.contractAddress} <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
