import { IThrusterApiKeyData } from '../../data/utils/interfaces';

export const thrusterContractAddress = '0x337827814155ECBf24D20231fCA4444F530C0555';

export async function generateThrusterAuthMessage(walletAddress: string) {
    const date = `Date: 2024-06-14T16:46:42.050Z`;
    const message = `    By confirming this signature and engaging with our platform, you confirm your status as the rightful account manager or authorized representative for the wallet address ${walletAddress}. This action grants permission for a login attempt on the https://app.thruster.finance portal. Your interaction with our site signifies your acceptance of Thruster's Terms of Service and Privacy Policy, as detailed in our official documentation. You acknowledge having fully reviewed these documents, accessible through our website. We strongly advise familiarizing yourself with these materials to fully understand our data handling practices and your entitlements as a user.
\n\n${date}`;

    console.log(message);
}

export const thrusterUrls = {
    quoteUrl: 'https://api.thruster.finance/quote',
};

export const thrusterModuleName = 'Thruster Swap';

export const selector = '0001f4';

export const offset = 0.0001;

export const blastWETHContractAddress = '0x4300000000000000000000000000000000000004';

export const infinityAmountApprove = BigInt(
    '115792089237316195423570985008687907853269984665640564039457584007913129639935',
);
// export async function thrusterGenerateApiKey() {
//     const e = {
//             iat: Math.floor(Date.now() / 1e3),
//             exp: Math.floor(Date.now() / 1e3) + 86400,
//         },
//         n = new TextEncoder().encode('xTvCUmYa2LxZGpO2btvtd7YfbEqAwWsB8Ch18zRpVNQ=');
//     return await new a.N6(e)
//         .setProtectedHeader({
//             alg: 'HS256',
//         })
//         .sign(n);
// }
//
// async function sign(e: Uint8Array, t: undefined, data: IThrusterApiKeyData) {
//     const r = { alg: 'HS256' };
//     const o = new k(a.encode(JSON.stringify(data)));
//     return o.sign(e, t);
// }
//
// async function sign2(e, t) {
//     const r = await sign3(e, t);
//     return ''.concat(r.protected, '.').concat(r.payload, '.').concat(r.signature);
// }
