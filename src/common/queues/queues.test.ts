import { expect, describe, it } from "@jest/globals";
import { sendSqsMessage, sendBatchSqsMessage } from "./queues";
import { mockClient } from "aws-sdk-client-mock";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { ErrorMessages } from "../enums/ErrorMessages";

const sqsMock = mockClient(SQSClient);

beforeEach(() => {
  sqsMock.reset();
});

describe("sendSqsMessage", () => {
  it("should be defined", async () => {
    expect(sendSqsMessage).toBeDefined();
  });

  it("should call SQS send", async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "12345" });
    jest.spyOn(sqsMock, "send");
    const response = await sendSqsMessage("Message", "test-url");
    expect(response).toEqual({ MessageId: "12345" });
  });
});

describe("sendBatchSqsMessage", () => {
  it("should be defined", async () => {
    expect(sendBatchSqsMessage).toBeDefined();
  });

  it("should call SQS send", async () => {
    sqsMock.onAnyCommand().resolves({ Successful: [], Failed: undefined });
    jest.spyOn(sqsMock, "send");
    const response = await sendBatchSqsMessage(["Message"], "test-url");
    expect(response.Successful).toBeDefined();
    expect(response.Failed).toBeUndefined();
  });

  it("should throw error if empty messages", async () => {
    await expect(() => sendBatchSqsMessage([], "url")).rejects.toThrowError(
      ErrorMessages.SQS.NoMessages,
    );
  });

  it("should throw an error if too many messages are passed", async () => {
    await expect(() =>
      sendBatchSqsMessage(Array(12).fill("message"), "url"),
    ).rejects.toThrowError(ErrorMessages.SQS.TooManyMessages);
  });
});
