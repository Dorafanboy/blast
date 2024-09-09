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
import { blazeContractAddress, blazeModuleName } from './blazeData';
import { blast, BlazeConfig, Config } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { blazeABI } from '../../abis/blaze';

export async function blazeMintNFT(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blazeModuleName}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const contract = BlazeConfig.contracts[Math.floor(Math.random() * BlazeConfig.contracts.length)];

    printInfo(`Буду минтить контракт: ${contract} за ${formatUnits(parseUnits('5', 14), 18)} ETH`);

    const { request } = await client
        .simulateContract({
            address: blazeContractAddress,
            abi: blazeABI,
            functionName: 'mintBlazeType',
            args: [contract, 1], // mint 1 nft
            account: account,
            value: parseUnits('5', 14),
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blazeModuleName} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${blazeModuleName} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(
            `✅${blazeModuleName}: mint ${contract} for ${formatUnits(parseUnits('5', 14), 18)} ETH <a href='${url}'>link</a>`,
        );

        return true;
    }

    return false;
}
