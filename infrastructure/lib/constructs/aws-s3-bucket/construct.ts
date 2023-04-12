/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * @summary The properties for the S3BucketProps class.
 */
export interface S3BucketProps {
  readonly environment: string
  readonly isProd: boolean
  readonly bucketName?: string
  readonly forceSnapshot?: boolean
  readonly disabeleAutoDelete?: boolean
  readonly s3props?: s3.BucketProps
}

export class S3Bucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3BucketProps) {
    super(scope, id);

    const {
      s3props, bucketName,
      isProd, forceSnapshot, disabeleAutoDelete,
    } = props;

    const autoDeleteObjects = !!disabeleAutoDelete;
    const removalPolicy = isProd ? (
      forceSnapshot ? (
        cdk.RemovalPolicy.SNAPSHOT
      ) : cdk.RemovalPolicy.RETAIN
    ) : cdk.RemovalPolicy.DESTROY;

    this.bucket = new s3.Bucket(this, `${id}-Bucket`, {
      bucketName: bucketName || `${id}-Bucket`,
      removalPolicy, autoDeleteObjects,
      encryption: s3.BucketEncryption.S3_MANAGED,
      ...s3props
    });
  }
}
