import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import {
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
    DeleteItemCommand,
    AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { Client, auth } from 'twitter-api-sdk';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from '@modules/database/database.service';
import {
    SocialInfoDto,
    DeleteSocialDto,
    AddSocialInfoDto,
    CheckSocialDto,
} from './linkSocials.dtos';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { DynamoDB } from 'aws-sdk';

const url = require('url');

@Injectable()
export class LinkSocialsService {
    constructor(
        private readonly DatabaseService: DatabaseService,
        private readonly HttpService: HttpService
    ) {}

    private checkIfItemExistOrGetItem = async (
        userId: string,
        tableName: string,
        use: string
    ) => {
        const items: DynamoDB.AttributeMap[] = [];
        let lastEvaluatedKey: DynamoDB.Key | any;
        do {
            const scanTable = new ScanCommand({
                TableName: tableName,
                FilterExpression: 'userId = :userId',
                ExpressionAttributeValues: marshall({ ':userId':  userId }),
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const result = await this.DatabaseService.client.send(scanTable);

            items.push(...result.Items);
            lastEvaluatedKey = result.LastEvaluatedKey;

        } while (lastEvaluatedKey);

        if (items.length > 0) {
            if (use === 'getItem') {
                const data = items
            .map((item) => unmarshall(item as Record<string, AttributeValue>)) [0];
                return data;
            } else if (use === 'check') {
                return true;
            }
        }
    };

    private oauthInfo = async (
        providerName: string
    ): Promise<SocialInfoDto> => {
        const scanTableData = new GetItemCommand({
            TableName: `${process.env.NODE_ENV}-Social-OAuth`,
            Key: { provider: { S: providerName } },
        });
        const dataInfo = await this.DatabaseService.client.send(scanTableData);

        if (dataInfo) {
            const responseItem = {
                server_url: dataInfo.Item.server_url.S,
                client_id: dataInfo.Item.client_id.S,
                scopes: dataInfo.Item.scopes.S,
                provider: dataInfo.Item.provider.S,
                client_secret: dataInfo.Item.client_secret.S,
                provider_url: dataInfo.Item.provider_url.S,
            };
            return responseItem;
        }
    };

    private discordGetTokens = async (discordTableData: any, code: string) => {
        let body = {
            client_id: discordTableData.client_id,
            client_secret: discordTableData.client_secret,
            grant_type: 'authorization_code',
            code: code.toString(),
            redirect_uri: discordTableData.server_url,
        };

        const formData = new url.URLSearchParams(body);

        const response = await this.HttpService.axiosRef.post(
            'https://discord.com/api/v9/oauth2/token',
            formData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept-Encoding': '*',
                },
            }
        );

        return response.data;
    };

    private twitterUserAccess = async (
        code: string,
        userId: string,
        twitterTableData: any
    ) => {
        const authClient = new auth.OAuth2User({
            client_id: twitterTableData.client_id as string,
            client_secret: twitterTableData.client_secret as string,
            callback: twitterTableData.server_url as string,
            scopes: ['tweet.read', 'users.read', 'offline.access'],
        });
        const client = new Client(authClient);
        // !!!Even if we dont use this, we need that instance for requestAccessToken to work
        const authUrl = authClient.generateAuthURL({
            state: userId,
            code_challenge_method: 'plain',
            code_challenge: userId,
        });
        const userAccess: any = await authClient.requestAccessToken(
            code as string
        );
        return { userAccess: userAccess, client: client };
    };

    private discordGetPersonalInfo = async (responseTokens: string) => {
        let responseUserInfo = await this.HttpService.axiosRef.get(
            'https://discord.com/api/v8/users/@me' || '',
            {
                headers: {
                    Authorization: `Bearer ${responseTokens}`,
                    'Accept-Encoding': '*',
                },
            }
        );

        return responseUserInfo.data;
    };

    private discordWriteToDB = async (
        discordTokens: any,
        discordGetPersonalInfo: any,
        userId: string
    ) => {
        let currentDate = new Date();
        let expires_at = new Date(
            currentDate.getTime() + discordTokens.expires_in
        );
        const putItemCommandDiscord = new PutItemCommand({
            TableName: `${process.env.NODE_ENV}-Connect-Discord`,

            Item: marshall({
                id: `${Date.now().toString()}${Math.floor(
                    Math.random() * 10000 + 1000
                ).toString()}`,
                userId: userId,
                social_id: discordGetPersonalInfo.id,
                social_username: discordGetPersonalInfo.username,
                access_token: discordTokens.access_token,
                refress_token: discordTokens.refresh_token,
                scope: discordTokens.scope,
                expires_at: String(expires_at.toString()),
            }),
        });
        const db = await this.DatabaseService.client.send(
            putItemCommandDiscord
        );
        return db;
    };

    private twitterWriteToDB = async (dataAccess: any, userId: string) => {
        const userInfo: any = await dataAccess.client.users.findMyUser();
        let currentDate = new Date();
        let expires_at = new Date(
            currentDate.getTime() + dataAccess.userAccess.token.expires_at
        );
        const putItemCommandTwitter = new PutItemCommand({
            TableName: `${process.env.NODE_ENV}-Connect-Twitter`,
            Item: marshall({
                id: `${Date.now().toString()}${Math.floor(
                    Math.random() * 10000 + 1000
                ).toString()}`,
                userId: userId,
                social_id: userInfo.data.id,
                social_username: userInfo.data.username,
                access_token: dataAccess.userAccess.token.access_token,
                refress_token: dataAccess.userAccess.token.refresh_token,
                scope: dataAccess.userAccess.token.scope,
                expires_at: String(expires_at.toString()),
            }),
        });
        const db = await this.DatabaseService.client.send(
            putItemCommandTwitter
        );
        return db;
    };

    private deleteSocial = async (
        userId: string,
        tableName: string
    ): Promise<DeleteSocialDto> => {
        const itemFound: any = await this.checkIfItemExistOrGetItem(
            userId,
            tableName,
            'getItem'
        );
        if (itemFound) {
            try {
                const deleteCommandCheckTableData = new DeleteItemCommand({
                    TableName: tableName,
                    Key: {
                        id: { S: itemFound.id.S },
                        userId: { S: itemFound.userId.S },
                    },
                });
                const result = await this.DatabaseService.client.send(
                    deleteCommandCheckTableData
                );
                if (!result) {
                    return { response: `Delete Operation Failed` };
                }
                return { response: `Deleted` };
            } catch (error) {
                return { response: `Delete Operation Failed` };
            }
        } else {
            return { response: `Delete Operation Failed` };
        }
    };

    async getDiscordInfo(): Promise<SocialInfoDto> {
        return this.oauthInfo('DISCORD');
    }

    async connectDiscord(code: string, userId: string, error: string) {
        if (error) {
            return `?message=error`;
        } else {
            try {
                if (!code || !userId) {
                    return `?message=error`;
                }
                const isExist: Record<string, AttributeValue> | true =
                    await this.checkIfItemExistOrGetItem(
                        userId,
                        `${process.env.NODE_ENV}-Connect-Discord`,
                        'check'
                    );
                if (!isExist) {
                    const discordTableData = await this.oauthInfo('DISCORD');
                    if (discordTableData) {
                        const discordTokens = await this.discordGetTokens(
                            discordTableData,
                            code
                        );
                        if (discordTokens) {
                            const discordGetPersonalInfo =
                                await this.discordGetPersonalInfo(
                                    discordTokens.access_token
                                );
                            if (discordGetPersonalInfo) {
                                const writeDB = await this.discordWriteToDB(
                                    discordTokens,
                                    discordGetPersonalInfo,
                                    userId
                                );
                                if (writeDB) {
                                    return `?message=success`;
                                }
                            } else {
                                return `?message=error`;
                            }
                        } else {
                            return `?message=error`;
                        }
                    }
                } else {
                    return `?message=error`;
                }
            } catch (err) {
                return `?message=error`;
            }
        }
    }

    async deleteDiscord(userId: string): Promise<DeleteSocialDto> {
        return this.deleteSocial(
            userId,
            `${process.env.NODE_ENV}-Connect-Discord`
        );
    }

    async getTwitterInfo(): Promise<SocialInfoDto> {
        return this.oauthInfo('TWITTER');
    }

    async connectTwitter(code: string, userId: string, error: string) {
        if (error) {
            return `?message=error`;
        } else {
            try {
                if (!code || !userId) {
                    return `?message=error`;
                }
                const isExist: Record<string, AttributeValue> | true =
                    await this.checkIfItemExistOrGetItem(
                        userId,
                        `${process.env.NODE_ENV}-Connect-Twitter`,
                        'check'
                    );
                if (!isExist) {
                    const twitterTableData = await this.oauthInfo('TWITTER');
                    if (twitterTableData) {
                        const dataAccess = await this.twitterUserAccess(
                            code,
                            userId,
                            twitterTableData
                        );
                        if (dataAccess.userAccess) {
                            const db = await this.twitterWriteToDB(
                                dataAccess,
                                userId
                            );
                            if (db) {
                                return `?message=success`;
                            }
                        }
                    }
                } else {
                    return `?message=error`;
                }
            } catch (err) {
                return `?message=error`;
            }
        }
    }

    async deleteTwitter(userId: string): Promise<DeleteSocialDto> {
        return this.deleteSocial(
            userId,
            `${process.env.NODE_ENV}-Connect-Twitter`
        );
    }

    async twitterurl(userId: string) {
        const twitterTableData = await this.oauthInfo('TWITTER');

        if (twitterTableData) {
            const authClient = new auth.OAuth2User({
                client_id: twitterTableData.client_id as string,
                client_secret: twitterTableData.client_secret as string,
                callback: twitterTableData.server_url as string,
                scopes: ['tweet.read', 'users.read', 'offline.access'],
            });

            const quest_user_id = userId;
            const authUrl = authClient.generateAuthURL({
                state: quest_user_id,
                code_challenge_method: 'plain',
                code_challenge: quest_user_id || '',
            });
            return { redirectUrl: `${authUrl}` };
        }
    }

    async addoauthinfo(payload: AddSocialInfoDto) {
        const putItemData = new PutItemCommand({
            TableName: `${process.env.NODE_ENV}-Social-OAuth`,
            Item: marshall({
                provider: payload.provider,
                client_id: payload.client_id,
                client_secret: payload.client_secret,
                provider_url: payload.provider_url,
                scopes: payload.scopes,
                server_url: payload.server_url,
            }),
        });
        const db = await this.DatabaseService.client.send(putItemData);
        if (db) {
            return 'success';
        } else {
            return 'error';
        }
    }

    async socialcheck(userId: string, social: string) {
        if (social == 'twitter') {
            const itemFound: any = await this.checkIfItemExistOrGetItem(
                userId,
                `${process.env.NODE_ENV}-Connect-Twitter`,
                'getItem'
            );
            return unmarshall(itemFound);
        } else if (social == 'discord') {
            const itemFound: any = await this.checkIfItemExistOrGetItem(
                userId,
                `${process.env.NODE_ENV}-Connect-Discord`,
                'getItem'
            );
            return unmarshall(itemFound);
        } else {
            return { error: 'Wrong Social Provider' };
        }
    }
}
