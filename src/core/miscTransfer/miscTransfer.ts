import { createWalletClient, http, PrivateKeyAccount } from 'viem';
import { printError, printInfo, printSuccess } from '../../data/logger/logPrinter';
import { blast, Config } from '../../config';
import { addTextMessage } from '../../data/telegram/telegramBot';
import { miscModuleName, miscTransferContractAddress } from './miscTransferData';

export async function miscTransfer(account: PrivateKeyAccount) {
    printInfo(`Выполняю модуль ${miscModuleName}`);

    const walletClient = createWalletClient({
        chain: blast,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    printInfo(`Буду кидать на адрес ${miscTransferContractAddress} 0 ETH`);

    const prepareTransaction = await walletClient.prepareTransactionRequest({
        account,
        to: <`0x${string}`>miscTransferContractAddress,
        data: '0x',
    });

    const signature = await walletClient.signTransaction(prepareTransaction).catch((e) => {
        printError(`Произошла ошибка во время выполнения модуля ${miscModuleName} - ${e}`);
        return undefined;
    });

    if (signature !== undefined) {
        const hash = await walletClient.sendRawTransaction({ serializedTransaction: signature }).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${miscModuleName} - ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${blast!.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        await addTextMessage(`✅${miscModuleName} 0 ETH <a href='${url}'>link</a>`);
    }

    return true;
}
