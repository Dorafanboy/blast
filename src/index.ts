import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import readline from 'readline';
import { printError, printInfo, printSuccess } from './data/logger/logPrinter';
import { delay } from './data/helpers/delayer';
import {
    BfxConfig,
    BlastrConfig,
    BlazeConfig,
    BlurDepositETHConfig,
    CambriaConfig,
    Config,
    JuiceConfig,
    MiscConfig,
    OkxData,
    OrbitConfig,
    SpacebarConfig,
    TelegramData,
    WasabiConfig,
    YologamesConfig,
} from './config';
import {
    addTextMessage,
    initializeTelegramBot,
    resetTextMessage,
    sendMessage,
    stopTelegramBot,
} from './data/telegram/telegramBot';
import path from 'path';
import { IFunction } from './data/utils/interfaces';
import { withdrawAmount } from './data/okx/okx';
import { relayBridgeFromBlast, relayBridgeToBlast } from './core/bridges/relay/relay';
import { transfer } from './data/utils/utils';
import { Hex } from 'viem';
import { thrusterSwap } from './core/thruster/thruster';
import { blazeMintNFT } from './core/blaze/blaze';
import { spaceBarMintNFT } from './core/spacebar/spacebar';
import { yoloGamesForwardNative, yoloGamesForwardTokens } from './core/yoloGames/yoloGames';
import { blastDuel } from './core/blastDuel/blastDuel';
import { orbitMint } from './core/orbit/orbit';
import { miscTransfer } from './core/miscTransfer/miscTransfer';
import { blurDepositETH } from './core/blur/blur';
import { bfxDeposit } from './core/bfx/bfx';
import { blastrBoost, blastrMintNFT, blastrUnBoost } from './core/blastr/blastr';
import { juiceLendUSDB } from './core/juice/juice';
import { wasabiDeposit } from './core/wasabi/wasabi';
import { fenixSwap } from './core/fenix/fenix';
let account;

const privateKeysFilePath = path.join(__dirname, 'assets', 'private_keys.txt');
const privateKeysPath = fs.createReadStream(privateKeysFilePath);

const subaccsFilePath = path.join(__dirname, 'assets', 'subaccs.txt');
const subaccsPath = fs.createReadStream(subaccsFilePath);

const privateKeysLines = getFileLines(privateKeysFilePath);
const subaccsLines = getFileLines(subaccsFilePath);

const modules: { [key: string]: IFunction } = {
    'Blaze Mint NFT': {
        func: blazeMintNFT,
        isUse: BlazeConfig.isUse,
    },
    // 'SpaceBar Mint NFT': {
    //     func: spaceBarMintNFT,
    //     isUse: SpacebarConfig.isUse,
    // },
    // 'YoloGames ForwardNative': {
    //     func: yoloGamesForwardNative,
    //     isUse: YologamesConfig.isUse,
    // },
    // 'Cambria blast Duel': {
    //     func: blastDuel,
    //     isUse: CambriaConfig.isUse,
    // },
    // 'Orbit Mint(Deposit)': {
    //     func: orbitMint,
    //     isUse: OrbitConfig.isUse,
    // },
    // 'Misc Transfer': {
    //     func: miscTransfer,
    //     isUse: MiscConfig.isUse,
    // },
    // 'Blur Deposit ETH': {
    //     func: blurDepositETH,
    //     isUse: BlurDepositETHConfig.isUse,
    // },
    // 'Blastr Mint NFT': {
    //     func: blastrMintNFT,
    //     isUse: BlastrConfig.isUseMintNFT,
    // },
    // 'Bfx Deposit USDB': {
    //     func: bfxDeposit,
    //     isUse: BfxConfig.isUse,
    // },
    // 'Blastr Boost NFT': {
    //     func: blastrBoost,
    //     isUse: BlastrConfig.isUseBoostUnboost,
    // },
    // 'Juice Lend USDB': {
    //     func: juiceLendUSDB,
    //     isUse: JuiceConfig.isUse,
    // },
    // 'Wasabi Deposit': {
    //     func: wasabiDeposit,
    //     isUse: WasabiConfig.isUse,
    // },
};

//await fenixSwap(account); // работает ток на usdb чтоли
// await blastrUnBoost(account);
//  await yoloGamesForwardTokens(account);
// await thrusterSwap(account);
let addressToWithdraw: Hex = '0x';

async function main() {
    await questWorkMode();
}

async function questWorkMode() {
    // const filteredFunctions = Object.keys(modules)
    //     .filter((key) => modules[key].isUse)
    //     .map((key) => modules[key].func)
    //     .sort(() => Math.random() - 0.5);
    //
    // if (filteredFunctions.length == 0) {
    //     printError(`Нету модулей для запуска(Quest)`);
    //     throw `No modules`;
    // }

    const rl = readline.createInterface({
        input: privateKeysPath,
        crlfDelay: Infinity,
    });

    let index = 0;

    let rlSubaccs: readline.Interface | undefined;
    let subaccsIterator: AsyncIterableIterator<string> | undefined;

    if (Config.IsUseSubaccs) {
        if (privateKeysLines.length !== subaccsLines.length) {
            printError(
                `Длинны файлов приватников - ${privateKeysLines.length} и субакков - ${subaccsLines.length} не совпадают`,
            );
            return;
        }

        rlSubaccs = readline.createInterface({
            input: subaccsPath,
            crlfDelay: Infinity,
        });

        subaccsIterator = rlSubaccs[Symbol.asyncIterator]() as AsyncIterableIterator<string>;
    }

    const data = fs.readFileSync(privateKeysFilePath, 'utf8');

    const count = data.split('\n').length;
    await initializeTelegramBot(TelegramData.telegramBotId, TelegramData.telegramId);

    const keys = Object.keys(modules).filter((key) => modules[key].isUse);
    const functionsList = keys.join('\n');

    printInfo(`Были включены следующие модули:\n${functionsList}`);

    for await (const line of rl) {
        try {
            if (line == '') {
                printError(`Ошибка, пустая строка в файле private_keys.txt`);
                return;
            }

            // if (Config.isShuffleWallets) {
            //     printInfo(`Произвожу перемешивание только кошельков.`);
            //     await shuffleData();
            //
            //     printSuccess(`Кошельки успешно перемешаны.\n`);
            // }

            addressToWithdraw = Config.IsUseSubaccs ? (await subaccsIterator!.next()).value : '0x';

            account = privateKeyToAccount(<`0x${string}`>line);
            printInfo(`Start [${index + 1}/${count} - ${<`0x${string}`>account.address}]\n`);

            await addTextMessage(`${index + 1}/${count} - ${<`0x${string}`>account.address}\n`);
            //
            // await withdrawAmount(<`0x${string}`>line, OkxData.bridgeData, OkxData.isUse);
            //
            // await relayBridgeToBlast(account);
            // await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);
            //
            //await thrusterSwap(account);
            // await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);
            //
            // filteredFunctions = Object.keys(modules)
            //     .filter((key) => modules[key].isUse)
            //     .map((key) => modules[key].func)
            //     .sort(() => Math.random() - 0.5);
            //
            // const modulesCount = filteredFunctions.length;
            // printInfo(`Перемешал модули, количество модулей: ${modulesCount}\n`);
            //
            // for (let i = 0; i < modulesCount; i++) {
            //     const func = filteredFunctions[i];
            //
            //     const result = await func(account);
            //
            //     if (i != modulesCount - 1) {
            //         printInfo(`Осталось выполнить ${modulesCount - i - 1} модулей на аккаунте\n`);
            //
            //         if (result == true) {
            //             await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);
            //         } else {
            //             await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, false);
            //         }
            //     }
            // }
            //

            // await blastrUnBoost(account);
            // await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);

            await relayBridgeFromBlast(account);
            // await delay(Config.delayBetweenModules.minRange, Config.delayBetweenModules.maxRange, true);
            //
            // await transfer(account, addressToWithdraw);
            printSuccess(`Ended [${index + 1}/${count} - ${<`0x${string}`>line}]\n`);

            await sendMessage();
            await resetTextMessage();

            fs.appendFile('src/assets/completed_accounts.txt', `${account.address}\n`, 'utf8', (err) => {
                if (err) {
                    printError(`Произошла ошибка при записи в файл: ${err}`);
                }
            });

            index++;

            if (index == count) {
                printSuccess(`Все аккаунты отработаны`);
                rl.close();
                await stopTelegramBot();
                return;
            }

            printInfo(`Ожидаю получение нового аккаунта`);
            await delay(Config.delayBetweenAccounts.minRange, Config.delayBetweenAccounts.maxRange, true);
        } catch (e) {
            printError(`Произошла ошибка при обработке строки: ${e}\n`);

            await addTextMessage(`❌Аккаунт отработал с ошибкой`);
            await sendMessage();
            await resetTextMessage();

            printInfo(`Ожидаю получение нового аккаунта`);
            await delay(Config.delayBetweenAccounts.minRange, Config.delayBetweenAccounts.maxRange, true);
            fs.appendFile('src/assets/uncompleted_accounts.txt', `${line}\n`, 'utf8', (err) => {
                if (err) {
                    printError(`Произошла ошибка при записи в файл: ${err}`);
                }
            });

            index++;
        }
    }
}

async function shuffleData() {
    try {
        const data = fs.readFileSync(privateKeysFilePath, 'utf8');
        const lines = data.split('\n');

        for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
        }

        await fs.writeFileSync(privateKeysFilePath, lines.join('\n'), 'utf8');
    } catch (error) {
        printError(`Произошла ошибка во время перемешивания данных: ${error}`);
    }
}

function getFileLines(filePath: string) {
    const data = fs.readFileSync(filePath, 'utf8');
    return data.split('\n');
}

main();
