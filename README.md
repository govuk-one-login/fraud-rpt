# The Relying Party Transmitter

This is the source code for the Relying Party Transmitter (RPT) application. The RPT application demonstrates how serverless functions can send a message from a transmitter, such as a Relying Party (RP), to our [Shared Signals Framework](https://sharedsignals.guide/) (SSF) receiver.

This page explains:

- [the logic behind the serverless functions](#understanding-the-rpt-functions)
- [how to build and deploy the RPT using AWS](#building-and-deploying-the-rpt-using-aws)

You can [read more about the responsibilities of receivers and transmitters, the [Security Event Token](https://datatracker.ietf.org/doc/html/rfc8417) (SET) format, and how to manually recreate the transmitter function](./transmitter_guidance.md).

## Understanding the RPT functions

This section explains how the serverless functions implemented in the RPT application work.

The RPT uses:

- [a transmitter function](#transmitter-function) - you must implement the transmitter function to send the message to the receiver
- [helper functions](#helper-functions) - you can use the helper functions to test the transmitter function

### Transmitter function

The transmitter function is triggered when it receives a defined number of messages. The transmitter function signs the SET in each message and forwards each message to the receiver as an HTTP `POST`.

The shared signals team will send you:

- a client ID/secret pair, to request an authentication token
- the full URL of the `/authorize` endpoint, to request an authentication token
- the full URL of the inbound shared signals endpoint to send the message

You must send the shared signals team:

- the public key that corresponds with the private key used to sign the SET, so the shared signals team can check the signature of the message
- the IP address that sends the request, so the shared signals team can add it to their allowlist

The payload of the `POST` request is a signed SET, using a private key to generate the signature. This is a JSON Web Token (JWT) object in the JSON Web Signature (JWS) Compact Serialisation format. The receiver verifies the signature using the corresponding public key.

The header of the `POST` request is authorisation token. The transmitter function gets an authorisation token by sending a request to the `/authorize` endpoint with the RP’s client ID and secret.

### Helper functions

Helper functions test the behaviour of the transmitter function in the application. You do not need to implement these functions, but you may find it helpful to use them for testing.

There are 2 helper functions:

- [the generator function](#generator-function) generates test cases of messages
- [the public key function](#public-key-function) simulates an RP's endpoint for serving their public key

#### Generator function

The generator function generates a series of messages to send to the transmitter function. It is triggered by an API call. The infrastructure template for the API server is also included as part of the RPT application.

This function:

- tests that the shared signals receiver endpoint is available
- sends batches of messages to the transmitter function
- regenerates and resends any messages that failed to send, if required
- logs the number of successful and failed messages along with their parameters

The parameters you send to the API endpoint set:

- the number of messages to send
- the ratio of each event type
- the error rate for generating a valid SET
- which shared signals pipeline endpoint to use

You can find the full URL for the API endpoint using the deployment logs. The API endpoint is described in the logs as the APIGateway URL.

An example API request to trigger the generator function:

```json
{
  "numMessages": 1,
  "rpSplit": [1, 0, 0],
  "eventTypeSplit": {
    "accountBlock": 1,
    "accountConcern": 1,
    "accountPurged": 1,
    "accountCredentialChangeRequired": 0,
    "accountDisabled": 0,
    "accountEnabled": 0,
    "credentialCompromise": 0,
    "deviceConcern": 1,
    "optIn": 0,
    "optOutInitiated": 0,
    "optOutCancelled": 0,
    "optOutEffective": 0,
    "recoveryActivated": 0,
    "recoveryInformationChanged": 0,
    "sessionsRevoked": 0
  },
  "errorRate": 0,
  "inboundEndpointURL": "inbound-ssf.development.account.gov.uk"
}
```

AWS Simple Queue Service (SQS) queues are used between the generator and transmitter functions. If a message fails to send on the first attempt, AWS SQS reattempts to send the message until it reaches the limit, before transferring the message to the associated AWS Dead Letter Queue (DLQ). The reattempt limit is set in the queue redrive policy.

#### Public key function

The public key function returns the public key from a key store and then logs the request. This function is triggered by an API call. This public key is used by the receiver to verify the SET.

The RPT public key function returns the public key as a base64-encoded `.pem` file.

## Building and deploying the RPT using AWS

This section explains:

- [what you’ll need to build the application](#before-you-start)
- [how to build the application](#building-the-application)
- [how to test the functions locally](#testing-the-functions-locally)
- [how to deploy the application](#deploying-the-application)
- [how events are logged](#logging-events)

### Before you start

To build the application you’ll need:

- an AWS Account
- an AWS Identity and Access Management (IAM) administrator user account
- an AWS access key pair
- [a GitHub Classic Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT) with at least the `read:packages` permission so you can download the application dependencies from GitHub

You must build the application before you can deploy it in AWS. To build the application, you’ll need to install:

- [AWS Serverless Application Mode (SAM) Command Line Interface (CLI)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to interact with AWS to build, test and deploy the application
- [Node.js](https://nodejs.org/en/download/current) to build the TypeScript application

### Building the application

To build the application:

1. Create a `.npmrc` file at the repository root to store the PAT. This will authenticate you to download the application dependencies from GitHub. Your `.npmrc` file should look like this:

```bash
@govuk-one-login:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:\_authToken={YOUR_AUTH_TOKEN}
```

1. Download and install the TypeScript application dependencies. From the root of the repository, run:

```bash
npm-install
```

1. Use the AWS CLI build action to build the application locally. The [application infrastructure config file](template-rpt.yaml) describes the cloud resources and their configuration. The [logic for the serverless functions](/src/lambdas/) is linked to from this config file. From the root of the repository, run:

```bash
sam build --template template-rpt.yaml --region eu-west-2
```

### Testing the functions locally

You can run the serverless functions on your local machine using the `sam local invoke` command. For example:

```bash
sam local invoke TransmitterLambda
```

### Deploying the application

We recommend automatically deploying the application using a tool such as AWS CloudFormation or Terraform.

For this project, a [GitHub action](.github/workflows/deploy-branch.yaml) [builds the application](.github/workflows/build.yaml) and [deploys it with AWS CloudFormation](.github/workflows/deploy-to-aws.yaml).

### Logging events

The RPT uses [AWS Powertools](https://github.com/aws-powertools/powertools-lambda-typescript) to log events from each serverless function to AWS CloudWatch.

## Using the recommended developer tools

We recommend these tools if you intend to update the RPT or if you’re writing your own AWS lambda function:

- [VS Code](https://code.visualstudio.com/download) as a preferred code editor for its extensions with AWS
- [AWS Serverless Application Mode (SAM) CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to build and deploy applications in AWS through the CLI rather than the Web UI
- [Node.js](https://nodejs.org/en/) to build the serverless functions in TypeScript
- [Docker](https://docs.docker.com/desktop/) to test the build action locally with AWS SAM
- [pre-commit](https://pre-commit.com) to run the project's recommended pre-commit hooks - this if required if making changes to this repository

### Configure the recommended developer tools

To configure the tools:

- run `pre-commit install` to install the project's pre-commit hooks to improve security and write cleaner code - you must do this if you’re making changes to this repository
- install the [AWS Toolkit extension for VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html) for a more integrated experience with AWS
  - connect the AWS toolkit to your AWS account by running `aws configure sso`
- install the [SonarLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode) as a TypeScript linter
  - use Connected Mode to bind your local repository to the remote repository on SonarCloud
