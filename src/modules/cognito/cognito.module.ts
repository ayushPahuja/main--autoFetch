import { Global, Module } from '@nestjs/common';
import { CognitoConfig } from './cognito.config';
import { CognitoService } from './cognito.service';

@Global()
@Module({
    providers: [CognitoConfig, CognitoService],
    exports: [CognitoConfig, CognitoService],
})
export class CognitoModule {}
