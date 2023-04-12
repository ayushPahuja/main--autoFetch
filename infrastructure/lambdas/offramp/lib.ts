import aws from 'aws-sdk';
import axios from 'axios';
import { createHmac } from 'crypto';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';


import {
  OfframpSellDataResponseDTO,
  TXInboundMessage,
  UserDetailsResponseDTO,
  WalletBalanceDTO,
  WithdrawRequestParamsDTO
} from './messages.dto';

const DYNAMO_TABLE = process.env.dynamoTableName!;
const dbClient = new aws.DynamoDB.DocumentClient({ apiVersion: 'latest' });

const OFFRAMP_SECRET_KEY = process.env.OFFRAMP_SECRET_KEY!;
const OFFRAMP_CLIENT_ID = process.env.OFFRAMP_CLIENT_ID!;
const MUDREX_BASE_URL = process.env.MUDREX_BASE_URL!;

const userBalanceEndpoint = () => join(MUDREX_BASE_URL, 'api/v1/wallet/balance?account=SPOT');
const userDetailsEndpoint = (user_id: string) => join(MUDREX_BASE_URL, `api/v1/user/client_user?user_uuid=${user_id}`);
const cryptoSellEndpoint = () => join(MUDREX_BASE_URL, 'api/v1/wallet/conversion/fiat/sell');


export async function offrampFiatSell(user_id: string, source_id: string, withdrawRequestParams: WithdrawRequestParamsDTO): Promise<OfframpSellDataResponseDTO> {
  const options = createOptionsConfig(user_id);
  const { data } = await axios.post(
    cryptoSellEndpoint(),
    { ...withdrawRequestParams, source_id },
    options
  );

  return handleResponses(data);
}

export async function getUserDetails(user_id: string): Promise<UserDetailsResponseDTO> {
  const options = createOptionsConfig(user_id);
  const { data } = await axios.get(userDetailsEndpoint(user_id), options);

  return handleResponses(data);
}

export async function getWithdrawalBalance(user_id: string): Promise<WalletBalanceDTO> {
  const options = createOptionsConfig(user_id);
  const { data } = await axios.get(userBalanceEndpoint(), options);

  return handleResponses(data);
}

export async function recordLineage(txId: string, status: string, txMsg: TXInboundMessage, result?: object, meta?: object): Promise<void> {
  const dateNow = Date.now();
  const { user_id, ...txBody } = txMsg;

  await dbClient.put({
    TableName: DYNAMO_TABLE,
    Item: {
      txId,
      status,
      userId: user_id,
      ...txBody,
      createdAt: dateNow,
      result: result || {},
      meta: meta || {},
    }
  }).promise();
}

export async function recordCritical(messageId: string, meta?: object): Promise<void> {
  const dateNow = Date.now();

  await dbClient.put({
    TableName: DYNAMO_TABLE,
    Item: {
      txId: `unknown_${messageId}`,
      userId: 'UNKNOWN_USER',
      status: 'CRITICAL_ERROR',
      createdAt: dateNow,
      result: {},
      meta: meta || {},
    }
  }).promise();
}

export function createOptionsConfig(
  user_id: string,
  registerUserFlag: boolean = false
) {
  const timeInSeconds = Math.floor(Date.now() / 1000);
  const requestId = uuidv4();
  const sigString = registerUserFlag
    ? requestId + timeInSeconds
    : requestId + timeInSeconds + user_id;
  const secretKey = createHmac('sha256', OFFRAMP_SECRET_KEY)
    .update(sigString)
    .digest()
    .toString('hex')
    .toUpperCase();

  const headers = registerUserFlag
    ? {
      'X-Timestamp': timeInSeconds,
      'X-Client-Id': OFFRAMP_CLIENT_ID,
      'X-Secret-Key': secretKey,
      'X-Request-Id': requestId,
    }
    : {
      'X-Timestamp': timeInSeconds,
      'X-Client-Id': OFFRAMP_CLIENT_ID,
      'X-User-Id': user_id,
      'X-Secret-Key': secretKey,
      'X-Request-Id': requestId,
    };
  const options = {
    headers,
  };
  return options;
}

function handleResponses(data) {
  if (data.success) {
    return data.data;
  }

  throw data.errors;
}



// function handleErrors(error) {
//   return {
//     success: false,
//     // @ts-ignore
//     code: error.response.data.errors[0].code,
//     // @ts-ignore
//     text: error.response.data.errors[0].text,
//   };
// }
