import { expect, describe, it } from "@jest/globals";
import { transmitterLambda } from "./handler";
import { Context, SQSEvent } from "aws-lambda";
import { ErrorMessages } from "../../common/enums/ErrorMessages";
import { FraudLogger, fraudTracer } from "@govuk-one-login/logging/logging";

process.env.ENVIRONMENT = "development";

jest.mock("../../common/classes/Auth/Auth", () => ({
  Auth: jest.fn(() => ({
    getIds: jest.fn(),
    getSecret: jest.fn(),
    getAuthToken: jest.fn(),
    getAllAuthValues: jest.fn(),
  })),
}));

jest.mock("@aws-sdk/client-kms", () => {
  return {
    KMSClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
  };
});

jest.mock("@govuk-one-login/logging/logging", () => ({
  FraudLogger: jest.fn(() => ({
    logStartedProcessing: jest.fn(),
    logSuccessfullyProcessed: jest.fn(),
    logErrorProcessing: jest.fn(),
    logJWSSignSuccess: jest.fn(),
    logJWEEncryptSuccess: jest.fn(),
    logDebug: jest.fn(),
    metrics: {
      publishStoredMetrics: jest.fn(),
    },
  })),
  fraudTracer: {
    captureLambdaHandler: () => jest.fn(),
    captureMethod: () => jest.fn(),
    captureAWSv3Client: jest.fn((client) => client),
  },
}));

jest.mock("../../common/queues/queues", () => ({
  sendSqsMessage: jest.fn(() => ({ MessageId: "TestId" })),
}));

jest.mock("../../common/classes/JWT/jwt");

const fetchResponseMock = () =>
  Promise.resolve({
    ok: returnFetchOk,
    status: returnFetchOk ? 200 : 400,
    statusText: returnFetchOk ? "ok" : "Testing an erroroneous fetch",
    json: async () => ({
      testData: returnFetchOk
        ? "ok"
        : "This is a mock request - no actual call will be made",
    }),
  } as Response);
jest.spyOn(global, "fetch").mockImplementation(fetchResponseMock);

let returnFetchOk: boolean;

describe("Transmitter Handler", () => {
  beforeEach(() => {
    returnFetchOk = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", async () => {
    expect(transmitterLambda.handler).toBeDefined();
  });

  it("should return error if no Records in Request", async () => {
    await transmitterLambda.handler({} as SQSEvent, {} as Context);

    expect(
      transmitterLambda.fraudLogger.logErrorProcessing,
    ).toHaveBeenCalledWith(
      "No Message ID",
      Error(ErrorMessages.Records.NoRecords),
    );
  });

  it.each([
    {
      Records: [
        {
          messageId: "PrevTestId",
          body: JSON.stringify({ destination: "testUrl.gov.uk" }),
        },
      ],
    },
    {
      Records: [
        {
          messageId: "PrevTestId",
          body: JSON.stringify({ SET: {} }),
        },
      ],
    },
  ])(
    "should error if either SET or Destination are missing in each record",
    async (invalidEvent) => {
      await transmitterLambda.handler(invalidEvent as SQSEvent, {} as Context);

      expect(
        transmitterLambda.fraudLogger.logErrorProcessing,
      ).toHaveBeenCalledWith(
        "PrevTestId",
        Error(ErrorMessages.SQS.MissingFieldInMessage),
      );
    },
  );

  it("should return an error if the Fetch fails - or return the failed ID", async () => {
    returnFetchOk = false;

    await transmitterLambda.handler(
      {
        Records: [
          {
            messageId: "PrevTestId",
            body: JSON.stringify({ SET: {}, destination: "testUrl.gov.uk" }),
          },
        ],
      } as SQSEvent,
      {} as Context,
    );

    expect(
      transmitterLambda.fraudLogger.logStartedProcessing,
    ).toHaveBeenCalledWith("PrevTestId");

    expect(
      transmitterLambda.fraudLogger.logErrorProcessing,
    ).toHaveBeenCalledWith(
      "PrevTestId",
      ReferenceError(
        "There was an error making the post request: 400 Testing an erroroneous fetch",
      ),
    );
  });

  it("should call successfullyProcessed Event if successful", async () => {
    await transmitterLambda.handler(
      {
        Records: [
          {
            messageId: "PrevTestId",
            body: JSON.stringify({ SET: {}, destination: "testUrl.gov.uk" }),
          },
        ],
      } as SQSEvent,
      {} as Context,
    );

    expect(
      transmitterLambda.fraudLogger.logStartedProcessing,
    ).toHaveBeenCalledWith("PrevTestId");

    expect(
      transmitterLambda.fraudLogger.logSuccessfullyProcessed,
    ).toHaveBeenCalledWith("PrevTestId");
  });

  it("should return failed messages", async () => {
    const errorMessage: string = "Mocking error in post request";
    jest.spyOn(transmitterLambda, "makePostRequest").mockImplementation(() => {
      throw new Error(errorMessage);
    });
    const failedMessges = await transmitterLambda.handler(
      {
        Records: [
          {
            messageId: "PrevTestId1",
            body: JSON.stringify({ SET: {}, destination: "testUrl.gov.uk" }),
          },
          {
            messageId: "PrevTestId2",
            body: JSON.stringify({ SET: {}, destination: "testUrl.gov.uk" }),
          },
          {
            messageId: "PrevTestId3",
            body: JSON.stringify({ SET: {}, destination: "testUrl.gov.uk" }),
          },
        ],
      } as SQSEvent,
      {} as Context,
    );

    expect(failedMessges).toStrictEqual({
      batchItemFailures: [
        { itemIdentifier: "PrevTestId1" },
        { itemIdentifier: "PrevTestId2" },
        { itemIdentifier: "PrevTestId3" },
      ],
    });

    expect(transmitterLambda.fraudLogger.logErrorProcessing).toBeCalledWith(
      "PrevTestId1",
      ReferenceError(errorMessage),
    );
    expect(transmitterLambda.fraudLogger.logErrorProcessing).toBeCalledWith(
      "PrevTestId2",
      ReferenceError(errorMessage),
    );
    expect(transmitterLambda.fraudLogger.logErrorProcessing).toBeCalledWith(
      "PrevTestId3",
      ReferenceError(errorMessage),
    );
  });

  it("should log failed runs", async () => {
    const errorMessage: string = "Testing the throw";
    jest
      .spyOn(transmitterLambda, "handlePostRequests")
      .mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

    await transmitterLambda.handler(
      {
        Records: [
          {
            messageId: "PrevTestId",
            body: JSON.stringify({ SET: {}, destination: "testUrl.gov.uk" }),
          },
        ],
      } as SQSEvent,
      {} as Context,
    );

    expect(transmitterLambda.fraudLogger.logErrorProcessing).toBeCalledWith(
      "No Message ID",
      ReferenceError(errorMessage),
    );
  });
});
