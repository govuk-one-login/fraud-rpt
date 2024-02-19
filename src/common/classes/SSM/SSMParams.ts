import {
  GetParametersCommand,
  GetParametersCommandInput,
  GetParametersCommandOutput,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { ErrorMessages } from "../../enums/ErrorMessages";
import { stringTypeGuard } from "../../typeGuards/typeguards";

export class SSMParams {
  constructor(public ssmClient: SSMClient) {}

  /**
   * Get params from SSM
   *
   * @param paramNames
   * @returns
   */
  async getParams(paramNames: ParameterNames[]): Promise<string[]> {
    const requestParams: GetParametersCommandInput = {
      Names: [
        ...paramNames.map((name: ParameterNames) => ParameterRoutes[name]),
      ],
    };

    const response: GetParametersCommandOutput = await this.ssmClient.send(
      new GetParametersCommand(requestParams),
    );
    if (
      !response?.Parameters ||
      response.Parameters.length !== paramNames.length
    )
      throw new Error(ErrorMessages.SSM.NoSSMParameters);

    return paramNames
      .map(
        (paramName: ParameterNames) =>
          response.Parameters?.find(
            (responseParam) =>
              responseParam.Name === ParameterRoutes[paramName],
          )?.Value,
      )
      .filter(stringTypeGuard);
  }
}

export enum ParameterNames {
  UserPoolClientID = "userPoolClientId",
  UserPoolID = "userPoolId",
  PublicKeyArn = "publicKeyArn",
}

export const ParameterRoutes: Record<ParameterNames, string> = {
  [ParameterNames.UserPoolClientID]: `/${process.env.ENVIRONMENT}/ssf/SSFUserPoolClientId`,
  [ParameterNames.UserPoolID]: `/${process.env.ENVIRONMENT}/ssf/SSFUserPoolId`,
  [ParameterNames.PublicKeyArn]: `/${process.env.ENVIRONMENT}/PublicKeyArn`,
};

export const ssmParams: SSMParams = new SSMParams(new SSMClient());
