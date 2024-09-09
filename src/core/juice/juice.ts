import {
    createPublicClient,
    createWalletClient,
    encodeFunctionData,
    formatUnits,
    http,
    parseUnits,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blurContractAddress, blurDepositModuleName, blurDepositSignature } from '../blur/blurData';
import { BfxConfig, blast, BlurDepositETHConfig, BlurWithdrawETHConfig, Config, JuiceConfig } from '../../config';
import { getSwapBalance, getValue, getValue2, giveApprove } from '../../data/utils/utils';
import { delay } from '../../data/helpers/delayer';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { blurWithdrawETH } from '../blur/blur';
import { juiceContractAddress, juiceModuleName } from './juiceData';
import { blastrContractAddress, blastrModuleNameUnBoost } from '../blastr/blastrData';
import { blastrBoostABI } from '../../abis/blastrBoost';
import { juiceABI } from '../../abis/juice';
import { infinityAmountApprove, thrusterContractAddress } from '../thruster/thrusterData';

export async function juiceLendUSDB(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${juiceModuleName}`);

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
                `Не нашел баланс для ${juiceModuleName} в сети Blast. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        const balance = await getSwapBalance(
            client,
            account.address,
            '0x4300000000000000000000000000000000000003',
            'USDB',
        );

        value = await getValue2(
            client,
            account.address,
            JuiceConfig.usdbDepositAmount.range,
            JuiceConfig.usdbDepositAmount.fixed,
            true,
            balance,
        );

        printInfo(`Пытаюсь произвести lend ${formatUnits(value, 18)} USDB в сети ${blast.name}`);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        } else {
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }

    printInfo(`Буду производить lend ${formatUnits(value, 18)} USDB в сети ${blast.name}`);

    // const { request } = await client
    //     .simulateContract({
    //         address: juiceContractAddress,
    //         abi: juiceABI,
    //         functionName: 'deposit',
    //         args: [value],
    //         account: account,
    //     })
    //     .then((result) => result as SimulateContractReturnType)
    //     .catch((e) => {
    //         printError(`Произошла ошибка во время выполнения модуля ${juiceModuleName} ${e}`);
    //         return { request: undefined };
    //     });

    const data = encodeFunctionData({
        abi: juiceABI,
        functionName: 'deposit',
        args: [value],
    });

    await giveApprove(
        client,
        walletClient,
        account,
        {
            name: 'USDB',
            contractAddress: '0x4300000000000000000000000000000000000003',
            decimals: 18,
        },
        juiceContractAddress,
        infinityAmountApprove,
    );

    const preparedTransaction = await walletClient!.prepareTransactionRequest({
        account,
        to: juiceContractAddress,
        data: data,
        gas: 900000n,
    });

    preparedTransaction.maxPriorityFeePerGas! = preparedTransaction.maxFeePerGas! - 1000000n;

    console.log(preparedTransaction);

    const signature = await walletClient.signTransaction(preparedTransaction).catch((e) => {
        printError(`Произошла ошибка во время выполнения модуля ${juiceModuleName} ${e}`);
        return undefined;
    });

    if (signature !== undefined) {
        const hash = await walletClient.sendRawTransaction({ serializedTransaction: signature }).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${juiceModuleName} ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${juiceModuleName}: lend ${formatUnits(value, 18)} USDB <a href='${url}'>link</a>`);

        return true;
    }

    return false;
}
