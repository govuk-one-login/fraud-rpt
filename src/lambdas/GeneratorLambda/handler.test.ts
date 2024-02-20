import { expect, describe, it } from "@jest/globals";
import { generatorLambda } from "./handler";
import { Context } from "aws-lambda";
import { ErrorMessages } from "../../common/enums/ErrorMessages";
import {
  SampleEvents,
  ExpectedResponses,
} from "../../common/testEvents/SampleEvents";
import { LogEvents } from "../../common/enums/Log-events";

process.env.ENVIRONMENT = "development";

jest.mock("../../common/classes/Auth/Auth", () => ({
  Auth: jest.fn(() => ({
    getIds: jest.fn(),
    getSecret: jest.fn(),
    getAuthToken: jest.fn(),
    getAllAuthValues: jest.fn(),
  })),
}));

jest.mock("@govuk-one-login/logging/logging", () => ({
  FraudLogger: jest.fn(() => ({
    logStartedProcessing: jest.fn(),
    logSuccessfullyProcessed: jest.fn(),
    logSETBatchGeneration: jest.fn(),
    logErrorProcessing: jest.fn(),
    logDebug: jest.fn(),
    metrics: {
      publishStoredMetrics: jest.fn(),
    },
  })),
  fraudTracer: {
    captureLambdaHandler: () => jest.fn(),
    captureMethod: () => jest.fn(),
  },
}));

describe('inboundEndpointHealthCheck', () => {
  it('should be defined', async () => {
    expect(generatorLambda.inboundEndpointHealthCheck).toBeDefined();
  });

  it('make a fetch request', async () => {
    returnFetchOk = true;

    await generatorLambda.inboundEndpointHealthCheck(
      'testUrl.gov.uk',
      'authTokenString'
    );
    expect(global.fetch).toHaveBeenCalled();
  });

  it('throw if the fetch request fails', async () => {
    returnFetchOk = false;

    await expect(() =>
      generatorLambda.inboundEndpointHealthCheck(
        'testUrl.gov.uk',
        'authTokenString'
      )
    ).rejects.toThrow();
  });
});

describe('Generator Handler', () => {
  beforeAll(() => {
    jest
      .spyOn(generatorLambda, 'handleSendRequest')
      .mockReturnValue(Promise.resolve([10, 0]));
  });


  it('should be defined', async () => {
    expect(generatorLambda.handler).toBeDefined();
  });


  it('should log an error if Queue Url is not defined', async () => {
    process.env.TRANSMITTER_QUEUE_URL = '';
    const response = await generatorLambda.handler(
      SampleEvents.NoConfigEvent,
      {} as Context
    );
    expect(response).toEqual({
      statusCode: 500,
      body: ErrorMessages.Environment.NoQueueUrl,
    });
    expect(generatorLambda.fraudLogger.logErrorProcessing).toHaveBeenCalledWith(
      'No Message ID',
      ReferenceError(ErrorMessages.Environment.NoQueueUrl)
    );
  });


  it.each(['', 'dev', 'production'])(
    'should log an error if the environment is not correctly defined',
    async (invalidEnvironment) => {
      process.env.ENVIRONMENT = invalidEnvironment;
      const response = await generatorLambda.handler(
        SampleEvents.NoConfigEvent,
        {} as Context
      );
      expect(response).toEqual({
        statusCode: 500,
        body: ErrorMessages.Environment.InvalidEnvironment,
      });
      expect(
        generatorLambda.fraudLogger.logErrorProcessing
      ).toHaveBeenCalledWith(
        'No Message ID',
        ReferenceError(ErrorMessages.Environment.InvalidEnvironment)
      );
    }
  );


  it('should parse and return valid config parameters', async () => {
    const response = await generatorLambda.handler(
      SampleEvents.ValidFullConfigEvent,
      {} as Context
    );
    expect(response).toStrictEqual(ExpectedResponses.ValidFullConfigEvent);
  });

  it.each([
    [
      SampleEvents.InvalidNumMessagesConfigEvent,
      ExpectedResponses.InvalidNumMessagesConfigEvent,
    ],
    [
      SampleEvents.InvalidRpSplitConfigEvent,
      ExpectedResponses.InvalidRpSplitConfigEvent,
    ],
    [
      SampleEvents.InvalidEventTypeSplitConfigEvent,
      ExpectedResponses.InvalidEventTypeSplitConfigEvent,
    ],
    [
      SampleEvents.InvalidErrorRateConfigEvent,
      ExpectedResponses.InvalidErrorRateConfigEvent,
    ],
    [
      SampleEvents.InvalidFullConfigEvent,
      ExpectedResponses.InvalidFullConfigEvent,
    ],
  ])(
    'should reject invalid config parameters',
    async (invalidConfigEvent, expectedResponse) => {
      const response = await generatorLambda.handler(
        invalidConfigEvent,
        {} as Context
      );
      expect(response).toStrictEqual(expectedResponse);
    }
  );

  it.each([
    [SampleEvents.NoConfigEvent, ExpectedResponses.NoConfigEvent],
    [
      SampleEvents.ValidNumMessagesConfigEvent,
      ExpectedResponses.ValidNumMessagesConfigEvent,
    ],
    [
      SampleEvents.ValidRpSplitConfigEvent,
      ExpectedResponses.ValidRpSplitConfigEvent,
    ],
    [
      SampleEvents.ValidEventTypeSplitConfigEvent,
      ExpectedResponses.ValidEventTypeSplitConfigEvent,
    ],
    [
      SampleEvents.ValidErrorRateConfigEvent,
      ExpectedResponses.ValidErrorRateConfigEvent,
    ],
  ])(
    'should use default parameters when none specified',
    async (validConfigEvent, expectedResponse) => {
      const response = await generatorLambda.handler(
        validConfigEvent,
        {} as Context
      );
      expect(response).toStrictEqual(expectedResponse);
    }
  );
