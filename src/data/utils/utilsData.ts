import { IStageData } from './interfaces';
import { thrusterContractAddress, thrusterModuleName } from '../../core/thruster/thrusterData';
import { FenixConfig, ThrusterConfig } from '../../config';
import { fenixContractAddress, fenixModuleName } from '../../core/fenix/fenixData';

export const stagesData: IStageData[] = [
    {
        moduleName: thrusterModuleName,
        spenderContractAddress: thrusterContractAddress,
        ethValue: { range: ThrusterConfig.swapPercentEth.range, fixed: ThrusterConfig.swapPercentEth.fixed },
        stableValue: { range: ThrusterConfig.swapPercentStable.range, fixed: ThrusterConfig.swapPercentStable.fixed },
        minEthValue: { range: ThrusterConfig.minSwapRangeEth.range },
        minStableValue: { range: ThrusterConfig.minSwapRangeStable.range },
    },
    {
        moduleName: fenixModuleName,
        spenderContractAddress: fenixContractAddress,
        ethValue: { range: FenixConfig.swapPercentEth.range, fixed: FenixConfig.swapPercentEth.fixed },
        stableValue: { range: FenixConfig.swapPercentStable.range, fixed: FenixConfig.swapPercentStable.fixed },
        minEthValue: { range: FenixConfig.minSwapRangeEth.range },
        minStableValue: { range: FenixConfig.minSwapRangeStable.range },
    },
];
