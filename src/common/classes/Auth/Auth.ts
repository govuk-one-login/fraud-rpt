import {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
  DescribeUserPoolClientCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { ErrorMessages } from "../../enums/ErrorMessages";
import { ParameterNames, ssmParams } from "../SSM/SSMParams";
import { TokenInfo } from "../../interfaces/interfaces";

type AuthParams = {
  tokenBaseURL: string; //Auth token endpoint
  oauthIdentifier: string; //for this pretty much always 'messages' for now
  oauthScope: string; //for this always 'write' for now
  userPoolClientId?: string;
  userPoolId?: string;
  userPoolSecret?: string;
};

export class Auth {
  authParams: AuthParams;
  authToken: string;

  constructor() {
    this.authParams = {
      tokenBaseURL: `https://di-fraud-ssf-auth-${process.env.ENVIRONMENT}.auth.eu-west-2.amazoncognito.com`,
      oauthIdentifier: "messages",
      oauthScope: "write",
    };
    this.authToken = "Token Not Yet Requested";
  }

  public async getAllAuthValues() {
    await this.getIds();
    await this.getSecret();
    await this.getAuthToken();
  }

  public async getIds() {
    const [userPoolClientId, userPoolId]: Array<string | undefined> =
      await ssmParams.getParams([
        ParameterNames.UserPoolClientID,
        ParameterNames.UserPoolID,
      ]);

    this.authParams.userPoolClientId = userPoolClientId;
    this.authParams.userPoolId = userPoolId;
  }

  public async getSecret() {
    const client: CognitoIdentityProviderClient =
      new CognitoIdentityProviderClient();
    const response: DescribeUserPoolClientCommandOutput = await client.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: this.authParams.userPoolId,
        ClientId: this.authParams.userPoolClientId,
      }),
    );

    if (!response.UserPoolClient?.ClientSecret)
      throw new Error(ErrorMessages.Auth.FailedSSMSecret);

    this.authParams.userPoolSecret = response.UserPoolClient.ClientSecret;
  }

  public async getAuthToken() {
    const base64Token: string = Buffer.from(
      `${this.authParams.userPoolClientId}:${this.authParams.userPoolSecret}`,
    ).toString("base64");

    const response: Response = await fetch(
      `${this.authParams.tokenBaseURL}/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64Token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          scope: `${this.authParams.oauthIdentifier}/${this.authParams.oauthScope}`,
        }),
      },
    );

    if (response.status !== 200) {
      throw new Error(ErrorMessages.Auth.GetAuthTokenFailed);
    }

    const tokenInfo: TokenInfo = await Promise.resolve(response.json()); //this needs to be two steps tp get access token
    this.authToken = tokenInfo.access_token; //return access token to be used when send message to API, dont need token type or expiry from response, known to be bearer and 3600
  }
}
