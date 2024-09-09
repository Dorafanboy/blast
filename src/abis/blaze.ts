export const blazeABI = [
    {
        type: 'function',
        name: 'mintBlazeType',
        inputs: [
            {
                name: '_blazeType',
                type: 'address',
                internalType: 'contract BlazeType',
            },
            {
                name: '_amount',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        outputs: [],
        stateMutability: 'payable',
    },
];
