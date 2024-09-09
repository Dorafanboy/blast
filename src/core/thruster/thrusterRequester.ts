import axios from 'axios';
import { thrusterUrls } from './thrusterData';
import { IThrusterQuoteData, IThrusterSwapData } from '../../data/utils/interfaces';
import jwt from 'jsonwebtoken';
import * as console from 'node:console';
import { printSuccess } from '../../data/logger/logPrinter';

export async function getQuote(data: IThrusterSwapData, apiKey: string): Promise<IThrusterQuoteData> {
    const response = await axios.get(thrusterUrls.quoteUrl, {
        params: {
            ...data,
        },
        headers: {
            accept: '*/*',
            'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            origin: 'https://app.thruster.finance',
            priority: 'u=1, i',
            referer: 'https://app.thruster.finance/',
            'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'x-api-key': apiKey,
        },
    });

    return response.data.bestQuote;
}

export async function generateTokenTest(): Promise<string> {
    const payload = {
        iat: Math.floor(Date.now() / 1e3),
        exp: Math.floor(Date.now() / 1e3) + 86400,
    };

    const secretKey = 'xTvCUmYa2LxZGpO2btvtd7YfbEqAwWsB8Ch18zRpVNQ=';

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

    printSuccess(`Токен успешно сгенерирован - ${token}`);

    return token;
}
