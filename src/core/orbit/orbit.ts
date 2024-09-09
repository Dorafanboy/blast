import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config, OrbitConfig } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { orbitContractAddress, orbitModuleName } from './orbitData';
import { orbitABI } from '../../abis/orbit';
import { getValue } from '../../data/utils/utils';
import { delay } from '../../data/helpers/delayer';

export async function orbitMint(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${orbitModuleName}`);

    const client = createPublicClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    let currentTry: number = 0,
        value = BigInt(0);

    while (currentTry <= Config.retryCount) {
        if (currentTry == Config.retryCount) {
            printError(
                `Не нашел баланс для депозита в сети Blast. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        value = await getValue(
            client,
            account.address,
            OrbitConfig.ethBridgeAmount.range,
            OrbitConfig.ethBridgeAmount.fixed,
            18,
        );

        printInfo(`Пытаюсь произвести минт за ${formatUnits(value, 18)} ETH`);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        } else {
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }

    printInfo(`Буду минтить за ${formatUnits(value, 18)} ETH`);

    const { request } = await client
        .simulateContract({
            address: orbitContractAddress,
            abi: orbitABI,
            functionName: 'mint',
            account: account,
            value: value,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${orbitModuleName} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${orbitModuleName} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${orbitModuleName}: mint for ${formatUnits(value, 18)} ETH <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
