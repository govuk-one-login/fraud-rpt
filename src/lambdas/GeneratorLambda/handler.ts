import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
  } from 'aws-lambda';

import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { FraudLogger, fraudTracer } from '@govuk-one-login/logging/logging';
import { ErrorMessages } from '../../common/enums/ErrorMessages';
import { Auth } from '../../common/classes/Auth/Auth';




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
    context: Context
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
      this.fraudLogger.logStartedProcessing();

      const environment: keyof typeof InboundPipelineURLs =
        process.env.ENVIRONMENT;

      this.fraudLogger.logDebug(`Environment set as: ${environment}`);

      const auth: Auth = new Auth();
      await auth.getAllAuthValues();
      this.fraudLogger.logDebug(
        `Obtained Auth values: ${JSON.stringify(auth)}`
      );