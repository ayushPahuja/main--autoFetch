#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline.stack';
import { InfrastructureStack } from '../lib/infrastructure.stack';
import { config } from 'dotenv';

// for loading the .env local variables
config();

const app = new cdk.App();

if (!process.env.DEV_ENV) {
    //main stack for pipelines in cicd and other components like DBs vpcs and service
    new PipelineStack(app, 'PipelineInfrastructureStack', {
        env: {
            account: '581544929967',
            region: 'ap-south-1',
        },
    });
} else {
    // testing environment for dev
    new InfrastructureStack(app, `${process.env.DEV_ENV}`, {
        env: {
            account: '965412407087',
            region: 'ap-south-1',
        },
        environment: `${process.env.DEV_ENV}`,
    });
}

app.synth();
