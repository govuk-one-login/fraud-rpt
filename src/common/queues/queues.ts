import {
    SQSClient,
    SendMessageCommand,
    SendMessageBatchCommand,
    SendMessageCommandOutput,
    SendMessageBatchCommandOutput,
    SendMessageBatchRequestEntry,
  } from '@aws-sdk/client-sqs';
  import { fraudTracer } from '@govuk-one-login/logging/logging';
  import { ErrorMessages } from '../enums/ErrorMessages';
  
  const sqsClient: SQSClient = fraudTracer.captureAWSv3Client(
    new SQSClient({
      region: process.env.AWS_REGION,
    })
  );
  
  export const sqsBatchMessageMaxCount: number = 10;
  
  /**
   * Send Message to SQS Queue
   *
   * @param message is the message to be sent
   * @param queueUrl is the URL of the SQS queue
   */
  export const sendSqsMessage = async (
    message: string,
    queueUrl: string | undefined
  ): Promise<SendMessageCommandOutput> => {
    return await sqsClient.send(
      new SendMessageCommand({
        MessageBody: message,
        QueueUrl: queueUrl,
      })
    );
  };
  
  /**
   * Sends a Batch Message to SQS Queue
   *
   * @param messages is the array of up to 10 messages
   * @param queueUrl is the URL of the SQS queue
   */
  export const sendBatchSqsMessage = async (
    messages: string[],
    queueUrl: string | undefined
  ): Promise<SendMessageBatchCommandOutput> => {
    //Ensure a valid number of messages
    if (messages.length < 1) {
      throw new Error(ErrorMessages.SQS.NoMessages);
    }
    if (messages.length > sqsBatchMessageMaxCount) {
      throw new Error(ErrorMessages.SQS.TooManyMessages);
    }
  
    // Format messages correctly, assign each an ID within the batch - NOT the message ID that is generated when each is sent
    const entries: SendMessageBatchRequestEntry[] = messages.map(
      (message, index) => ({
        Id: `Batch_Entry_${index}`,
        MessageBody: message,
      })
    );
  
    // Make the send request and return the result
    return await sqsClient.send(
      new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      })
    );
  };
