import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VPCStackProps extends cdk.StackProps {
    readonly environment: string;
}

export class VPCStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: VPCStackProps) {
        super(scope, id, props);

        const { environment: env } = props;

        //creation of the vpc
        this.vpc = new ec2.Vpc(this, `${env}-vpc`, {
            maxAzs: 2,
            subnetConfiguration: [
                {
                    cidrMask: 20,
                    name: 'public-subnet-1',
                    subnetType: ec2.SubnetType.PUBLIC,
                    mapPublicIpOnLaunch: false,
                },
                {
                    cidrMask: 20,
                    name: 'application',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
                },
                {
                    cidrMask: 20,
                    name: 'isolated-subnet-1-data',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });

        new CfnOutput(this, `${env}-VpcIdOutput`, {
            exportName: `${env}-vpc-ID`,
            value: this.vpc.vpcId,
        });
    }
}
