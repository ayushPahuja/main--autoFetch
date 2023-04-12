import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure.stack';

export class ProdStage extends Stage {
    public readonly infrastructureStack: InfrastructureStack;

    constructor(scope: Construct, stageName: string, props: StageProps) {
        super(scope, stageName, props);

        this.infrastructureStack = new InfrastructureStack(this, 'ProdStage', {
            env: props.env,
            environment: 'prod',
        });
    }
}
