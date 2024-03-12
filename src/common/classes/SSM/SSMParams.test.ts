import { expect, describe, it } from "@jest/globals";
import { ErrorMessages } from "../../enums/ErrorMessages";

import { mockClient } from "aws-sdk-client-mock";

import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import { ParameterNames, SSMParams, ssmParams } from "../SSM/SSMParams";

process.env.ENVIRONMENT = "development";

const mockSSMClient = mockClient(SSMClient);

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
});

describe("SSMParams", () => {
  it("should be defined", async () => {
    expect(SSMParams).toBeDefined();
  });

  it("should get parameters with the SSM client", async () => {
    const client: SSMClient = new SSMClient();

    const [userPoolClientId, userPoolId] = await ssmParams.getParams([
      ParameterNames.UserPoolClientID,
      ParameterNames.UserPoolID,
    ]);
    expect(userPoolClientId).toBe("mockUserPoolClientId");
    expect(userPoolId).toBe("mockUserPoolId");
  });

  it.each([[{ Value: "mockUserPoolClientId" }], [{ Value: "mockUserPoolId" }]])(
    "should throw if the wrong number of parameters are returned",
    async (returnParams) => {
      mockSSMClient.on(GetParametersCommand).resolvesOnce({
        Parameters: returnParams,
      });

      const client: SSMClient = new SSMClient();
      const ssmParams: SSMParams = new SSMParams(client);

      await expect(() =>
        ssmParams.getParams([
          ParameterNames.UserPoolClientID,
          ParameterNames.UserPoolID,
        ]),
      ).rejects.toThrowError(ErrorMessages.SSM.NoSSMParameters);
    },
  );
});
