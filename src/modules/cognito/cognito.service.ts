import {
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminGetUserCommand,
    AdminInitiateAuthCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand,
    CognitoIdentityProviderClient as CognitoClient,
    ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteUserDto } from '@modules/authentication/dto';
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { CognitoConfig } from './cognito.config';
import {
    AuthenticateUserDto,
    AuthenticateUserOutputDto,
    GetUserDto,
    GetUserInputDto,
    RegisterUserDto
} from './dto';

@Injectable()
export class CognitoService {
    private readonly client: CognitoClient;

    constructor(private readonly cognitoConfig: CognitoConfig) {
        this.client = new CognitoClient({ region: cognitoConfig.region });
    }

    async register({ username }: RegisterUserDto): Promise<void> {
        const password = createHash('md5').update(username).digest('hex');

        const adminCreateUserCommand = new AdminCreateUserCommand({
            UserPoolId: this.cognitoConfig.userPoolId,
            Username: username,
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS',
        });
        await this.client.send(adminCreateUserCommand);

        const adminSetUserPasswordCommand = new AdminSetUserPasswordCommand({
            Password: password,
            Permanent: true,
            Username: username,
            UserPoolId: this.cognitoConfig.userPoolId,
        });
        await this.client.send(adminSetUserPasswordCommand);
    }

    async getUser({ username }: GetUserInputDto): Promise<GetUserDto> {
        const adminGetUserCommand = new AdminGetUserCommand({
            Username: username,
            UserPoolId: this.cognitoConfig.userPoolId,
        });

        const result = await this.client.send(adminGetUserCommand);

        const userDto = {} as GetUserDto;
        result.UserAttributes.forEach((u) => (userDto[u.Name] = u.Value));

        userDto.userId = userDto.sub;
        userDto.username = userDto.sub;

        return userDto;
    }

    async userExists({ username }: GetUserInputDto): Promise<boolean> {
        try {
            const foundUser = await this.getUser({ username: username });
            return !!foundUser;
        } catch (e) {
            return false;
        }
    }

    async deleteUser({ username }: DeleteUserDto): Promise<void> {
        const adminDeleteUserCommand = new AdminDeleteUserCommand({
            Username: username,
            UserPoolId: this.cognitoConfig.userPoolId,
        });
        await this.client.send(adminDeleteUserCommand);
    }

    async authenticate({
        username,
    }: AuthenticateUserDto): Promise<AuthenticateUserOutputDto> {
        const password = createHash('md5').update(username).digest('hex');

        const adminInitiateAuthCommand = new AdminInitiateAuthCommand({
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            ClientId: this.cognitoConfig.clientId,
            UserPoolId: this.cognitoConfig.userPoolId,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        });

        const result = await this.client.send(adminInitiateAuthCommand);

        return {
            idToken: result.AuthenticationResult?.IdToken ?? null,
            accessToken: result.AuthenticationResult?.AccessToken ?? null,
            refreshToken: result.AuthenticationResult?.RefreshToken ?? null
        };
    }

    async refresh({
        refresh_token,
    }): Promise<AuthenticateUserOutputDto> {
        const adminInitiateAuthCommand = new AdminInitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN',
            ClientId: this.cognitoConfig.clientId,
            UserPoolId: this.cognitoConfig.userPoolId,
            AuthParameters: {
                REFRESH_TOKEN: refresh_token,
            },
        });
        const result = await this.client.send(adminInitiateAuthCommand);
        return {
            idToken: result.AuthenticationResult?.IdToken ?? null,
            accessToken: result.AuthenticationResult?.AccessToken ?? null,
            refreshToken: result.AuthenticationResult?.RefreshToken ?? null
        };
    }

    async addEmailAtribute(userId: string, email: string): Promise<any> {
        const input:any = {
            UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
            Username: userId,
            UserAttributes: [
                {'Name': 'email',
                'Value': email}
            ],
        };
        const command = new AdminUpdateUserAttributesCommand(input);
        try {
            const emailUpdated = await this.client.send(command)
            return emailUpdated;
        } catch (error) {
            console.log("error", error)
        }
      }
      
      async verifyEmailAtribute(userId: string): Promise<any> {
        const input:any = {
            UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
            Username: userId,
            UserAttributes: [
                {'Name': 'email_verified',
                'Value': "true"}
            ],
        };
        const command = new AdminUpdateUserAttributesCommand(input);
        try {
            const emailUpdated = await this.client.send(command)
            return emailUpdated;
        } catch (error) {
            console.log("error", error)
        }
      }
      
      async getCognitodata(id: string): Promise<any> {
        const adminGetUserCommand = new AdminGetUserCommand({
            Username: id,
            UserPoolId: this.cognitoConfig.userPoolId,
        });
      
        const result = await this.client.send(adminGetUserCommand);
      
        return result;
      }

      async getCognitoUsers(key: string, value: string): Promise<any> {
        const adminGetUserCommand = new ListUsersCommand({
            AttributesToGet: [
                key,
              ],
              Filter: `${key} = \"${value}\"`,
            UserPoolId: this.cognitoConfig.userPoolId,
        });
        const result = await this.client.send(adminGetUserCommand);
        return result;
      }
}
