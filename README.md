# The Relying Party Transmitter

The Relying Party Transmitter (RPT) application demonstrates how a [Security Event Token](https://datatracker.ietf.org/doc/html/rfc8417) (SET) can be sent from Relying Parties (RPs) to the Transmitter in the Shared Signals Framework (SSF) using a severless function, known as the Transmitter function. This function signs and encrypts a SET and forwards it to the Shared Signals Framework endpoint.

Helper functions have been added for the purpose of testing the Transmitter function. The Generator function generates test cases of messages to pass on and the public key function simulates an RP's endpoint for serving their public key.

Though this implementation uses serverless functions in AWS (AWS Lambda), the approach described is platform-independent.

![Architecture of the RPT](/READMEresources/MainArchitecture.png)

## Background

A SET is issued on a state change of a security subject, for example a user account or an HTTP session. When the Shared Signals Transmitter endpoint receives a SET, it will validate and interpret the received SET and takes its own independent actions, if any.

The SET format extends the JSON Web Token (JWT) format which describes claims. The claims in a SET are described in [RFC8417](https://datatracker.ietf.org/doc/html/rfc8417) and describe the security event that has taken place, the issuer, the subject and the intended audience of the event.

An example SET:

```json
{
    "iss": "https://idp.example.com/",
    "jti": "756E69717565206964656E746966696572",
    "iat": 1508184845,
    "aud": "636C69656E745F6964",
    "events": {
  "https://schemas.openid.net/secevent/risc/event-type/account-disabled"
          : {
        "subject": {
          "subject_type": "iss-sub",
          "iss": "https://idp.example.com/",
          "sub": "7375626A656374"
        },
        "reason": "hijacking"
      }
    }
  }
```

A JWT can be represented as:

- a JSON Web Signature (JWS) where the claims are provided in the payload to be signed (the most common format).
  - This has the format: `[header].[payload].[signature]`
- a JSON Web Encryption (JWE) where the claims are provided in the plaintext to be signed and/or encrypted.
  - This has the format: `[header].[encrypted key].[encrypted payload].[random number].[authentication tag]`

## Transmitter function

The Transmitter function signs and encrypts a SET and forwards it to the Shared Signals Framework (SSF) Transmitter endpoint. It is triggered when a message is received from the Generator function.

This function:

1. Signs the SET, using a private key as the signature. The signed SET and signature are used to generate a JWS object. The SSF endpoint will use the corresponding public key to verify the signature.
2. Encrypts the JWS, using the full JWS object as the message:
   1. Generates a random Content Encryption Key (CEK).
   2. Encrypt the CEK with the RP's public key to form the JWE encrypted key.
   3. Generates a random JWE initilization vector.
   4. Generates a header based on the algorithms chosen for encrypting for the CEK and the message.
   5. Generates the Additional Authenticated Data (AAD) encryption value based on the header.
   6. Encrypts the message using the CEK, JWE Initialization Vector and the AAD value. An authentication tag is producted as an artifact of this process.
   7. Based64url-encodes each component to form a JWE formatted object.
3. Sends the JWE to the SSF endpoint.

## Helper functions

### Generator function

The Generator function generates a series of messages to sent to the Transmitter function. It is triggered by an API call.

This function:

- tests that the SSF endpoint is available
- sends batches of messages to the Transmitter function
- regenerates and resends failed messages
- logs the number of successful and failed messages, with the parameters

Settings provided to the API determines the number of messages to send, the ratio of each [event type](#event-types), the error rate a generated SET and the endpoint of the SSF pipeline to use.

### Public Key function

The Public Key function is triggered by an API call to retrive the public key used by the Inbound-SSF to verify the SET.

This function:

- returns the public key from a key store
- logs the request

In our example, the public key is returned as a base64-encoded PEM file.

## Building the application

- [Generate a Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with 'read-packages' permissions
- Store the PAT in a .npmrc file at the repository root

   ```bash
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

### Example logging method

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

#### Example output in Cloudwatch

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

## Configure your development environment

### Install recommended developer tools

We recommend installing the following tools:

- [VS Code](https://code.visualstudio.com/download) as a preferred IDE for its extensions with AWS
- [Serverless Application Mode (SAM) CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js](https://nodejs.org/en/), including npm.
- [Docker](https://docs.docker.com/desktop/)
- [pre-commit](https://pre-commit.com) to run pre-commit hooks

### Configure recommended developer tools

- Run `pre-commit install` to install pre-commit hooks
- Install the [AWS Toolkit extension for VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
- The AWS Toolkit can be connected through SSO using `aws configure sso` and then selecting the correct profile at the bottom of VSCode.
- Install the [SonarLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)
- SonarLint should be connected through the `Connected Mode` it offers.
- Once it has been connected, creating the binding of your local repo to the di-fraud-mock-rp repo on SonarCloud

#### Queues

SQS queues are used between the Lambdas. The `Generator Lambda` outputs events into the `SETTransmitterQueue`, which is used as an event source for the `Transmitter Lambda`.

All SQS queues have Dead Letter Queues associated with them. If a message fails to be processed by the `Generator Lambda`, it will retry for a number of times setout by the queue redrive policy. Once this has been reached, the message will then be transferred to the DLQ associated with the queue.

The JWS is then packaged into a post request and sent to the endpoint of the Inbound-SSF pipeline.

### Event Types

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
