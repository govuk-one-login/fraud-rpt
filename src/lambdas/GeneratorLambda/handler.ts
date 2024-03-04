import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { MockSET } from "../../common/classes/MockSET/MockSET";
import {
  sendBatchSqsMessage,
  sqsBatchMessageMaxCount,
} from "../../common/queues/queues";
import { SendMessageBatchCommandOutput } from "@aws-sdk/client-sqs";
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Metrics } from "@aws-lambda-powertools/metrics";
// import { FraudLogger, fraudTracer } from "@govuk-one-login/logging/logging";
import { Logger } from "@aws-lambda-powertools/logger";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import { ErrorMessages } from "../../common/enums/ErrorMessages";
import { InboundPipelineURLs } from "../../common/enums/InboundPipelineURLs";
import { LogEvents } from "../../common/enums/Log-events";
import { ConfigParams } from "../../common/classes/ConfigParams/ConfigParams";
import { GeneratorResponseBody } from "../../common/interfaces/interfaces";
import { Auth } from "../../common/classes/Auth/Auth";
import { stringTypeGuard } from "../../common/typeGuards/typeguards";
// import middy from "@middy/core";

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

        // Check the endpoint is active
        this.fraudLogger.logDebug("Checking endpoint health");
        await this.inboundEndpointHealthCheck(
          configParams.configParams.inboundEndpointURL,
          auth.authToken,
        );
      }
      // Generate and send the SETs
      this.fraudLogger.logDebug("Generating and sending SETs");
      const responseBody: GeneratorResponseBody =
        await this.generateAndSendSETs(configParams);

      // Report run success
      this.fraudLogger.logSuccessfullyProcessed(responseBody);
      this.statusCode = 202;
      this.body = `Generation run results: ${JSON.stringify(responseBody)}`;
    } catch (error: any) {
      this.fraudLogger.logDebug(`Error Stack Trace: ${error.stack}`);
      this.fraudLogger.logErrorProcessing("No Message ID", error);
      this.statusCode = 500;
      this.body = error.message;
    } finally {
      this.fraudLogger.metrics.publishStoredMetrics();
    }

    return {
      statusCode: this.statusCode,
      body: this.body,
    };
  }

  /**
   *  Send Successfully Processed Event log
   *
   * @param configParams are the stored config params for the SET messages generation run
   * @returns The response to return via the API
   */

  public async generateAndSendSETs(configParams: ConfigParams) {
    // Generate and send SETs in batches of 10.
    this.fraudLogger.logDebug(
      `generateAndSendSETs - config: ${JSON.stringify(
        configParams.configParams,
      )}`,
    );

    let totalFailedMessageAttempts: number = 0;
    let totalSuccessfulMessageAttempts: number = 0;

    let numFailedMessageAttempts: number;
    let remainingMessages: number = configParams.configParams.numMessages;
    let numGenerationAttempts: number = 0;

    // If there are failed messages, retry up to 5 times
    const maxRetries: number = 5;
    for (let i = 0; i < maxRetries; i++) {
      let setArray: string[] = [];
      numFailedMessageAttempts = 0;

      // Generate and Send Remaining Messages
      for (let j = 0; j < remainingMessages; j++) {
        this.fraudLogger.logDebug(
          `Generating and sending ${remainingMessages} remaining messages`,
        );
        this.fraudLogger.logDebug(
          `Processing message ${j + 1} of ${remainingMessages}.`,
        );

        // new instance of MockSET created
        let mockSET: MockSET = new MockSET();
        //Using parsed configParams to set RPofOrigin, adjustEvent & addError
        await Promise.allSettled([
          mockSET.adjustRpOfOrigin(configParams.configParams.rpSplit),
          mockSET.fillStaticFields(),
        ]);
        await mockSET.adjustEvent(configParams.configParams.eventTypeSplit);
        await mockSET.addError(configParams.configParams.errorRate);
        setArray.push(
          //Adds JSON-formatted SET to SET array (for sending to SQS queue)
          JSON.stringify({
            SET: mockSET.mockSET,
            destination: configParams.configParams.inboundEndpointURL,
          }),
        );

        this.fraudLogger.logDebug(
          `Generated mock SET: ${JSON.stringify(mockSET.mockSET)}`,
        );

        // Max 10 SET's in SQS Message Queue, trigger event at maximum SET count
        if (setArray.length === sqsBatchMessageMaxCount) {
          const [requestSuccessfulMessages, requestFailedMessages]: number[] =
            await this.handleSendRequest(setArray);
          totalSuccessfulMessageAttempts += requestSuccessfulMessages;
          numFailedMessageAttempts += requestFailedMessages;
          setArray = [];
          this.fraudLogger.logDebug(
            `Batch send attempt: Successes - ${requestSuccessfulMessages}, Failures - ${requestFailedMessages}`,
          );
        }
      }

      // Send any remaining messages/records to EndPoint, repetition of above functionality
      if (setArray.length > 0) {
        const [requestSuccessfulMessages, requestFailedMessages]: number[] =
          await this.handleSendRequest(setArray);
        totalSuccessfulMessageAttempts += requestSuccessfulMessages;
        numFailedMessageAttempts += requestFailedMessages;

        this.fraudLogger.logDebug(
          `Batch send attempt: Successes - ${requestSuccessfulMessages}, Failures - ${requestFailedMessages}`,
        );
      }

      // Handle Failures
      remainingMessages = numFailedMessageAttempts;
      numGenerationAttempts = i + 1;
      if (remainingMessages === 0) {
        this.fraudLogger.logDebug(
          "All messages sent successfully. No more retries needed.",
        );
        break;
      }

      totalFailedMessageAttempts += numFailedMessageAttempts;
    }

    // Log full execution and run success
    const responseBody: GeneratorResponseBody = {
      messagesSent: totalSuccessfulMessageAttempts,
      sendAttempts: numGenerationAttempts,
      unsentMessages: remainingMessages,
      totalFailedMessageAttempts: totalFailedMessageAttempts,
      configParams: configParams.configParams,
    };

    this.fraudLogger.logDebug(`Final results: ${JSON.stringify(responseBody)}`);
    return responseBody;
  }

  /**
   *  Healthcheck for the supplied inbound Shared Signals Framework URL,
   *
   * @param url
   * @param bodyData
   */

  public async inboundEndpointHealthCheck(
    endpointURL: string,
    authToken: string,
  ): Promise<void> {
    // Performs an Inbound Endpoint Health-check POST Request to ensure Endpoint can receive signals (JWS messages in our case)
    try {
      const response: Response = await fetch(endpointURL, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: "POST",
        body: "healthcheck",
      });
      if (!response.ok) {
        throw new Error(
          `Non-succesful response for ${endpointURL}. Response: ${response.status}, ${response.statusText}`,
        );
      }
    } catch (error: any) {
      throw new Error(`Healthcheck for ${endpointURL} failed: ${error}`);
    }
  }

  public environmentTypeGuard(
    environment: string,
  ): environment is keyof typeof InboundPipelineURLs {
    return Object.keys(InboundPipelineURLs).includes(environment);
  }

  /* Send batch of up to 10 SQS messages and log success of sending messages
   *
   * @param setArray is an array of strings with up to 10 entries
   * @returns number of successful and failed messages
   */
  public async handleSendRequest(
    setArray: string[],
  ): Promise<[number, number]> {
    // Invoke the send request
    this.fraudLogger.logDebug(
      `handleSendRequest - Sending a batch of ${setArray.length} SQS messages.`,
    );

    setArray.forEach((set) => {
      this.fraudLogger.logDebug(`Sending SET: ${set}`);
    });

    // Uses AWS & queue functionality to send batch of SET's to SQS queue for transmitter lambda
    const messageResponses: SendMessageBatchCommandOutput =
      await sendBatchSqsMessage(setArray, this.queueUrl);

    this.fraudLogger.logSETBatchGeneration(
      await this.getSuccessDegree(messageResponses),
    );

    // Count successful and failed messages
    const numFailedMessages: number = messageResponses.Failed?.length ?? 0;
    const numSuccessfulMessages: number =
      messageResponses.Successful?.length ?? 0;

    this.fraudLogger.logDebug(
      `handleSendRequest - Successful messages: ${numSuccessfulMessages}`,
    );
    this.fraudLogger.logDebug(
      `handleSendRequest - Failed messages: ${numFailedMessages}`,
    );

    // Check for errors
    if (!messageResponses.Successful && !messageResponses.Failed) {
      throw new Error(ErrorMessages.SQS.InvalidSQSResponse);
    }
    if (numSuccessfulMessages + numFailedMessages !== setArray.length) {
      throw new Error(ErrorMessages.SQS.LostMessage);
    }
    return [numSuccessfulMessages, numFailedMessages];
  }

  /**
   * Send batch of up to 10 SQS messages and log successful
   *
   * @param setArray is an array of strings with up to 10 entries
   * @returns a tuple with the log event and message ids for the logger call
   */
  public async getSuccessDegree(
    messageResponses: SendMessageBatchCommandOutput,
  ): Promise<[LogEvents, string[], string[]]> {
    // get Ids into seperate arrays
    const successfulMessageIds: string[] =
      messageResponses.Successful?.map((response) => response.MessageId).filter(
        stringTypeGuard,
      ) ?? [];

    const failedBatchIds: string[] =
      messageResponses.Failed?.map((response) => response.Id).filter(
        stringTypeGuard,
      ) ?? [];

    this.fraudLogger.logDebug(
      `getSuccessDegree - Processed successful messages: ${successfulMessageIds.length}`,
    );
    this.fraudLogger.logDebug(
      `getSuccessDegree - Processed failed messages: ${failedBatchIds.length}`,
    );

    // default to all successful
    let logEvent: LogEvents = LogEvents.FullSETBatchGenerated;

    // check for failed messages
    if (messageResponses.Successful && messageResponses.Failed) {
      // partial success
      logEvent = LogEvents.PartialSETBatchGenerated;
    } else if (!messageResponses.Successful && messageResponses.Failed) {
      // complete failure
      logEvent = LogEvents.FailedSETBatchGenerated;
    }
    return [logEvent, successfulMessageIds, failedBatchIds];
  }

  /**
   *  Healthcheck for the supplied inbound ssf URL,
   *
   * @param url
   * @param bodyData
   */
  public async inboundEndpointHealthCheck(
    endpointURL: string,
    authToken: string,
  ): Promise<void> {
    try {
      const response: Response = await fetch(endpointURL, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: "POST",
        body: "healthcheck",
      });
      if (!response.ok) {
        throw new Error(
          `Non-succesful response for ${endpointURL}. Response: ${response.status}, ${response.statusText}`,
        );
      }
    } catch (error: any) {
      throw new Error(`Healthcheck for ${endpointURL} failed: ${error}`);
    }
  }
}

export const generatorLambda: GeneratorLambda = new GeneratorLambda(
  new FraudLogger(
    new Logger(),
    new Metrics({
      serviceName: process.env.LAMBDA_NAME,
      namespace: process.env.POWERTOOLS_METRICS_NAMESPACE,
    }),
    process.env.ENVIRONMENT as string,
  ),
);

export const handler = middy(generatorLambda.handler.bind(generatorLambda)).use(
  captureLambdaHandler(fraudTracer),
);
