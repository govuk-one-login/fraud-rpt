// This enum handles mock API events for the endpoint that triggers the generator lambda

import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";

export function createConfigApiGatewayEvent(
  stringifiedConfigJson: string | null,
): APIGatewayProxyEvent {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/my/path",
    rawQueryString: "parameter1=value1&parameter1=value2&parameter2=value",
    cookies: ["cookie1", "cookie2"],
    headers: {
      header1: "value1",
      header2: "value1,value2",
    },
    queryStringParameters: {
      parameter1: "value1,value2",
      parameter2: "value",
    },
    requestContext: {
      accountId: "123456789012",
      apiId: "api-id",
      authentication: {
        clientCert: {
          clientCertPem: "CERT_CONTENT",
          subjectDN: "www.example.com",
          issuerDN: "Example issuer",
          serialNumber: "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
          validity: {
            notBefore: "May 28 12:30:02 2019 GMT",
            notAfter: "Aug  5 09:36:04 2021 GMT",
          },
        },
      },
      authorizer: {
        jwt: {
          claims: {
            claim1: "value1",
            claim2: "value2",
          },
          scopes: ["scope1", "scope2"],
        },
      },
      domainName: "id.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "id",
      http: {
        method: "POST",
        path: "/my/path",
        protocol: "HTTP/1.1",
        sourceIp: "192.0.2.1",
        userAgent: "agent",
      },
      requestId: "id",
      routeKey: "$default",
      stage: "$default",
      time: "12/Mar/2020:19:03:58 +0000",
      timeEpoch: 1583348638390,
    },
    body: stringifiedConfigJson,
    pathParameters: {
      parameter1: "value1",
    },
    isBase64Encoded: false,
    stageVariables: {
      stageVariable1: "value1",
      stageVariable2: "value2",
    },
  };
}

export const SampleConfigs = {
  NoConfigEvent: null,
  ValidNumMessagesConfigEvent: {
    numMessages: 5,
  },
  ValidRpSplitConfigEvent: {
    rpSplit: [1, 2, 1],
  },
  ValidEventTypeSplitConfigEvent: {
    eventTypeSplit: {
      accountPurged: 1,
      accountCredentialChangeRequired: 1,
      accountDisabled: 1,
      accountEnabled: 1,
      credentialCompromise: 0,
      optIn: 0,
      optOutInitiated: 0,
      optOutCancelled: 0,
      optOutEffective: 0,
      recoveryActivated: 0,
      recoveryInformationChanged: 0,
      sessionsRevoked: 0,
    },
  },
  ValidErrorRateConfigEvent: {
    errorRate: 0.2,
  },
  ValidFullConfigEvent: {
    numMessages: 20,
    rpSplit: [1, 2, 1],
    eventTypeSplit: {
      accountPurged: 1,
      accountCredentialChangeRequired: 0,
      accountDisabled: 0,
      accountEnabled: 0,
      credentialCompromise: 0,
      optIn: 0,
      optOutInitiated: 0,
      optOutCancelled: 0,
      optOutEffective: 0,
      recoveryActivated: 0,
      recoveryInformationChanged: 0,
      sessionsRevoked: 0,
    },
    errorRate: 0.2,
    inboundEndpointURL: "testUrl.gov.uk",
  },
  InvalidNumMessagesConfigEvent: {
    numMessages: "5",
  },
  InvalidRpSplitConfigEvent: {
    rpSplit: [1, 2, 1, 1],
  },
  InvalidEventTypeSplitConfigEventOne: {
    eventTypeSplit: {
      accountPurged: 1,
      accountCredentialChangeRequired: 0,
      accountDisabled: 0,
      accountEnabled: 0,
      credentialCompromise: 0,
      optIn: 0,
      optOutInitiated: 0,
      optOutCancelled: 0,
      optOutEffective: 0,
      recoveryActivated: 0,
      recoveryInformationChanged: 0,
    },
  },
  InvalidEventTypeSplitConfigEventTwo: {
    eventTypeSplit: {
      accountPurged: "1",
      accountCredentialChangeRequired: 1,
      accountDisabled: 1,
      accountEnabled: 1,
      credentialCompromise: 0,
      optIn: 0,
      optOutInitiated: 0,
      optOutCancelled: 0,
      optOutEffective: 0,
      recoveryActivated: 0,
      recoveryInformationChanged: 0,
      sessionsRevoked: 0,
    },
  },
  InvalidErrorRateConfigEvent: {
    errorRate: "0.2",
  },
  InvalidFullConfigEvent: {
    numMessages: "5",
    rpSplit: [1, 2, 1, 3],
    eventTypeSplit: [1, 1, 2],
    errorRate: "0.2",
    inboundEndpointURL: 3,
  },
  InvalidPartialOneConfigEvent: {
    numMessages: [5],
    errorRate: [2],
  },
  InvalidPartialTwoConfigEvent: {
    rpSplit: "[1, 2, 1, 1]",
    eventTypeSplit: {
      accountPurged: "1",
      accountCredentialChangeRequired: 0,
      accountDisabled: 0,
      accountEnabled: 0,
      credentialCompromise: 0,
      optIn: 0,
      optOutInitiated: 0,
      optOutCancelled: 0,
      optOutEffective: 0,
      recoveryActivated: 0,
      recoveryInformationChanged: 0,
      sessionsRevoked: 0,
    },
  },
  ErrorRetryTestingEvent: {
    numMessages: 5,
  },
};

export const SampleEvents = {
  NoConfigEvent: createConfigApiGatewayEvent(SampleConfigs.NoConfigEvent),
  ValidNumMessagesConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.ValidNumMessagesConfigEvent),
  ),
  ValidRpSplitConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.ValidRpSplitConfigEvent),
  ),
  ValidEventTypeSplitConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.ValidEventTypeSplitConfigEvent),
  ),
  ValidErrorRateConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.ValidErrorRateConfigEvent),
  ),
  InvalidNumMessagesConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidNumMessagesConfigEvent),
  ),
  InvalidRpSplitConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidRpSplitConfigEvent),
  ),
  InvalidEventTypeSplitConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidEventTypeSplitConfigEventOne),
  ),
  InvalidErrorRateConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidErrorRateConfigEvent),
  ),
  ValidFullConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.ValidFullConfigEvent),
  ),
  InvalidFullConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidFullConfigEvent),
  ),
  InvalidPartialOneConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidPartialOneConfigEvent),
  ),
  InvalidPartialTwoConfigEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.InvalidPartialTwoConfigEvent),
  ),
  ErrorRetryTestingEvent: createConfigApiGatewayEvent(
    JSON.stringify(SampleConfigs.ErrorRetryTestingEvent),
  ),
};

export const ExpectedResponses = {
  NoConfigEvent: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":10,"sendAttempts":1,"unsentMessages":0,"totalFailedMessageAttempts":0,"configParams":{"numMessages":10,"rpSplit":[1,0,0],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}',
  },
  ValidNumMessagesConfigEvent: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":10,"sendAttempts":1,"unsentMessages":0,"totalFailedMessageAttempts":0,"configParams":{"numMessages":5,"rpSplit":[1,0,0],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}', // Says sent 10 as mocked to return 10. numMessages still gets changed to 5
  },
  ValidRpSplitConfigEvent: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":10,"sendAttempts":1,"unsentMessages":0,"totalFailedMessageAttempts":0,"configParams":{"numMessages":10,"rpSplit":[0.25,0.5,0.25],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}',
  },
  ValidEventTypeSplitConfigEvent: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":10,"sendAttempts":1,"unsentMessages":0,"totalFailedMessageAttempts":0,"configParams":{"numMessages":10,"rpSplit":[1,0,0],"eventTypeSplit":[0.25,0.25,0.25,0.25,0,0,0,0,0,0,0,0],"errorRate":0,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}',
  },
  ValidErrorRateConfigEvent: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":10,"sendAttempts":1,"unsentMessages":0,"totalFailedMessageAttempts":0,"configParams":{"numMessages":10,"rpSplit":[1,0,0],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0.2,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}',
  },
  InvalidNumMessagesConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for numMessages parameter",
  },
  InvalidRpSplitConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for rpSplit parameter",
  },
  InvalidEventTypeSplitConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for eventTypeSplit parameter",
  },
  InvalidErrorRateConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for errorRate parameter",
  },
  ValidFullConfigEvent: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":20,"sendAttempts":1,"unsentMessages":0,"totalFailedMessageAttempts":0,"configParams":{"numMessages":20,"rpSplit":[0.25,0.5,0.25],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0.2,"inboundEndpointURL":"testUrl.gov.uk"}}',
  },
  InvalidFullConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for numMessages parameter\nInvalid entry for rpSplit parameter\nInvalid entry for eventTypeSplit parameter\nInvalid entry for errorRate parameter\nInvalid entry for inboundURL parameter",
  },
  InvalidPartialOneConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for numMessages parameter\nInvalid entry for errorRate parameter",
  },
  InvalidPartialTwoConfigEvent: {
    statusCode: 500,
    body: "Invalid entry for rpSplit parameter\nInvalid entry for eventTypeSplit parameter",
  },
  ErrorRetryTestingEventSuccessful: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":5,"sendAttempts":3,"unsentMessages":0,"totalFailedMessageAttempts":4,"configParams":{"numMessages":5,"rpSplit":[1,0,0],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}',
  },
  ErrorRetryTestingEventMaxRetry: {
    statusCode: 202,
    body: 'Generation run results: {"messagesSent":4,"sendAttempts":5,"unsentMessages":1,"totalFailedMessageAttempts":5,"configParams":{"numMessages":5,"rpSplit":[1,0,0],"eventTypeSplit":[1,0,0,0,0,0,0,0,0,0,0,0],"errorRate":0,"inboundEndpointURL":"https://inbound-ssf.dev.account.gov.uk"}}',
  },
};
