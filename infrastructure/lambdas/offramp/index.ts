import { Context, SQSEvent, SQSHandler } from 'aws-lambda';

import {
    getUserDetails,
    getWithdrawalBalance,
    offrampFiatSell,
    recordCritical,
    recordLineage,
} from './lib';
import {
    ALL_OK,
    HandleTXMsgResponseDTO,
    INSUFFICIENT_BALANCE_ERROR_CODE,
    KYC_NOT_VERIFIED_ERROR_CODE,
    PROVIDER_ERROR_CODE,
    TXInboundMessage,
} from './messages.dto';

// export { handler as txLifecycleHandler } from './tx-lifecycle';

/**
 * Main lambda handler endpoint
 *
 * @param event SQSEvent
 * @param context Context
 * @returns
 */
export async function handler(event: SQSEvent, context: Context): Promise<void> {
    console.log('incoming event 👉', event);

    for (const record of event.Records) {
        console.log(
            'Message Attributes',
            JSON.stringify(record.messageAttributes)
        );
        console.log('Message Id', record.messageId);
        console.log('Message Body', record.body);

        try {
            const txMsg: TXInboundMessage = JSON.parse(record.body).detail;

            await recordLineage(txMsg.txn_hash, 'PENDING', txMsg, {}, record);

            console.log('Processing TX (txn_hash)', txMsg.txn_hash);
            console.log('Processing TX (user_id)', txMsg.user_id);
            console.log('Processing TX (wallet_address)', txMsg.wallet_address);

            const txResult = await handleTXMsg(txMsg);

            console.log(
                'Result TX (txn_hash)',
                txMsg.txn_hash,
                txResult.success,
                txResult.code,
                txResult.text
            );
            console.log(
                'Result TX (user_id)',
                txMsg.user_id,
                txResult.success,
                txResult.code,
                txResult.text
            );
            console.log(
                'Result TX (wallet_address)',
                txMsg.wallet_address,
                txResult.success,
                txResult.code,
                txResult.text
            );

            if (!txResult.success) {
                switch (txResult.code) {
                    case INSUFFICIENT_BALANCE_ERROR_CODE:
                        // for low balance error, we just mark the TX as pending to retry later
                        return await recordLineage(
                            txMsg.txn_hash,
                            'PENDING',
                            txMsg,
                            txResult,
                            record
                        );
                    case KYC_NOT_VERIFIED_ERROR_CODE:
                        // KYC errors need to be handled by contacting the user
                        return await recordLineage(
                            txMsg.txn_hash,
                            'KYC_ERROR',
                            txMsg,
                            txResult,
                            record
                        );
                    case PROVIDER_ERROR_CODE:
                        // Propably integration error? this needs to alert a sys admin
                        return await recordLineage(
                            txMsg.txn_hash,
                            'CRITICAL_ERROR',
                            txMsg,
                            txResult,
                            record
                        );
                    default:
                        // Ouufff.. good luck.
                        return await recordLineage(
                            txMsg.txn_hash,
                            'UNKNOWN_ERROR',
                            txMsg,
                            txResult,
                            record
                        );
                }
            }

            // Happy path, all is ok, the transaction is processed
            return await recordLineage(
                txMsg.txn_hash,
                'ALL_OK',
                txMsg,
                txResult,
                record
            );
        } catch (error) {
            console.log('Error on Message Id', record.messageId, error);
            // Code Critical error has happened, let's try our best to not loose data
            return await recordCritical(record.messageId, record);
        }
    }
}

/**
 * Main handler logic per record
 *
 * @param txMsg TXInboundMessage
 * @returns
 */
export async function handleTXMsg(
    txMsg: TXInboundMessage
): Promise<HandleTXMsgResponseDTO> {
    const balance = await getWithdrawalBalance(txMsg.user_id);
    const hasAvailableBalance =
        'available_balance' in balance && balance.available_balance > 0;

    // die early if we're still missing balance
    if (!hasAvailableBalance)
        return {
            success: false,
            code: INSUFFICIENT_BALANCE_ERROR_CODE,
            text: "User doesn't have sufficient balance",
        };

    const userDetailsResponse = await getUserDetails(txMsg.user_id);
    const kycIsVerified = userDetailsResponse.kyc_status === 'Verified';

    // if not KYC yet is verified, exit early
    if (!kycIsVerified)
        return {
            success: false,
            code: KYC_NOT_VERIFIED_ERROR_CODE,
            text: 'User Not Verified',
        };

    const source_id = userDetailsResponse.bank_accounts[0].bank_id;
    const offrampSellResponse = await offrampFiatSell(
        txMsg.user_id,
        source_id,
        {
            fiat_symbol: txMsg.fiat_symbol,
            crypto_symbol: txMsg.crypto_symbol,
            fiat_amount: txMsg.fiat_amount,
            crypto_amount: txMsg.crypto_amount,
            payment_method: txMsg.payment_method,
        }
    );
    const sellSucceed = offrampSellResponse.failure_code === null;

    // if our fiat sell payment has failed (not succeed)
    if (!sellSucceed)
        return {
            success: false,
            code: PROVIDER_ERROR_CODE,
            // @ts-ignore
            text: `failure_code: ${offrampSellResponse.failure_code} and failure_desc: ${offrampSellResponse.failure_desc}`,
        };

    // happy path, all good.
    return {
        success: true,
        code: ALL_OK,
        text: 'Transaction processed',
        user_id: txMsg.user_id,
        offrampSellResponse: offrampSellResponse,
    };
}
