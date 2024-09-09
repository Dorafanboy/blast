import { createPublicClient, Hex, http, parseEther } from 'viem';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import ccxt, { okx } from 'ccxt';
import { IOkx } from '../utils/interfaces';
import { printInfo, printSuccess } from '../logger/logPrinter';
import { Config, OkxAuth, OkxData, RelayConfig } from '../../config';
import { delay } from '../helpers/delayer';
import { addTextMessage } from '../telegram/telegramBot';

export async function withdrawAmount(address: Hex, bridgeData: IOkx[], isUse: boolean) {
    if (isUse == false) {
        return;
    }

    if (bridgeData.length <= 0) {
        return;
    }

    printInfo(`Выполняю модуль вывода через OKX`);

    const okxOptions = {
        apiKey: OkxAuth.okxApiKey,
        secret: OkxAuth.okxApiSecret,
        password: OkxAuth.okxApiPassword,
        enableRateLimit: true,
    };

    if (OkxData.isRandomWithdraw) {
        printInfo(`Включен режим вывода ETH только в одну рандомную сеть`);
    }

    const exchange: okx = new ccxt.okx(okxOptions);

    const length = OkxData.isRandomWithdraw ? 1 : bridgeData.length;

    for (let i = 0; i < length; i++) {
        const data = OkxData.isRandomWithdraw
            ? OkxData.bridgeData[Math.floor(Math.random() * OkxData.bridgeData.length)]
            : bridgeData[i];

        const chainName = data.networkName == 'Optimism' ? 'OP Mainnet' : data.networkName;

        const bridgeDataRelay = RelayConfig.data.find((item) => item.chain.name === chainName);

        const client = createPublicClient({
            chain: bridgeDataRelay?.chain,
            transport: bridgeDataRelay?.rpc == null ? http() : http(bridgeDataRelay?.rpc),
        });

        const balance = await client.getBalance({
            address: address,
        });

        const isLessBalance: boolean = Number(parseEther(data.withdrawStart).toString()) > Number(balance.toString());

        if ((data.withdraw.minRange != 0 && data.withdraw.maxRange != 0) || isLessBalance) {
            printInfo(`Произвожу вывод с OKX в сеть ${data.networkName}`);

            const randomFixed = Math.floor(
                Math.random() * (data.randomFixed.maxRange - data.randomFixed.minRange) + data.randomFixed.minRange,
            );
            const amount = (
                Math.random() *
                    (parseFloat(data.withdraw.maxRange.toString()) - parseFloat(data.withdraw.minRange.toString())) +
                parseFloat(data.withdraw.minRange.toString())
            ).toFixed(randomFixed);

            await exchange.withdraw(data.tokenName, amount, address, {
                toAddress: address,
                chainName: data.chainName,
                dest: 4,
                fee: data.okxFee,
                pwd: '-',
                amt: amount,
                network: data.networkName,
            });

            printSuccess(`Withdraw from okx ${amount} ${data.tokenName} to address ${address}`);
            await addTextMessage(`✅OKX:withdraw ${amount} ${data.tokenName} from ${data.networkName}`);
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }

    await delay(OkxData.delayAfterWithdraw.minRange, OkxData.delayAfterWithdraw.maxRange, true);

    return true;
}
