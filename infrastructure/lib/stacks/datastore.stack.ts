/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { DynamoDB } from '../constructs/aws-dynamodb';
import { S3Bucket } from '../constructs/aws-s3-bucket';

/**
 * @summary The properties for the APIDomainStackProps class.
 */
export interface DataStoreStackProps extends StackProps {
    readonly environment: string;
}

export class DataStoreStack extends Stack {
    public readonly registrationPinsStore: DynamoDB;
    public readonly connectDiscordStore: DynamoDB;
    public readonly connectTwitterStore: DynamoDB;
    public readonly socialOAuthStore: DynamoDB;
    public readonly userProfilesStore: DynamoDB;
    public readonly userContactsStore: DynamoDB;
    public readonly userWalletsStore: DynamoDB;
    public readonly transactionStatusStore: DynamoDB;
    public readonly userWalletkeysStore: DynamoDB;
    public readonly userMessageToken: DynamoDB;
    public readonly collegesStore: DynamoDB;
    public readonly userQuestStore: DynamoDB;
    public readonly questReferralStore: DynamoDB;
    public readonly profilePicturesBucket: S3Bucket;

    constructor(scope: Construct, id: string, props: DataStoreStackProps) {
        super(scope, id, props);

        const { environment: env } = props;

        this.profilePicturesBucket = new S3Bucket(
            this,
            `${env}-ProfilePictures-bucket`,
            {
                bucketName: `${env}-profilepictures-bucket`,
                environment: props.environment,
                isProd: env === 'prod',
            }
        );

        this.transactionStatusStore = new DynamoDB(
            this,
            `${env}-Transaction-Status`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'txId',
                tableProps: {
                    sortKey: {
                        name: 'createdAt',
                        type: cdk.aws_dynamodb.AttributeType.NUMBER,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
                writeCapacity: 50,
                readCapacity: 50
            }
        );

        this.transactionStatusStore.table.addGlobalSecondaryIndex({
            indexName: `userIdIndex`,
            partitionKey: {
                name: 'userId',
                type: cdk.aws_dynamodb.AttributeType.STRING,
            },
        });

        this.transactionStatusStore.table.addGlobalSecondaryIndex({
            indexName: `statusIndex`,
            partitionKey: {
                name: 'status',
                type: cdk.aws_dynamodb.AttributeType.STRING,
            },
        });

        this.transactionStatusStore.table.addGlobalSecondaryIndex({
            indexName: `initTimeIndex`,
            partitionKey: {
                name: 'initTime',
                type: cdk.aws_dynamodb.AttributeType.NUMBER,
            },
        });

        this.registrationPinsStore = new DynamoDB(
            this,
            `${env}-Registration-Pins`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'id',
                noSortKey: true,
                tableProps:{
                    pointInTimeRecovery: env === 'prod' ? true : false
                  }
            }
        );

        this.connectDiscordStore = new DynamoDB(
            this,
            `${env}-Connect-Discord`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'id',
                tableProps: {
                    sortKey: {
                        name: 'userId',
                        type: cdk.aws_dynamodb.AttributeType.STRING,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
            }
        );

        this.connectTwitterStore = new DynamoDB(
            this,
            `${env}-Connect-Twitter`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'id',
                tableProps: {
                    sortKey: {
                        name: 'userId',
                        type: cdk.aws_dynamodb.AttributeType.STRING,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
            }
        );

        this.socialOAuthStore = new DynamoDB(this, `${env}-Social-OAuth`, {
            environment: props.environment,
            removalPolicy:
                env === 'prod'
                    ? cdk.RemovalPolicy.RETAIN
                    : cdk.RemovalPolicy.DESTROY,
            partitionKey: 'provider',
            noSortKey: true,
            tableProps:{
                pointInTimeRecovery: env === 'prod' ? true : false
              }
        });

        this.userProfilesStore = new DynamoDB(this, `${env}-User-Profiles`, {
            environment: props.environment,
            removalPolicy:
                env === 'prod'
                    ? cdk.RemovalPolicy.RETAIN
                    : cdk.RemovalPolicy.DESTROY,
            partitionKey: 'userId',
            noSortKey: true,
            tableProps:{
                pointInTimeRecovery: env === 'prod' ? true : false
              }
        });

        this.userProfilesStore.table.addGlobalSecondaryIndex({
            indexName: `usernameIndex`,
            partitionKey: {
                name: 'username',
                type: cdk.aws_dynamodb.AttributeType.STRING || undefined,
            },
        });

        this.userContactsStore = new DynamoDB(this, `${env}-User-Contacts`, {
            environment: props.environment,
            removalPolicy:
                env === 'prod'
                    ? cdk.RemovalPolicy.RETAIN
                    : cdk.RemovalPolicy.DESTROY,
            partitionKey: 'userId',
            tableProps: {
                sortKey: {
                    name: 'contactUserId',
                    type: cdk.aws_dynamodb.AttributeType.STRING,
                },
                pointInTimeRecovery: env === 'prod' ? true : false
            },
        });

        this.userWalletsStore = new DynamoDB(this, `${env}-User-Wallets`, {
            environment: props.environment,
            removalPolicy:
                env === 'prod'
                    ? cdk.RemovalPolicy.RETAIN
                    : cdk.RemovalPolicy.DESTROY,
            partitionKey: 'userId',
            tableProps: {
                sortKey: {
                    name: 'address',
                    type: cdk.aws_dynamodb.AttributeType.STRING,
                },
                pointInTimeRecovery: env === 'prod' ? true : false
            },
            readCapacity: env === 'prod' ? 50 : 1.5,
        });
        this.userWalletkeysStore = new DynamoDB(
            this,
            `${env}-User-Walletkeys`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'userId',
                tableProps: {
                    sortKey: {
                        name: 'address',
                        type: cdk.aws_dynamodb.AttributeType.STRING,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
            }
        );
        this.userMessageToken = new DynamoDB(
            this,
            `${env}-User-Message-Token`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'userId',
                tableProps: {
                    sortKey: {
                        name: 'fcmToken',
                        type: cdk.aws_dynamodb.AttributeType.STRING,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
            }
        );
        this.userQuestStore  = new DynamoDB(
            this,
            `${env}-user-quest`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'id',
                tableProps: {
                    sortKey: {
                        name: 'userId',
                        type: cdk.aws_dynamodb.AttributeType.STRING,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
            }
        );
        this.questReferralStore  = new DynamoDB(
            this,
            `${env}-quest-referral`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'id'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'id',
                tableProps: {
                    sortKey: {
                        name: 'userId',
                        type: cdk.aws_dynamodb.AttributeType.STRING,
                    },
                    pointInTimeRecovery: env === 'prod' ? true : false
                },
            }
        );
        this.collegesStore = new DynamoDB(
            this,
            `${env}-Colleges`,
            {
                environment: props.environment,
                removalPolicy:
                    env === 'prod'
                        ? cdk.RemovalPolicy.RETAIN
                        : cdk.RemovalPolicy.DESTROY,
                partitionKey: 'id',
                tableProps: {
                    sortKey: {
                        name: 'createdAt',
                        type: cdk.aws_dynamodb.AttributeType.NUMBER,
                    },
                },
            }
        );
        this.collegesStore.table.addGlobalSecondaryIndex({
            indexName: `nameIndex`,
            partitionKey: {
                name: 'name',
                type: cdk.aws_dynamodb.AttributeType.STRING,
            },
        });
    }
}
