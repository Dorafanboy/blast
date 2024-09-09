import axios from 'axios';
import { printError, printSuccess } from '../../../data/logger/logPrinter';
import { relayModuleNameToBlast, relayUrls } from './relayData';
import {
    IRelayBridgeRequestData,
    IRelayBridgeResponseData,
    IRelayConfigRequestData,
    IRelayConfigResponseData,
} from '../../../data/utils/interfaces';
import * as console from 'node:console';

export async function getConfigData(configData: IRelayConfigRequestData): Promise<IRelayConfigResponseData> {
    const response = await axios
        .get(
            `${relayUrls.configUrl}originChainId=${configData.originChainId}&destinationChainId=${configData.destinationChainId}&currency=${configData.currency}&user=${configData.user}`,
        )
        .then(async (res) => {
            printSuccess(`Успешно получил конфиг ${relayModuleNameToBlast}`);
            return res;
        })
        .catch((err) => {
            printError(`Произошла ошибка во время получения конфига ${relayModuleNameToBlast} - ${err}`);
            return null;
        });

    return {
        enabled: response!.data.enabled,
        capacityPerRequest: response!.data.enabled ? response!.data.solver.capacityPerRequest : null,
    };
}

export async function getBridgeData(bridgeData: IRelayBridgeRequestData): Promise<IRelayBridgeResponseData> {
    const response = await axios
        .post(`${relayUrls.bridgeUrl}`, {
            user: bridgeData.user,
            originChainId: bridgeData.originChainId,
            destinationChainId: bridgeData.destinationChainId,
            currency: bridgeData.currency,
            recipient: bridgeData.recipient,
            amount: bridgeData.amount,
            usePermit: bridgeData.usePermit,
            useExternalLiquidity: bridgeData.useExternalLiquidity,
            source: bridgeData.source,
        })
        .then(async (res) => {
            printSuccess(`Успешно получил данные для бриджа ${relayModuleNameToBlast}`);
            return res;
        })
        .catch((err) => {
            printError(`Произошла ошибка во время получения данных для бриджа ${relayModuleNameToBlast} - ${err}`);
            return null;
        });

    return {
        to: response!.data.steps[0].items[0].data.to,
        data: response!.data.steps[0].items[0].data.data,
        value: response!.data.steps[0].items[0].data.value,
    };
}
