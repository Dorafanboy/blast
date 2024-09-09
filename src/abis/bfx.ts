﻿export const bfxABI = [
    {
        inputs: [
            { internalType: 'address', name: '_owner', type: 'address' },
            { internalType: 'address', name: '_signer', type: 'address' },
            { internalType: 'address', name: '_claimer', type: 'address' },
            { internalType: 'address', name: '_paymentToken', type: 'address' },
            { internalType: 'address', name: '_points', type: 'address' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'ClaimedYield',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'trader', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'Deposit',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'claimer', type: 'address' }],
        name: 'SetClaimer',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'signer', type: 'address' }],
        name: 'SetSigner',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'token', type: 'address' }],
        name: 'SetToken',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'to', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'WithdrawTo',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'trader', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'WithdrawalReceipt',
        type: 'event',
    },
    {
        inputs: [],
        name: 'BLAST',
        outputs: [{ internalType: 'contract IBlast', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'new_claimer', type: 'address' }],
        name: 'changeClaimer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'new_signer', type: 'address' }],
        name: 'changeSigner',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [], name: 'claimGas', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'claimYield', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
        inputs: [],
        name: 'claimer',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'external_signer',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'paymentToken',
        outputs: [{ internalType: 'contract IERC20Rebasing', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'processedWithdrawals',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_paymentToken', type: 'address' }],
        name: 'setPaymentToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'address', name: 'trader', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'uint8', name: 'v', type: 'uint8' },
            { internalType: 'bytes32', name: 'r', type: 'bytes32' },
            { internalType: 'bytes32', name: 's', type: 'bytes32' },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
        ],
        name: 'withdrawTokensTo',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
