import { createPublicClient, createWalletClient, http, PrivateKeyAccount, SimulateContractReturnType } from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { spaceBarContractAddress, spaceBarModuleNameMint } from './spacebarData';
import { spacebarABI } from '../../abis/spacebar';

export async function spaceBarMintNFT(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${spaceBarModuleNameMint}`);

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
            address: spaceBarContractAddress,
            abi: spacebarABI,
            functionName: 'mint',
            args: [account.address],
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${spaceBarModuleNameMint} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${spaceBarModuleNameMint} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${spaceBarModuleNameMint}: mint spacebar NFT <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
