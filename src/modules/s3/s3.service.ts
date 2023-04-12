import { Injectable } from '@nestjs/common';
import { Upload } from '@aws-sdk/lib-storage';
import {
    S3Client,
    CompleteMultipartUploadOutput,
    ObjectCannedACL,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
    public client: S3Client;

    constructor() {
        this.client = new S3Client({ region: process.env.AWS_REGION });
    }

    async upload(
        bucket: string,
        key: string,
        dataBuffer: Buffer
    ): Promise<CompleteMultipartUploadOutput> {
        const parallelUploads3 = new Upload({
            client: this.client,
            params: {
                Bucket: bucket,
                Key: key,
                Body: dataBuffer,
                ACL: ObjectCannedACL.public_read,
            },
            queueSize: 4, // optional concurrency configuration
            partSize: 5 * Math.pow(2, 20), // optional size of each part, in bytes, at least 5MB
            leavePartsOnError: false, // optional manually handle dropped parts
        });

        parallelUploads3.on('httpUploadProgress', (progress) => {
            console.log('httpUploadProgress', progress);
        });

        return await parallelUploads3.done();
    }
}
