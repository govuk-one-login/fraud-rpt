import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { FraudLogger, fraudTracer } from "@govuk-one-login/logging/logging";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { ErrorMessages } from "../../common/enums/ErrorMessages";
import { JWS } from "../../common/classes/JWT/jwt";
import {
  JWSComponents,
  BatchItemFailuresJson,
  FailedMessageJson,
  SQSRecievedRecordBody,
} from "../../common/interfaces/interfaces";
import { Auth } from "../../common/classes/Auth/Auth";
import middy from "@middy/core";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer";

class TransmitterLambda implements LambdaInterface {
  constructor(public fraudLogger: FraudLogger) {}
  /**
   *  Triggered from Transmitter SQS Queue. SMakes a post request to the specified endpoint
   *
   * @param event is the SQS event triggering the Lambda, will have up to 10 SETs/Messages/Records
   * @param context is the AWS Lambda context
   */
  public async handler(
    event: SQSEvent,
    context: Context,
  ): Promise<BatchItemFailuresJson> {
    let failedMessageIds: BatchItemFailuresJson = {};
    try {
      // Check event validity, ensure that records are existent
      if (!event.Records || event.Records.length === 0)
        throw new ReferenceError(ErrorMessages.Records.NoRecords);

      // Go through each of the (up to 10) records/messages in the SQS event.
      failedMessageIds = await this.handlePostRequests(event.Records);
    } catch (error: any) {
      this.fraudLogger.logErrorProcessing("No Message ID", error);
    } finally {
      this.fraudLogger.metrics.publishStoredMetrics();
    }
    return failedMessageIds;
  }

  /**
   *  Function to make the post request to the inbound SSF endpoint.
   *
   * @param url is the endpoint URL the POST request will be sent to
   * @param bodyData is the data to be put in the POST request body
   *
   * @returns the fetch request response
   */
  public async handlePostRequests(
    records: SQSRecord[],
  ): Promise<BatchItemFailuresJson> {
    this.fraudLogger.logDebug(
      `handlePostRequests - Starting to process ${records.length} records.`,
    );

    const auth: Auth = new Auth();
    await auth.getAllAuthValues();

    this.fraudLogger.logDebug(
      `auth.getAllAuthValues - Successfully retrieved auth values `,
    );

    let failedMessages: FailedMessageJson[] = [];
    let currentMessageId: string;
    await Promise.all(
      records.map(async (record) => {
        // Log start processing
        try {
          currentMessageId = record.messageId;
          this.fraudLogger.logStartedProcessing(currentMessageId);
          //Parse record body and ensure needed fields transmitted
          const recordBody: SQSRecievedRecordBody = JSON.parse(record.body);

          if (!recordBody?.SET || !recordBody?.destination) {
            throw new Error(ErrorMessages.SQS.MissingFieldInMessage);
          }

          this.fraudLogger.logDebug(
            `handlePostRequests - Parsed SET and destination for messageId: ${currentMessageId}`,
          );

          // Make post request
          await this.makePostRequest(
            recordBody.destination,
            recordBody.SET,
            auth.authToken,
            currentMessageId,
          );
          this.fraudLogger.logSuccessfullyProcessed(record?.messageId);
        } catch (error: any) {
          failedMessages.push({ itemIdentifier: currentMessageId });
          this.fraudLogger.logErrorProcessing(currentMessageId, error);
        }
      }),
    );
    return { batchItemFailures: failedMessages };
  }

  /**
   *  Function to make the post request to the inbound SSF endpoint.
   *
   * @param url is the endpoint URL the POST request will be sent to
   * @param bodyData is the data to be put in the POST request body
   *
   * @returns the fetch request response
   */
  public async makePostRequest(
    url: string,
    bodyData: any,
    authToken: string,
    messageId: string,
  ): Promise<any> {
    // Create JWS
    this.fraudLogger.logDebug(
      `makePostRequest - Starting to make post request for messageId: ${messageId} to URL: ${url}`,
    );

    const jws: JWSComponents = await JWS.build(bodyData);
    const jwsContent: string = await JWS.toString(jws);
    this.fraudLogger.logJWSSignSuccess(jwsContent, messageId);

    // Make Request

    this.fraudLogger.logDebug(
      `makePostRequest - Making the POST request with JWE content for messageId: ${messageId}`,
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      method: "POST",
      body: jwsContent,
    });

    if (!response.ok) {
      throw new Error(
        `There was an error making the post request: ${response.status} ${response.statusText}`,
      );
    } else {
      this.fraudLogger.logDebug(
        `makePostRequest - Successfully received response for messageId: ${messageId}`,
      );
    }

    return await response.json();
  }
}

export const transmitterLambda: TransmitterLambda = new TransmitterLambda(
  new FraudLogger(
    new Logger(),
    new Metrics({
      serviceName: process.env.LAMBDA_NAME,
      namespace: process.env.POWERTOOLS_METRICS_NAMESPACE,
    }),
    process.env.ENVIRONMENT,
  ),
);

export const handler = middy(
  transmitterLambda.handler.bind(transmitterLambda),
).use(captureLambdaHandler(fraudTracer));
