import {
    CfnOutput,
    Duration,
    Stack,
    StackProps,
    RemovalPolicy,
} from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { UserPool as CognitoUserPool } from 'aws-cdk-lib/aws-cognito';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface UserPoolStackProps extends StackProps {
    readonly environment: string;
}

export class UserPool extends Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props: UserPoolStackProps) {
        super(scope, id, props);

        const { environment: env } = props;

        this.userPool = this.createUserPool(env);
        this.userPoolClient = this.createUserPoolClient(env);
        this.createUserPoolGoogleIdentityProvider(env, this.userPool);
    }

    private createUserPool(env: string): cognito.UserPool {
        const optionalCognitoFieldConfig = {
            required: false,
            mutable: true,
        };

        // Create the Cognito UserPool that serves as the global users database for the application
        // The pool is "private" by design and the only way to interact with it is through API calls to the REST APIs
        const userPool = new cognito.UserPool(this, `${env}-user-pool`, {
            userPoolName: `${env}-user-pool`,
            signInAliases: {
                phone: true,
            },
            selfSignUpEnabled: true,
            signInCaseSensitive: true,
            autoVerify: {
                phone: true,
            },
            standardAttributes: {
                givenName: optionalCognitoFieldConfig,
                profilePicture: optionalCognitoFieldConfig,
                email: optionalCognitoFieldConfig,
                phoneNumber: optionalCognitoFieldConfig,
            },
            customAttributes: {
                pincode: new cognito.NumberAttribute({ mutable: true }),
                college_name: new cognito.StringAttribute({ mutable: true }),
                public_key: new cognito.StringAttribute({ mutable: true }),
                chain: new cognito.StringAttribute({ mutable: true }),
            },
            accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
            removalPolicy:
                env === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            passwordPolicy: {
                minLength: 8,
                requireDigits: false,
                requireLowercase: false,
                requireSymbols: false,
                requireUppercase: false,
            },
        });

        // Store a reference to the User Pool, so Lambdas at runtime (and any other infrastructure)
        // can resolve this reference and make actual calls to the User Pool (e.g. create users, check if a user exists)
        new StringParameter(userPool, `${env}-userPoolId-param`, {
            parameterName: `/${env}/cognito/userPoolId`,
            stringValue: userPool.userPoolId,
            description: `Allow Lambdas or other runtime code to import a reference to the UserPoolId by reading from this SSM parameter`,
        });

        new CfnOutput(this, `${env}-userPoolId-param`, {
            value: userPool.userPoolId,
            description: `Allow Lambdas or other runtime code to import a reference to the UserPoolId by reading from this SSM parameter`,
            exportName: `${env}-userPoolId-param`,
        });

        return userPool;
    }

    private createUserPoolClient(env: string): cognito.UserPoolClient {
        // A User Pool Client is required every time something else is interacting with the User Pool, on behalf
        // of the user. In this case, it's the Indigg REST APIs interacting with the User Pool on behalf of the user.
        // The user is, for example, providing his password to the Login API endpoint and that one is
        // asking the User Pool to validate those credentials and return JWT tokens
        const userPoolClient = new cognito.UserPoolClient(
            this,
            `${env}-UserPoolClient`,
            {
                userPool: this.userPool,
                authFlows: {
                    adminUserPassword: true,
                },

                // Identity token (used for all frontend to REST API calls) is valid for 1 day, which is a hard upper limit by Cognito
                idTokenValidity: Duration.hours(24),

                // Refresh token (used to periodically get new Identity Tokens) is valid for 30 days
                // This essentially means that user login sessions are valid for 30 days, after which the user needs to re-authenticate
                refreshTokenValidity: Duration.days(30),
            }
        );

        // Store a reference to the User Pool Client so that Lambdas can resolve it at runtime and interact
        // with the User Pool and the User Pool Client, programmatically
        new StringParameter(userPoolClient, `${env}-clientId-param`, {
            parameterName: `/${env}/cognito/client-id`,
            stringValue: userPoolClient.userPoolClientId,
            description: `Allow Lambdas or other runtime code to import a reference to the UserPoolClientId by reading from this SSM parameter`,
        });

        new CfnOutput(this, `${env}-clientId-param`, {
            value: userPoolClient.userPoolClientId,
            description: `Allow Lambdas or other runtime code to import a reference to the UserPoolClientId by reading from this SSM parameter`,
            exportName: `${env}-clientId-param`,
        });

        return userPoolClient;
    }

    private createUserPoolGoogleIdentityProvider(
        env: string,
        userpool: CognitoUserPool
    ): void {
        new cognito.UserPoolIdentityProviderGoogle(
            this,
            `${env}-Google-provider`,
            {
                clientId: `${env}-google-client-id`,
                clientSecret: `${env}-google-client-secret`,
                userPool: userpool,
                attributeMapping: {
                    email: cognito.ProviderAttribute.GOOGLE_EMAIL,
                },
            }
        );
    }
}
