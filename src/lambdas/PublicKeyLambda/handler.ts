import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { FraudLogger, fraudTracer } from "@govuk-one-login/logging/logging";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { LambdaInterface } from "@aws-lambda-powertools/commons/lib/utils/lambda";
import { LogEvents } from "../../common/enums/Log-events";
import { KeyManager } from "../../common/classes/keys/keys";
import { KeyObject } from "crypto";
import { PublicKeyLambdaResponse } from "../../common/interfaces/interfaces";
import { ParameterNames, ssmParams } from "../../common/classes/SSM/SSMParams";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import middy from "@middy/core";

class PublicKeyLambda implements LambdaInterface {
  constructor(public fraudLogger: FraudLogger) {}

  /**
   *  Triggered from APIGateway request. Retrieves public key from KMS and returns to calling client
   *
   * @param event
   * @param context
   */
  public async handler(
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    try {
      this.fraudLogger.logMessage(LogEvents.PublicKeyRequested);
      const [publicKeyArn]: string[] = await ssmParams.getParams([
        ParameterNames.PublicKeyArn,
      ]);
      const publicKey: KeyObject = await KeyManager.getPublicKeyFromKMS(
        publicKeyArn,
      );
      const publicKeyData: string | Buffer = publicKey.export({
        type: "spki",
        format: "pem",
      });
      const publicKeyString: string = publicKeyData.toString("base64");
      const response: PublicKeyLambdaResponse = {
        statusCode: 200,
        body: publicKeyString,
      };

      this.fraudLogger.logMessage(LogEvents.PublicKeyReturned);
      return response;
    } catch (error: any) {
      this.fraudLogger.logErrorProcessing(error);
      const errorResponse: PublicKeyLambdaResponse = {
        statusCode: 500,
        body: LogEvents.PublicKeyRequestFail,
      };
      return errorResponse;
    }
  }
}

export const publicKeyLambda: PublicKeyLambda = new PublicKeyLambda(
  new FraudLogger(
    new Logger(),
    new Metrics({
      serviceName: process.env.LAMBDA_NAME,
      namespace: process.env.POWERTOOLS_METRICS_NAMESPACE,
    }),
    process.env.ENVIRONMENT,
  ),
);

export const handler = middy(publicKeyLambda.handler.bind(publicKeyLambda)).use(
  captureLambdaHandler(fraudTracer),
);
