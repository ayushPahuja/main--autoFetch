import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
// import * as iam from 'aws-cdk-lib/aws-iam';
import { EventSourceMapping, Function, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path from 'path';


interface OffRampHandlerStackProps extends cdk.StackProps {
  readonly environment?: string;
  fargateTaskDefinition: ecs.FargateTaskDefinition;
  table: dynamodb.ITable;
}

export class OffRampHandlerStack extends cdk.Stack {
  public readonly offRampEventBus: events.EventBus;
  public readonly offRampEventRule: events.Rule;
  public readonly cronEventRule: events.Rule;
  public readonly queue: sqs.Queue;
  public readonly offramp_lambda: Function;
  public readonly txLifecycle_lambda: Function;
  public readonly consumerOffRampEventSourceMapping: EventSourceMapping;

  constructor(scope: Construct, id: string, props: OffRampHandlerStackProps) {
    super(scope, id, props);

    const { environment: env } = props;

    this.offRampEventBus = new events.EventBus(this, `${env}-OffRampEventBus`, {
      eventBusName: `${env}-OffRampEventBus`
    });

    this.offRampEventBus.grantPutEventsTo(props.fargateTaskDefinition.taskRole);

    this.offRampEventRule = new events.Rule(this, `${env}-OffRamp-Rule-Source`, {
      eventBus: this.offRampEventBus,
      eventPattern: {
        'source': [
          'offramp'
        ]
      }
    });
    this.queue = new sqs.Queue(this, `${env}-OffRamp-Queue`, { queueName: `${env}-OffRamp-Queue` });
    this.offRampEventRule.addTarget(new targets.SqsQueue(this.queue));

    // this.cronEventRule = new events.Rule(this, `${env}-OffRamp-Rule-cron`, {
    //   // eventBus: this.offRampEventBus,
    //   schedule: events.Schedule.expression('cron(* * * * ? *)'),
    // });

    //Lambda Function that consumes messages from queue
    this.offramp_lambda = new NodejsFunction(this, `${env}-offramp-lambda`, {
      entry: path.join(__dirname, '../../lambdas/offramp/index.ts'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      timeout: cdk.Duration.minutes(3),
      functionName: `${env}-offramp-lambda`,
      tracing: Tracing.ACTIVE,
      depsLockFilePath: path.join(__dirname, '../../../yarn.lock'),
      environment: {
        dynamoTableName: props.table.tableName,
        MUDREX_BASE_URL: env === 'prod' ? 'https://mudrex.com/' : 'https://sandbox.mudrex.com/',
        // TODO: OFFRAMP creds need to be updated for prod
        OFFRAMP_CLIENT_ID: secretsmanager.Secret.fromSecretNameV2(this, 'offramp-client-id', 'OFFRAMP_CLIENT_ID').secretValueFromJson('OFFRAMP_CLIENT_ID').unsafeUnwrap(),
        OFFRAMP_SECRET_KEY: secretsmanager.Secret.fromSecretNameV2(this, 'offramp-secret-key', 'OFFRAMP_SECRET_KEY').secretValueFromJson('OFFRAMP_SECRET_KEY').unsafeUnwrap(),
      }
    });

    // Lambda Function that's triggered on a schedule
    // this.txLifecycle_lambda = new NodejsFunction(this, `${env}-offramp-lambda-txLifecycle`, {
    //   entry: path.join(__dirname, '../../lambdas/offramp/index.ts'),
    //   runtime: Runtime.NODEJS_16_X,
    //   handler: 'txLifecycleHandler',
    //   timeout: cdk.Duration.minutes(1),
    //   functionName: `${env}-offramp-txLifecycle`,
    //   tracing: Tracing.ACTIVE,
    //   depsLockFilePath: path.join(__dirname, '../../../yarn.lock'),
    //   environment: {
    //     dynamoTableName: props.table.tableName,
    //     queueName: this.queue.queueName,
    //   }
    // });

    this.consumerOffRampEventSourceMapping = new EventSourceMapping(
      this,
      `${env}QueueConsumerOffRampFunctionSQSEvent`,
      {
        target: this.offramp_lambda,
        batchSize: 1,
        eventSourceArn: this.queue.queueArn,
      });

    // this.cronEventRule.addTarget(new targets.LambdaFunction(this.txLifecycle_lambda));

    this.queue.grantConsumeMessages(this.offramp_lambda);
    // this.queue.grantSendMessages(this.txLifecycle_lambda);

    props.table.grantFullAccess(this.offramp_lambda);
    // props.table.grantFullAccess(this.txLifecycle_lambda);

    new cdk.CfnOutput(this, `${env}-OffRampEventBusName`, { value: this.offRampEventBus.eventBusName, exportName: `${env}-OffRampEventBusName` });
    new cdk.CfnOutput(this, `${env}-OffRampEventBusArn`, { value: this.offRampEventBus.eventBusArn, exportName: `${env}-OffRampEventBusArn` });
  }
}
