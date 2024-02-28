# The Relying Party Transmitter
The Relying Party Transmitter (RPT) application demonstrates how messages can be transmitted from Relying Parties (RPs) to the Shared Signals Framework (SSF). Though this implementation uses serverless functions in AWS (AWS Lambda), the approach described is platform independent.

There are three components to the RPT application:
- [Generator function](#Generator-Function): Generates test cases of messages to pass to the Transmitter function. 
- [Transmitter function](#Transmitter-Function): Verifies and signs messages received from the Generator Function and forwards them to the Shared Signals Framework (SSF) endpoint.
- [Public Key function](#Public-Key-Function): Simulates an RP's endpoint for serving their public key

![Architecture of the RPT](/READMEresources/MainArchitecture.png)
##  Overview
### Generator function
The Generator function is triggered by an API to send a series of event messages to the transmitter function. Messages are generated based on the number of messages to send, the ratio of each event type, the error rate of the generated messages and the endpoint of the SSF pipeline.

Event Types:
- accountPurged
- accountCredentialChangeRequired
- accountDisabled
- accountEnabled
- credentialCompromise
- optIn
- optOutInitiated
- optOutCancelled
- optOutEffective
- recoveryActivated
- recoveryInformationChanged
- sessionsRevoked

The function:
- tests that the SSF is available
- sends batches of messages to the Transmitter function
- regenerates and resends failed messages
- logs the number of successful and failed messages, with the parameters

### Transmitter function

The Transmitter function is triggered when a message is received from the Generator function.

The function:
- authenticates using the JSON Web Tokens (JWT) provided in the message
- packages the message body into a JSON Web Signature (JWS)
- signs the JWS using a private key
- generates a JSON Web Encryption (JWE) based on the JWS
- generates a Content Encryption Key (CEK) using the JWE
- signs the CEK using a public key from the Inbound-SSF
- adds the CEK to the JWS
- sends the JWS as a message to the Inbound-SSF pipeline endpoint

### Public Key function
The Public Key function is triggered by an API call to retrive the public key used by the Inbound-SSF to verify the SETs (what does this mean?).
The function:
- returns the public key from a key store
- logs the request

In our example, the public key is returned as a base64-encoded PEM file.

## Configure your development environment

### Install recommended developer tools

We recommend installing the following tools:
- [VS Code](https://code.visualstudio.com/download) as a preferred IDE for its extensions with AWS
- [Serverless Application Mode (SAM) CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js](https://nodejs.org/en/), including `npm`.
- [Docker](https://docs.docker.com/desktop/) why?
- [pre-commit](https://pre-commit.com) to run pre-commit hooks

### Configure recommended developer tools

- Run `pre-commit install` to install pre-commit hooks
- Install the [AWS Toolkit extension for VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
 - The AWS Toolkit can be connected through SSO using `aws configure sso` and then selecting the correct profile at the bottom of VSCode.
- Install the [SonarLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)
 - SonarLint should be connected through the `Connected Mode` it offers.
 - Once it has been connected, creating the binding of your local repo to the `di-fraud-mock-rp` repo on `SonarCloud`.

### Building the application
- [Generate a Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with 'read-packages' permissions
 - How long does this token last?
- Store the PAT in a .npmrc file at the repository root
   ```
   @govuk-one-login:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:\_authToken=<Your Personal Access Token>
   ```
- Install application dependencies
 ```bash
 npm i
 ```
- Build the application in AWS
 ```bash
 sam build --template template-mock-rp.yaml --region eu-west-2
 ```

### Running functions manually

You can invoke functions with the `sam local invoke` command.
```bash
sam local invoke TransmitterLambda
```

### Running functions based on events

- To run your function with an event, use the `--event` parameter.
 ```bash
 sam local invoke TransmitterLambda --event event.json
 ```

An event can be generated for a service:
```bash
sam local generate-event <service> <event>
```
For example, to generate an `SQS` service `receive-message` event:

```bash
sam local generate-event sqs receive-message
```

## Deploying to CloudFormation

The `deploy-branch.yaml` action should be used to [deploy branches of the Mock RP to the AWS development environment](https://govukverify.atlassian.net/wiki/spaces/FPAD/pages/3684270595/Manual+Testing+of+Deployed+Branches).

## Running the RPT Service

You can trigger the RPT Service through an API endpoint.
POST /deploy/{development/build/staging}

- **numMessages**: The number of messages to send as a result of said invocation
- **eventTypleSplit**: The ratio of messages containing certain events, currently assuming only 2 types of event.
- **errorRate**: Number between 0-1, which is the probability of the generated SET containing an error in formatting, default 0.
- **inboundEndpointURL**: The endpoint of the SSF pipeline to which the RPT will be sending messages, default"inbound-ssf.development.account.gov.uk"

```json
{
   "numMessages": 1,
   "eventTypeSplit": {
       "accountPurged": 1,
       "accountCredentialChangeRequired": 0,
       "accountDisabled": 0,
       "accountEnabled": 0,
       "credentialCompromise": 0,
       "optIn": 0,
       "optOutInitiated": 0,
       "optOutCancelled": 0,
       "optOutEffective": 0,
       "recoveryActivated": 0,
       "recoveryInformationChanged": 0,
       "sessionsRevoked":0
   },
   "errorRate": 0,
   "inboundEndpointURL" : "inbound-ssf.development.account.gov.uk"
}

```

## Logging

AWS Powertools is used within the Project to log events from inside each Lambda. These logs are sent to Cloudwatch. Different levels of logs can be recorded using the following methods in the PowerTools package;

```TypeScript
logger.debug()
logger.info()
logger.error()
logger.critical()
```

##### Example logging method

```TypeScript
/**
  * Send Started Processing Event log
  *
  * @param messageId
  */
 logStartedProcessing = (messageId?: string): void => {
   this.logger.info(LogEvents.StartedProcessing, { messageId });
   this.metrics.addMetric(LogEvents.StartedProcessing, MetricUnits.Count, 1);
 };
```

##### Example output in Cloudwatch

```JSON
{
   "level": "INFO",
   "message": "Started Processing",
   "service": "inboundSSF",
   "timestamp": "2023-05-25T09:20:32.132Z",
   "xray_trace_id": "1-646f285f-4d67c24bfe2a7a5e227973e0",
   "messageId": "d001fb5c-03c7-4519-bf31-c22aededc339"
}

```

Powertools tracing can be used to track a single event / message throughout the entire inbound pipeline, showing the time taken to process by each Lambda, with the ability to break each lambda’s code down into segments for monitoring.

**NOTE: Decorators can only be used on Class methods, and are not supported on individual functions.**

Capturing Lambda handlers can be done by adding the captureLambdaHandler middleware to the Handler method

```TypeScript
export const handler = middy(
 transmitterLambda.handler.bind(transmitterLambda)
).use(captureLambdaHandler(fraudTracer));
```

AWS SDK clients can be wrapped with the captureAWSv3Client method to trace all method calls using that package

```TypeScript
const sqsClient = fraudTracer.captureAWSv3Client(
 new SQSClient({
   region: process.env.AWS_REGION,
 })
);
```

#### Queues

SQS queues are used between the Lambdas. The `Generator Lambda` outputs events into the `SETTransmitterQueue`, which is used as an event source for the `Transmitter Lambda`.

All SQS queues have Dead Letter Queues associated with them. If a message fails to be processed by the `Generator Lambda`, it will retry for a number of times setout by the queue redrive policy. Once this has been reached, the message will then be transferred to the DLQ associated with the queue.

The JWS is then packaged into a post request and sent to the endpoint of the Inbound-SSF pipeline.