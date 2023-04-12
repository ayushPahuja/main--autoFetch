import { Context, SQSEvent } from 'aws-lambda';


export async function handler(event: SQSEvent, context: Context): Promise<void> {
  console.log(
    'Im running',
    JSON.stringify(event)
  );
};
