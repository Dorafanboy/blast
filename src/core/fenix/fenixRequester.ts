import { IFenixData } from '../../data/utils/interfaces';
import axios from 'axios';
import { printError, printSuccess } from '../../data/logger/logPrinter';
import { fenixModuleName } from './fenixData';

export async function fenixGetTxData(data: IFenixData) {
    const response = await axios
        .get('https://www.fenixfinance.io/api/aggregator/blast/swap', {
            params: { ...data },
            headers: {
                accept: '*/*',
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                priority: 'u=1, i',
                referer: 'https://www.fenixfinance.io/trade/swap',
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            },
        })
        .then(async (res) => {
            printSuccess(`Успешно получил данные транзакции ${fenixModuleName}`);
            return res;
        })
        .catch((err) => {
            printError(`Произошла ошибка во время получения данных транзакции ${fenixModuleName} - ${err}`);
            return null;
        });

    return response!.data.data.data;
}
