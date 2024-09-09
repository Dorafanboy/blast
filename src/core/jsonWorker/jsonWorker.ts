import fs from 'fs';
import path from 'path';
import { IBlastr } from '../../data/utils/interfaces';

export const blastrDataPath = path.join(__dirname, '../../assets/', 'blastrData.json');

export function saveData(blastrData: IBlastr) {
    const data = fs.readFileSync(blastrDataPath, 'utf8');
    let jsonObject = JSON.parse(data);

    if (!Array.isArray(jsonObject)) {
        jsonObject = [];
    }

    jsonObject.push(blastrData);
    const jsonString = JSON.stringify(jsonObject, null, 4);

    fs.writeFileSync(blastrDataPath, jsonString);
}

export function loadData(accountAddress: string): Promise<IBlastr | null> {
    let blastrData = JSON.parse(fs.readFileSync(blastrDataPath, 'utf8'));
    const walletData = blastrData.find((item: IBlastr) => item.accountAddress === accountAddress);

    if (walletData) {
        blastrData = blastrData.filter((item: IBlastr) => item.accountAddress !== accountAddress);
        fs.writeFileSync(blastrDataPath, JSON.stringify(blastrData, null, 4));
    }

    return walletData ? walletData : null;
}
