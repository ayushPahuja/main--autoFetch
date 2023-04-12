import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, NetworkMode } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

interface BackendStackProps extends cdk.StackProps {
    readonly vpc: ec2.Vpc;
    readonly environment?: string;
    readonly envVars?: object;
    readonly userPool: cdk.aws_cognito.UserPool;
    readonly userPoolClient: cdk.aws_cognito.UserPoolClient;
}

export class MiddlewareStack extends cdk.Stack {
    public readonly fargateTaskDefinition: ecs.FargateTaskDefinition;
    public readonly albService: ecs_patterns.ApplicationLoadBalancedFargateService;
    public readonly cluster: ecs.Cluster;
    public readonly logger: ecs.AwsLogDriver;

    constructor(scope: Construct, id: string, props: BackendStackProps) {
        super(scope, id, props);

        this.logger = new ecs.AwsLogDriver({
            streamPrefix: 'indigg-mvp',
        });

        const { vpc, envVars, environment: env, userPool, userPoolClient } = props;

        cdk.Tags.of(vpc).add('environment', `${env}`);

        //cluster for the backend service
        this.cluster = new ecs.Cluster(this, `${env}-middleware-cluster`, {
            vpc: vpc,
            enableFargateCapacityProviders: true,
            containerInsights: true,
            clusterName: `${env}-middleware-cluster`,
        });

        this.logger = new ecs.AwsLogDriver({
            streamPrefix: `${env}-middleware-cluster`,
        });

        this.fargateTaskDefinition = new ecs.FargateTaskDefinition(
            this,
            `${env}-middleware-TaskDef`,
            {
                memoryLimitMiB: 4096,
                cpu: 1024,
            }
        );

        this.fargateTaskDefinition.addToExecutionRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['*'],
                resources: ['*'],
            })
        );

        this.fargateTaskDefinition.addToTaskRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['*'],
                resources: ['*'],
            })
        );

        this.fargateTaskDefinition.addContainer(`${env}-middleware-task-container`, {
            image: ecs.ContainerImage.fromDockerImageAsset(
                new DockerImageAsset(this, `${env}-middleware-task-container`, {
                    directory: path.join(__dirname, '../../../'),
                    networkMode: NetworkMode.HOST,
                })
            ),
            logging: this.logger,
            memoryLimitMiB: 4096,
            cpu: 1024,
            portMappings: [
                {
                    containerPort: 3000,
                    protocol: ecs.Protocol.TCP,
                },
            ],
            environment: {
                // DB_HOST: '',
                AWS_REGION: props.env.region,
                AWS_ACCOUNT: props.env.account,
                NODE_ENV: env,
                AWS_COGNITO_USER_POOL_ID: userPool.userPoolId,
                AWS_COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
                SLACK_AUTH_TOKEN: secretsmanager.Secret.fromSecretNameV2(this, 'SLACK_AUTH_TOKEN', 'SLACK_AUTH_TOKEN').secretValueFromJson('SLACK_AUTH_TOKEN').unsafeUnwrap(),
                INDIGG_OTP_CHANNEL_ID: 'C04EB9QTFGE',
                MUDREX_BASE_URL: env === 'prod' ? 'https://mudrex.com/' : 'https://sandbox.mudrex.com/',
                // TODO: OFFRAMP creds need to be updated for prod
                OFFRAMP_CLIENT_ID: secretsmanager.Secret.fromSecretNameV2(this, 'offramp-client-id', 'OFFRAMP_CLIENT_ID').secretValueFromJson('OFFRAMP_CLIENT_ID').unsafeUnwrap(),
                OFFRAMP_SECRET_KEY: secretsmanager.Secret.fromSecretNameV2(this, 'offramp-secret-key', 'OFFRAMP_SECRET_KEY').secretValueFromJson('OFFRAMP_SECRET_KEY').unsafeUnwrap(),
                PRIVATE_KEY: secretsmanager.Secret.fromSecretNameV2(this, 'private-key', 'PRIVATE_KEY').secretValueFromJson('PRIVATE_KEY').unsafeUnwrap(),
                // TODO: The below need to be updated for Matic Mainnet (Prod)
                CHAIN_ID: env === 'prod' ? '137' : '80001',
                USDT_ADDRESS: env === 'prod' ? '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' : '0xa8811925bFC041160624E0Fdf5F0708F1400721D',
                GAS_STATION_URL: env === 'prod' ? 'https://gasstation-mainnet.matic.network/v2' : 'https://gasstation-mumbai.matic.today/v2',
                PROVIDER_NAME: env === 'prod' ? 'matic' : 'maticmum',
                INFURA_KEY: secretsmanager.Secret.fromSecretNameV2(this, 'INFURA_KEY', 'INFURA_KEY').secretValueFromJson('INFURA_KEY').unsafeUnwrap(),
                BICONOMY_API_KEY: secretsmanager.Secret.fromSecretNameV2(this, 'BICONOMY_API_KEYBICONOMY_API_KEY', 'BICONOMY_API_KEY').secretValueFromJson('BICONOMY_API_KEY').unsafeUnwrap(),
                APPROVE_API_ID: secretsmanager.Secret.fromSecretNameV2(this, 'APPROVE_API_ID', 'APPROVE_API_ID').secretValueFromJson('APPROVE_API_ID').unsafeUnwrap(),
                TRANSFER_API_ID: secretsmanager.Secret.fromSecretNameV2(this, 'TRANSFER_API_ID', 'TRANSFER_API_ID').secretValueFromJson('TRANSFER_API_ID').unsafeUnwrap(),
                MORALIS_API_KEY: env === 'prod' ? '' : 'Hgy8UwB5FB7R8vsPc4GocfTq5iOrVsfjPuYWjGN11EkQqLbvxddPiyJakleGfrMH',
                CHAIN_NAME: env === 'prod' ? 'matic' : 'mumbai',
                COVALENT_API_KEY: env === 'prod' ? 'ckey_068f2d4768a141568514104dd6c' : 'ckey_068f2d4768a141568514104dd6c',
                STRAPI_BASE_URL: 'http://cdkst-servi-1gi1r9u88sjia-1845714100.ap-south-1.elb.amazonaws.com/',
                ...(envVars || {}),
                SENTRY_DNS: 'https://a425f128761745569142b068033be1ca@o4504648487796736.ingest.sentry.io/4504694016835584',
                GUPSHUP_USER_ID: secretsmanager.Secret.fromSecretNameV2(this, 'GUPSHUP_USER_ID', 'GUPSHUP_USER_ID').secretValueFromJson('GUPSHUP_USER_ID').unsafeUnwrap(),
                GUPSHUP_USER_PASSWORD: secretsmanager.Secret.fromSecretNameV2(this, 'GUPSHUP_USER_PASSWORD', 'GUPSHUP_USER_PASSWORD').secretValueFromJson('GUPSHUP_USER_PASSWORD').unsafeUnwrap(),
                GUPSHUP_BASE_URL: 'https://enterprise.smsgupshup.com/GatewayAPI/rest',
                INDIGG_WEBSITE_HOST_URL : env === 'prod' ? `https://indi.gg` : `http://stage1.devindigg.com`,
                NETWORK : env === 'prod' ? `MATIC` : `MATIC_MUMBAI`,
                },
        });

        //Create a load-balanced Fargate service and make it public
        this.albService = new ecs_patterns.ApplicationLoadBalancedFargateService(
            this,
            `${env}-middleware-albfargate`,
            {
                cluster: this.cluster, // Required
                // circuitBreaker: {
                //     rollback: true,
                // },
                memoryLimitMiB: 4096,
                cpu: 1024,
                desiredCount: 1, // Default is 1
                taskDefinition: this.fargateTaskDefinition,
                taskSubnets: {
                    subnets: vpc.selectSubnets({
                        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
                    }).subnets,
                },
                // assignPublicIp: false,
                loadBalancerName: `${env}-middleware-alb`,
                publicLoadBalancer: true, // Default is true
            }
        );


        new cdk.CfnOutput(this, `${id}-clusterArn`, {
            value: this.albService.cluster.clusterArn,
            exportName: `${id}-clusterArn`,
        });
        new cdk.CfnOutput(this, `${id}-serviceArn`, {
            value: this.albService.service.serviceArn,
            exportName: `${id}-serviceArn`,
        });
        new cdk.CfnOutput(this, `${id}-alb-name`, {
            value: this.albService.loadBalancer.loadBalancerName,
            exportName: `${id}-alb-name`,
        });
        new cdk.CfnOutput(this, `${id}-alb-arn`, {
            value: this.albService.loadBalancer.loadBalancerArn,
            exportName: `${id}-alb-arn`,
        });
        new cdk.CfnOutput(this, `${id}-alb-dns`, {
            value: this.albService.loadBalancer.loadBalancerDnsName,
            exportName: `${id}-alb-dns`,
        });
        new cdk.CfnOutput(this, `${id}-alb-hostedZoneId`, {
            value: this.albService.loadBalancer.loadBalancerCanonicalHostedZoneId,
            exportName: `${id}-alb-hostedZoneId`,
        });
    }
}
