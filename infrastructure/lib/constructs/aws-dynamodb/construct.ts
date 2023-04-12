/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface TableProps {
    readonly tableName?: string;
    readonly sortKey?: dynamodb.Attribute;
    readonly pointInTimeRecovery?: boolean;
}
export interface DynamoDBProps {
    readonly environment: string;
    readonly tableName?: string;
    readonly removalPolicy?: cdk.RemovalPolicy;
    readonly partitionKey?: string;
    readonly noSortKey?: boolean;
    readonly tableProps?: TableProps;
    readonly billingMode?: dynamodb.BillingMode;
    readonly writeCapacity?: number;
    readonly readCapacity?: number;
}

export class DynamoDB extends Construct {
    public readonly table: dynamodb.Table;

    constructor(scope: Construct, id: string, props: DynamoDBProps) {
        super(scope, id);
        const sortKeyValue =
            props.tableProps && props.tableProps.sortKey
                ? props.tableProps.sortKey
                : { name: 'createdAt', type: dynamodb.AttributeType.NUMBER };
        const sortKey = props.noSortKey ? undefined : sortKeyValue;
        const partitionKey = props.partitionKey || 'id';
        const removalPolicy = props.removalPolicy || cdk.RemovalPolicy.DESTROY;
        const tableName = props.tableName || id;

        this.table = new dynamodb.Table(this, id, {
            tableName: tableName,
            billingMode: props.billingMode
                ? props.billingMode
                : dynamodb.BillingMode.PROVISIONED,
            removalPolicy: removalPolicy,
            partitionKey: {
                name: partitionKey,
                type: dynamodb.AttributeType.STRING,
            },
            sortKey,
            ...props.tableProps,
        });

        new cdk.CfnOutput(this, `${id}-table-param`, {
            value: this.table.tableName,
            exportName: `${id}-table-param`,
        });
    }

    static fromTableName(
        scope: Construct,
        id: string,
        tableName: string
    ): dynamodb.ITable {
        return dynamodb.Table.fromTableName(scope, id, tableName);
    }

    static fromTableArn(
        scope: Construct,
        id: string,
        tableArn: string
    ): dynamodb.ITable {
        return dynamodb.Table.fromTableArn(scope, id, tableArn);
    }
}
