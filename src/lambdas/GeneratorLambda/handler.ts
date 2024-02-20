import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { FraudLogger, fraudTracer } from "@govuk-one-login/logging/logging";
import { ErrorMessages } from "../../common/enums/ErrorMessages";
import { InboundPipelineURLs } from "../../common/enums/InboundPipelineURLs";
import { Auth } from "../../common/classes/Auth/Auth";
import { ConfigParams } from "../../common/classes/ConfigParams/ConfigParams";

class GeneratorLambda implements LambdaInterface {
  statusCode: number | undefined;
  body: any;

  constructor(public fraudLogger: FraudLogger) {}

  get queueUrl(): string | undefined {
    return process.env.TRANSMITTER_QUEUE_URL;
  }

  /**
   *  Send Successfully Processed Event log
   *
   * @param event is the API Gateway event triggering the Lambda, will contain any configuration paramaters for the invocation
   * @param context is the AWS Lambda context
   */

  public async handler(
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> {
    try {
      this.fraudLogger.logDebug(`Received event: ${JSON.stringify(event)}`);
      this.fraudLogger.logDebug(`Received context: ${JSON.stringify(context)}`);

      // Ensure proper set up
      if (!this.queueUrl)
        throw new ReferenceError(ErrorMessages.Environment.NoQueueUrl);
      if (
        !process.env.ENVIRONMENT ||
        !this.environmentTypeGuard(process.env.ENVIRONMENT)
      ) {
        throw new ReferenceError(ErrorMessages.Environment.InvalidEnvironment);
      }

      // Start event processing
      // Fraudlogger function called to start processing
      this.fraudLogger.logStartedProcessing();

      // Constant of environment and subsequent variables made using InboundPipelineURLs enum
      // Set state of environment as "development, build or staging"
      const environment: keyof typeof InboundPipelineURLs =
        process.env.ENVIRONMENT;

      // Logs state of environment
      this.fraudLogger.logDebug(`Environment set as: ${environment}`);

      // Creates constant of type class Auth, = to new Auth instance
      // Calls .getAllAuthValues function to retrieve Id's, secrets & AuthToken & logs them
      const auth: Auth = new Auth();
      await auth.getAllAuthValues();
      this.fraudLogger.logDebug(
        `Obtained Auth values: ${JSON.stringify(auth)}`,
      );

      // Provides override for configuration paramters (for message generation)
      // override values provided through API event.body
      let configParams: ConfigParams = new ConfigParams(environment);
      const eventJson = event.body ? JSON.parse(event.body) : null;
      if (eventJson) {
        this.fraudLogger.logDebug("Event JSON exists, parsing API parameters");
        await configParams.parseAllApiParams(eventJson);
      }

        // Check the endpoint is active
        this.fraudLogger.logDebug('Checking endpoint health');
        await this.inboundEndpointHealthCheck(
          configParams.configParams.inboundEndpointURL,
          auth.authToken
        );

      // Report run success
      this.fraudLogger.logSuccessfullyProcessed(responseBody);
      this.statusCode = 202;
      this.body = `Generation run results: ${JSON.stringify(responseBody)}`;
    } catch (error: any) {
        this.fraudLogger.logDebug("Error Stack Trace: ${error.stack}");
        this.fraudLogger.logErrorProcessing("No Message ID", error);
        this.statusCode = 500;
        this.body = error.message;
      } finally {
        this.fraudLogger.metrics.publishStoredMetrics();
      }
  }


  /**
   *  Healthcheck for the supplied inbound ssf URL,
   *
   * @param url
   * @param bodyData
   */
  public async inboundEndpointHealthCheck(
    endpointURL: string,
    authToken: string
  ): Promise<void> {
    try {
      const response: Response = await fetch(endpointURL, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        body: 'healthcheck',
      });
      if (!response.ok) {
        throw new Error(
          `Non-succesful response for ${endpointURL}. Response: ${response.status}, ${response.statusText}`
        );
      }
    } catch (error: any) {
      throw new Error(`Healthcheck for ${endpointURL} failed: ${error}`);
    }
  }
}