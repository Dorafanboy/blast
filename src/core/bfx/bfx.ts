import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { BfxConfig, blast, Config } from '../../config';
import { getSwapBalance, getValue2, giveApprove } from '../../data/utils/utils';
import { delay } from '../../data/helpers/delayer';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { bfxContractAddress, bfxModuleName } from './bfxData';
import { bfxABI } from '../../abis/bfx';
import { juiceContractAddress } from '../juice/juiceData';
import { infinityAmountApprove } from '../thruster/thrusterData';

export async function bfxDeposit(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${bfxModuleName}`);

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
            BfxConfig.usdbBridgeAmount.range,
            BfxConfig.usdbBridgeAmount.fixed,
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
        bfxContractAddress,
        infinityAmountApprove,
    );

    const { request } = await client
        .simulateContract({
            address: bfxContractAddress,
            abi: bfxABI,
            functionName: 'deposit',
            args: [value],
            account: account,
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${bfxModuleName} ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${bfxModuleName} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${bfxModuleName}: deposit ${formatUnits(value, 18)} USDB <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
