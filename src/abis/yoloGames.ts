﻿export const yoloGamesABI = [
    {
        inputs: [
            { internalType: 'uint8', name: '_loopLimit', type: 'uint8' },
            { internalType: 'address', name: '_defaultToken', type: 'address' },
            { internalType: 'uint256', name: '_defaultFrame', type: 'uint256' },
            { internalType: 'address', name: '_defaultAddress', type: 'address' },
            { internalType: 'address', name: '_pointsOperator', type: 'address' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    { inputs: [], name: 'AboveLimit', type: 'error' },
    { inputs: [], name: 'SameValue', type: 'error' },
    { inputs: [], name: 'ZeroValue', type: 'error' },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: 'address', name: 'newCEO', type: 'address' }],
        name: 'CEOSet',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'address', name: 'newAddress', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'timeStamper', type: 'uint256' },
        ],
        name: 'ChangeForwardAddress',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'newFrame', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'timeStamper', type: 'uint256' },
        ],
        name: 'ChangeForwardFrame',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'bool', name: 'isSupported', type: 'bool' },
            { indexed: false, internalType: 'address', name: 'tokenAddress', type: 'address' },
        ],
        name: 'ChangeToken',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'depositorAddress', type: 'address' },
            { indexed: true, internalType: 'address', name: 'paymentTokenAddress', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'paymentTokenAmount', type: 'uint256' },
        ],
        name: 'Forward',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'depositorAddress', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'paymentTokenAmount', type: 'uint256' },
        ],
        name: 'ForwardNative',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: 'uint256', name: 'tokenAmount', type: 'uint256' }],
        name: 'MoveOutNative',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'address', name: 'tokenHolder', type: 'address' },
            { indexed: false, internalType: 'address', name: 'tokenAddress', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'tokenAmount', type: 'uint256' },
        ],
        name: 'MovedOut',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'uint256', name: 'nativeAmount', type: 'uint256' }],
        name: 'ReceiveNative',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: 'address', name: 'newWorker', type: 'address' }],
        name: 'WorkerAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: 'address', name: 'existingWorker', type: 'address' }],
        name: 'WorkerRemoved',
        type: 'event',
    },
    {
        inputs: [],
        name: 'BLAST_POINTS_CONTRACT',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'BLAST_YIELD_CONTRACT',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'USDB',
        outputs: [{ internalType: 'contract IERC20Rebasing', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'WETH',
        outputs: [{ internalType: 'contract IERC20Rebasing', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_newWorker', type: 'address' }],
        name: 'addWorker',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address[]', name: '_newWorkers', type: 'address[]' }],
        name: 'addWorkerBulk',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_depositorAddress', type: 'address' }],
        name: 'canDepositAgain',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ceoAddress',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_newForwardAddress', type: 'address' }],
        name: 'changeForwardAddress',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_newDepositFrame', type: 'uint256' }],
        name: 'changeForwardFrame',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_newPointsOperator', type: 'address' }],
        name: 'changePointsOperator',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
            { internalType: 'bool', name: '_supportStatus', type: 'bool' },
        ],
        name: 'changeSupportedToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_account', type: 'address' }],
        name: 'checkClaimUSDB',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_account', type: 'address' }],
        name: 'checkClaimWETH',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_recipient', type: 'address' }],
        name: 'claimAllYield',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_recipient', type: 'address' },
            { internalType: 'uint256', name: '_amount', type: 'uint256' },
        ],
        name: 'claimUSDB',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_recipient', type: 'address' },
            { internalType: 'uint256', name: '_amount', type: 'uint256' },
        ],
        name: 'claimWETH',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_recipient', type: 'address' },
            { internalType: 'uint256', name: '_amount', type: 'uint256' },
        ],
        name: 'claimYield',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'forwardAddress',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'forwardFrame',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'forwardFrames',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    { inputs: [], name: 'forwardNative', outputs: [], stateMutability: 'payable', type: 'function' },
    {
        inputs: [
            { internalType: 'address', name: '_paymentToken', type: 'address' },
            { internalType: 'uint256', name: '_paymentTokenAmount', type: 'uint256' },
        ],
        name: 'forwardTokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_depositorAddress', type: 'address' },
            { internalType: 'address', name: '_paymentTokenAddress', type: 'address' },
            { internalType: 'uint256', name: '_paymentTokenAmount', type: 'uint256' },
        ],
        name: 'forwardTokensByWorker',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'isWorker',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_tokenHolder', type: 'address' },
            { internalType: 'uint256', name: '_nativeAmount', type: 'uint256' },
        ],
        name: 'moveNative',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_tokenHolder', type: 'address' },
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
            { internalType: 'uint256', name: '_tokenAmount', type: 'uint256' },
        ],
        name: 'moveTokenOut',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'poinstOperator',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_existingWorker', type: 'address' }],
        name: 'removeWorker',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address[]', name: '_workerArray', type: 'address[]' }],
        name: 'removeWorkerBulk',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_nativeAmount', type: 'uint256' }],
        name: 'rescueNative',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: '_tokenAmount', type: 'uint256' },
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
        ],
        name: 'rescueToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_newCEO', type: 'address' }],
        name: 'setCEO',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'supportedTokens',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
];
