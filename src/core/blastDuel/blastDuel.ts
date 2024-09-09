import { createPublicClient, createWalletClient, http, PrivateKeyAccount, SimulateContractReturnType } from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { blastDuelABI } from '../../abis/blastDuel';
import { blastDuelContractAddress, blastDuelModuleName } from './blastDuelData';

export async function blastDuel(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${blastDuelModuleName}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const randomBattleId = Math.floor(Math.random() * (50000 - 500 + 1)) + 500;
    const randomGasLimit = Math.floor(Math.random() * (1500000 - 800000 + 1)) + 800000;

    printInfo(`Буду фейлить транзу с battleId - ${randomBattleId}, gas limit  -  ${randomGasLimit}`);

    const hash = await walletClient.writeContract({
        address: blastDuelContractAddress,
        abi: blastDuelABI,
        functionName: 'nullifyBattle',
        args: [randomBattleId], // mint 1 nft
        gas: BigInt(randomGasLimit),
        account,
        // value: BigInt(0),
    });

    const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

    printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

    await addTextMessage(`✅${blastDuelModuleName} <a href='${url}'>link</a>`);

    return true;
}
