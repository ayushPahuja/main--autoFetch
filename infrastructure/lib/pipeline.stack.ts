import * as cdk from 'aws-cdk-lib';
import { Fn } from 'aws-cdk-lib';
import {
    CodePipeline,
    CodePipelineSource,
    ShellStep,
    ManualApprovalStep
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PreProdStage } from './pre-prod.stage';
import { ProdStage } from './prod.stage';

export class PipelineStack extends cdk.Stack {
    public readonly pipeline: CodePipeline;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.pipeline = new CodePipeline(this, 'Pipeline', {
            pipelineName: 'MvpPipeline',
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub(
                    'indi-gg/api-backend',
                    'pre-prod'
                ),
                commands: [
                    'node --version',
                    'npm --version',
                    'yarn --version',
                    'yarn install --frozen-lockfile --ignore-engines',
                    // 'npm install',
                    // 'npm ci',
                    'npx cdk synth'
                ],
            }),
            crossAccountKeys: true,
        });


        const preprodstage =  new PreProdStage(this, 'PreProdStage', {
            env: {
                account: '035475678676',
                region: 'ap-south-1',
            }
        });

        const a = preprodstage.infrastructureStack.middlewareStack.albService.loadBalancer.loadBalancerFullName
        //deployment with multi account strategy in pre-prod stage
        this.pipeline.addStage(
            preprodstage,
            // {
            //     post: [new ShellStep('TestService',{
            //         commands: [
            //             // Use 'curl' to GET the given URL and fail if it returns an error
            //             'curl -Ssf $ENDPOINT_URL',
            //           ],
            //           env:{
            //             ENDPOINT_URL: "http://pre-prod-middleware-alb-1510604257.ap-south-1.elb.amazonaws.com"
            //           }
            //     })]
            // }
        );

        //deployment also in other account for production
        this.pipeline.addStage(
            new ProdStage(this, 'ProdStage', {
                env: {
                    account: '751292672910',
                    region: 'ap-south-1',
                }
            }),
            {
                pre: [
                    new ManualApprovalStep('PromoteToProd', {
                        comment: "After this step the infrastructure and the application going to be deployed in Production"
                    })
                ]
            }
        );
    }
}
