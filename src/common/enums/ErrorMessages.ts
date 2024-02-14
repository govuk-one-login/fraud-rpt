export namespace ErrorMessages {
  export enum Records {
    NoRecords = "No Records in Request",
  }
  export enum ConfigParams {
    NumMessagesInvalid = "Invalid entry for numMessages parameter",
    RpSplitInvalid = "Invalid entry for rpSplit parameter",
    EventTypeSplitInvalid = "Invalid entry for eventTypeSplit parameter",
    ErrorRateInvalid = "Invalid entry for errorRate parameter",
    InboundEndpointURLInvalid = "Invalid entry for inboundURL parameter",
  }
  export enum Environment {
    NoQueueUrl = "Queue URL not Available",
    InvalidEnvironment = "Invalid environment passed to Lambda",
  }
  export enum SQS {
    NoMessages = "There are no messages passed through",
    TooManyMessages = "Too many messages are being attempting to be sent via SQS in one batch",
    InvalidSQSResponse = "Invalid response recieved from SQS client",
    LostMessage = "Some messages were lost in the SQS Send Batch Request",
    MissingFieldInMessage = "The SQS is missing at least one of the Destination or SET is missing in this SQS record",
  }
  export enum Auth {
    GetAuthTokenFailed = "Failed to retrieve auth token",
    FailedSSMSecret = "The Cognito Pool did not return the user pool secret",
  }
  export enum SSM {
    NoSSMParameters = "The SSM did not return all parameters",
  }
}
