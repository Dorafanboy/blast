import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { bfxContractAddress, bfxModuleName } from '../bfx/bfxData';
import { BfxConfig, blast, Config, WasabiConfig } from '../../config';
import { getSwapBalance, getValue2, giveApprove } from '../../data/utils/utils';
import { delay } from '../../data/helpers/delayer';
import { infinityAmountApprove } from '../thruster/thrusterData';
import { bfxABI } from '../../abis/bfx';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { wasabiContractAddress, wasabiModuleName } from './wasabiData';
import { wasabiABI } from '../../abis/wasabi';

export async function wasabiDeposit(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${wasabiModuleName}`);

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
                `Не нашел баланс для депозита USDB в сети Blast. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        const balance = await getSwapBalance(
            client,
            account.address,
            '0x4300000000000000000000000000000000000003',
            'USDB',
        ); // usdb token address

        value = await getValue2(
            client,
            account.address,
            WasabiConfig.usdbDepositAmount.range,
            WasabiConfig.usdbDepositAmount.fixed,
            true,
            balance,
        );

        printInfo(`Пытаюсь произвести deposit ${formatUnits(value, 18)} USDB`);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        } else {
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }

    printInfo(`Буду производить deposit ${formatUnits(value, 18)} USDB`);

    await giveApprove(
        client,
        walletClient,
        account,
        {
            name: 'USDB',
            contractAddress: '0x4300000000000000000000000000000000000003',
            decimals: 18,
        },
        wasabiContractAddress,
        infinityAmountApprove,
    );

    const { request } = await client
        .simulateContract({
            address: wasabiContractAddress,
            abi: wasabiABI,
            functionName: 'deposit',
            args: [value, account.address],
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${wasabiModuleName} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${wasabiModuleName} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${wasabiModuleName}: deposit ${formatUnits(value, 18)} USDB <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
