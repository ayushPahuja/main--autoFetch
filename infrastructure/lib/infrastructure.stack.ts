import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataStoreStack } from './stacks/datastore.stack';
import { MiddlewareStack } from './stacks/middleware.stack';
import { OffRampHandlerStack } from './stacks/offramp-handler.stack';
import { UserPool } from './stacks/userpool.stack';
import { VPCStack } from './stacks/vpc.stack';

export interface InfrastructureStackProps extends StackProps {
  readonly environment: string;
}

export class InfrastructureStack extends Stack {
  public readonly vpcStack: VPCStack;
  public readonly middlewareStack: MiddlewareStack;
  public readonly userPool: UserPool;
  public readonly dataStore: DataStoreStack;
  public readonly offramphandler: OffRampHandlerStack;

  constructor(
    scope: Construct,
    stageName: string,
    props: InfrastructureStackProps
  ) {
    super(scope, stageName, props);

    const { environment: env } = props;

    this.vpcStack = new VPCStack(this, `${env}-VpcStack`, {
      environment: props.environment,
      stackName: `${env}-VpcStack`,
      env: {
        region: props?.env?.region,
        account: props?.env?.account,
      },
    });

    this.userPool = new UserPool(this, `${env}-UserPool`, {
      environment: props.environment,
      stackName: `${env}-UserPool`,
      env: {
        region: props?.env?.region,
        account: props?.env?.account,
      },
    });

    this.dataStore = new DataStoreStack(this, `${env}-DataStoreStack`, {
      environment: props.environment,
      stackName: `${env}-DataStoreStack`,
      env: {
        region: props?.env?.region,
        account: props?.env?.account,
      },
    });

    this.middlewareStack = new MiddlewareStack(this, `${env}-MiddlewareStack`, {
      environment: props.environment,
      stackName: `${env}-MiddlewareStack`,
      vpc: this.vpcStack.vpc,
      userPool: this.userPool.userPool,
      userPoolClient: this.userPool.userPoolClient,
      env: {
        region: props?.env?.region,
        account: props?.env?.account,
      },

    });

    this.offramphandler = new OffRampHandlerStack(this, `${env}-OffRampHandlerStack`, {
      environment: props.environment,
      stackName: `${env}-OffRampHandlerStack`,
      fargateTaskDefinition: this.middlewareStack.fargateTaskDefinition,
      table: this.dataStore.transactionStatusStore.table,
      env: {
        region: props?.env?.region,
        account: props?.env?.account,
      },
    })

    this.middlewareStack.addDependency(this.userPool);
    this.middlewareStack.addDependency(this.dataStore);
    this.middlewareStack.addDependency(this.vpcStack);
  }
}
