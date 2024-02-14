import { expect, describe, it } from '@jest/globals';
import { generatorLambda } from './handler';
import { Context } from 'aws-lambda';
import { ErrorMessages } from '../../common/enums/ErrorMessages';
import {
  SampleEvents,
  ExpectedResponses,
} from '../../common/testEvents/SampleEvents';
import { LogEvents } from '../../common/enums/Log-events';

process.env.ENVIRONMENT = 'development';

jest.mock('../../common/classes/Auth/Auth', () => ({
  Auth: jest.fn(() => ({
    getIds: jest.fn(),
    getSecret: jest.fn(),
    getAuthToken: jest.fn(),
    getAllAuthValues: jest.fn(),
  })),
}));

jest.mock('@govuk-one-login/logging/logging', () => ({
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

jest.mock('../../common/queues/queues', () => ({
  sqsBatchMessageMaxCount: 10,
  sendSqsMessage: jest.fn(() => ({ activationEvent: 'TestEvent' })),
  sendBatchSqsMessage: jest.fn(() => ({
    Successful: mockSqsSuccesses
      ? [
          { MessageId: 'MessageId1' },
          { MessageId: 'MessageId2' },
          { MessageId: 'MessageId3' },
          { MessageId: 'MessageId4' },
          { MessageId: 'MessageId5' },
        ]
      : undefined,
    Failed: mockSqsFailures
      ? [
          { Id: 'BatchId1' },
          { Id: 'BatchId2' },
          { Id: 'BatchId3' },
          { Id: 'BatchId4' },
          { Id: 'BatchId5' },
        ]
      : undefined,
  })),
}));

const fetchResponseMock = () =>
  Promise.resolve({
    ok: returnFetchOk,
    status: returnFetchOk ? 200 : 400,
    statusText: returnFetchOk ? 'ok' : 'Testing an erroroneous fetch',
    json: async () => ({
      testData: returnFetchOk
        ? 'ok'
        : 'This is a mock request - no actual call will be made',
    }),
  } as Response);

jest.spyOn(global, 'fetch').mockImplementation(fetchResponseMock);

let mockSqsSuccesses: boolean;
let mockSqsFailures: boolean;
let returnFetchOk: boolean;

beforeEach(() => {
  process.env.TRANSMITTER_QUEUE_URL = 'Queue Url';
  process.env.ENVIRONMENT = 'development';
  mockSqsSuccesses = true;
  mockSqsFailures = false;
  returnFetchOk = true;
});

afterEach(() => {
  jest.clearAllMocks();
});

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

describe('handleSendRequest', () => {
  it('should be defined', async () => {
    expect(generatorLambda.handleSendRequest).toBeDefined();
  });

  it('should handle a batch of successful messages', async () => {
    mockSqsSuccesses = true;
    mockSqsFailures = false;
    await generatorLambda.handleSendRequest([
      'message1',
      'message2',
      'message3',
      'message4',
      'message5',
    ]);
    expect(generatorLambda.fraudLogger.logSETBatchGeneration).toBeCalledWith([
      LogEvents.FullSETBatchGenerated,
      ['MessageId1', 'MessageId2', 'MessageId3', 'MessageId4', 'MessageId5'],
      [],
    ]);
  });

  it('should handle a batch of all failed messages', async () => {
    mockSqsSuccesses = false;
    mockSqsFailures = true;
    await generatorLambda.handleSendRequest(Array(5));
    expect(generatorLambda.fraudLogger.logSETBatchGeneration).toBeCalledWith([
      LogEvents.FailedSETBatchGenerated,
      [],
      ['BatchId1', 'BatchId2', 'BatchId3', 'BatchId4', 'BatchId5'],
    ]);
  });

  it('should handle a batch of partially failed messages', async () => {
    mockSqsSuccesses = true;
    mockSqsFailures = true;
    await generatorLambda.handleSendRequest(Array(10));
    expect(generatorLambda.fraudLogger.logSETBatchGeneration).toBeCalledWith([
      LogEvents.PartialSETBatchGenerated,
      ['MessageId1', 'MessageId2', 'MessageId3', 'MessageId4', 'MessageId5'],
      ['BatchId1', 'BatchId2', 'BatchId3', 'BatchId4', 'BatchId5'],
    ]);
  });

  it('should throw an error if there are no Successful or Failed messages in response', async () => {
    mockSqsSuccesses = false;
    mockSqsFailures = false;
    await expect(() =>
      generatorLambda.handleSendRequest([])
    ).rejects.toThrowError(ErrorMessages.SQS.InvalidSQSResponse);
  });

  it('should throw an error if the number of failed and successful messages dont add up to the total attempting to be sent', async () => {
    mockSqsSuccesses = true;
    mockSqsFailures = false;
    await expect(() =>
      generatorLambda.handleSendRequest(Array(6))
    ).rejects.toThrowError(ErrorMessages.SQS.LostMessage);
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

  it('should loop through messages and call the logger functions the correct number of times', async () => {
    await generatorLambda.handler(
      SampleEvents.ValidFullConfigEvent,
      {} as Context
    );

    expect(generatorLambda.fraudLogger.logStartedProcessing).toBeCalledTimes(1);
    expect(generatorLambda.handleSendRequest).toBeCalledTimes(2); // Ceil(numMessages/10)
    expect(
      generatorLambda.fraudLogger.logSuccessfullyProcessed
    ).toBeCalledTimes(1);
  });

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

  it('should retry failed messages until all are sent', async () => {
    jest
      .spyOn(generatorLambda, 'handleSendRequest')
      .mockReturnValueOnce(Promise.resolve([3, 2]))
      .mockReturnValueOnce(Promise.resolve([0, 2]))
      .mockReturnValue(Promise.resolve([2, 0])); // Fail to send 2 messages twice out of 5 total
    const response = await generatorLambda.handler(
      SampleEvents.ErrorRetryTestingEvent,
      {} as Context
    );
    expect(response).toStrictEqual(
      ExpectedResponses.ErrorRetryTestingEventSuccessful
    );
  });

  it('should retry only up to 5 times', async () => {
    jest
      .spyOn(generatorLambda, 'handleSendRequest')
      .mockReturnValueOnce(Promise.resolve([4, 1]))
      .mockReturnValue(Promise.resolve([0, 1])); // 1 always failing to send
    const response = await generatorLambda.handler(
      SampleEvents.ErrorRetryTestingEvent,
      {} as Context
    );
    expect(response).toStrictEqual(
      ExpectedResponses.ErrorRetryTestingEventMaxRetry
    );
  });
});
