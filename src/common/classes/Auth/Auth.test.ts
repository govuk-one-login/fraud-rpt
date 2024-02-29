import { expect, describe, it } from "@jest/globals";
import { Auth } from "./Auth";
import { mockClient } from "aws-sdk-client-mock";
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import { ErrorMessages } from "../../enums/ErrorMessages";

process.env.ENVIRONMENT = "development";

const mockSSMClient = mockClient(SSMClient);

const mockCognitoClient = mockClient(CognitoIdentityProviderClient);

beforeEach(() => {
  jest.resetAllMocks();

  mockSSMClient.reset();
  mockSSMClient.on(GetParametersCommand).resolves({
    Parameters: [
      {
        Name: "/undefined/ssf/SSFUserPoolClientId",
        Value: "mockUserPoolClientId",
      },
      { Name: "/undefined/ssf/SSFUserPoolId", Value: "mockUserPoolId" },
    ],
  });

  mockCognitoClient.reset();
  mockCognitoClient.on(DescribeUserPoolClientCommand).resolves({
    UserPoolClient: {
      ClientSecret: "mockClientSecret",
    },
  });
});

describe("Auth", () => {
  it("should be defined", async () => {
    expect(Auth).toBeDefined();
  });

  it("should initialise to some default auth params", async () => {
    const auth: Auth = new Auth();
    const schema = {
      authParams: {
        tokenBaseURL: `https://di-fraud-ssf-auth-${process.env.ENVIRONMENT}.auth.eu-west-2.amazoncognito.com`, //Auth token endpoint
        oauthIdentifier: "messages", //for this pretty much always 'messages' for now
        oauthScope: "write", //for this always 'write' for now
      },
      authToken: expect.any(String),
    };
    expect(auth).toMatchObject(schema);
  });
});

describe("getAllAuthValues", () => {
  it("Should run all the functions to fetch the needed secrets and paramaters", async () => {
    const auth: Auth = new Auth();
    jest.spyOn(auth, "getIds");
    jest.spyOn(auth, "getSecret");
    jest.spyOn(auth, "getAuthToken");
    const fetchResponseMock = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "ok",
        json: async () => ({
          access_token: "mockAuthToken",
        }),
      } as Response);
    jest.spyOn(global, "fetch").mockImplementation(fetchResponseMock);

    await auth.getAllAuthValues();

    expect(auth.getIds).toBeCalledTimes(1);
    expect(auth.getSecret).toBeCalledTimes(1);
    expect(auth.getAuthToken).toBeCalledTimes(1);

    expect(auth.authParams).toStrictEqual({
      tokenBaseURL:
        "https://di-fraud-ssf-auth-development.auth.eu-west-2.amazoncognito.com",
      oauthIdentifier: "messages",
      oauthScope: "write",
      userPoolClientId: "mockUserPoolClientId",
      userPoolId: "mockUserPoolId",
      userPoolSecret: "mockClientSecret",
    });

    expect(auth.authToken).toStrictEqual("mockAuthToken");
  });
});

describe("getIds", () => {
  it("should update the UserPool Ids", async () => {
    const auth: Auth = new Auth();
    expect(auth.authParams.userPoolId).toBeUndefined();
    expect(auth.authParams.userPoolClientId).toBeUndefined();

    await auth.getIds();
    expect(auth.authParams.userPoolId).toBe("mockUserPoolId");
    expect(auth.authParams.userPoolClientId).toBe("mockUserPoolClientId");
  });

  it.each([[{ Value: "mockUserPoolClientId" }], [{ Value: "mockUserPoolId" }]])(
    "should error if any UserPool Ids missing",
    async (returnParams) => {
      mockSSMClient.on(GetParametersCommand).resolvesOnce({
        Parameters: returnParams,
      });

      const auth: Auth = new Auth();

      await expect(() => auth.getIds()).rejects.toThrowError(
        ErrorMessages.SSM.NoSSMParameters,
      );
    },
  );
});

describe("getSecret", () => {
  it("should update the UserPool Ids", async () => {
    const auth: Auth = new Auth();
    expect(auth.authParams.userPoolSecret).toBeUndefined();

    await auth.getSecret();
    expect(auth.authParams.userPoolSecret).toBe("mockClientSecret");
  });

  it("should error if any UserPool Ids missing", async () => {
    mockCognitoClient
      .on(DescribeUserPoolClientCommand)
      .resolvesOnce({ UserPoolClient: {} });

    const auth: Auth = new Auth();

    await expect(() => auth.getSecret()).rejects.toThrowError(
      ErrorMessages.Auth.FailedSSMSecret,
    );
  });
});

describe("getAuthToken", () => {
  it("should update the Auth Token", async () => {
    const fetchResponseMock = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "ok",
        json: async () => ({
          access_token: "mockAuthToken",
        }),
      } as Response);
    jest.spyOn(global, "fetch").mockImplementation(fetchResponseMock);

    const auth: Auth = new Auth();
    expect(auth.authToken).toBe("Token Not Yet Requested");

    await auth.getAuthToken();
    expect(auth.authToken).toBe("mockAuthToken");
  });

  it("should update the Auth Token", async () => {
    const fetchResponseMock = () =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Mock Failed Response",
      } as Response);
    jest.spyOn(global, "fetch").mockImplementation(fetchResponseMock);

    const auth: Auth = new Auth();

    await expect(() => auth.getAuthToken()).rejects.toThrowError(
      ErrorMessages.Auth.GetAuthTokenFailed,
    );
  });
});
