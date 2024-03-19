# The Relying Party Transmitter

The Relying Party Transmitter (RPT) application demonstrates how a [Security Event Token](https://datatracker.ietf.org/doc/html/rfc8417) (SET) can be sent from Relying Parties (RPs) to the Transmitter in the Shared Signals Framework (SSF) using a severless function, known as the Transmitter function. This function signs and encrypts a SET and forwards it to the SSF Transmitter endpoint.

Helper functions have been added for the purpose of testing the Transmitter function. The Generator function generates test cases of messages to pass on and the public key function simulates an RP's endpoint for serving their public key.

Though this implementation uses serverless functions in AWS (AWS Lambda), the approach described is platform-independent.

## Background

A SET is issued on a state change of a security subject, for example a user account or an HTTP session. When the Shared Signals Transmitter endpoint receives a SET, it will validate and interpret the received SET. A Transmitter and Receiver can, together, agree an action on receipt of a particular message.

The SET format extends the JSON Web Token (JWT) format which describes claims. The claims in a SET are described in [RFC8417](https://datatracker.ietf.org/doc/html/rfc8417) and describe the security event that has taken place, the issuer, the subject and the intended audience of the event.

An example SET used when an account has been disabled:

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

## Architecture

![Architecture of the RPT](/READMEresources/MainArchitecture.png)

## Transmitter function

The Transmitter function signs a SET and forwards it to the SSF Reciever endpoint, as a POST request. It is triggered when a SET is received.

This function:

1. Signs the SET, using a private key to generate the signature. The signed SET and signature are used to create a JWS object. This will be the payload of the request. The SSF endpoint will use the corresponding public key to verify the signature.
2. Generates the request header with an authorization token. You can obtained this by contacting the AWS Cognito instance associated with the SSF-owned user pool to request an authorization token.
3. Sends the request to the SSF Reciever endpoint.

## Helper functions

### Generator function

The Generator function generates a series of messages to sent to the Transmitter function. It is triggered by an API call.

This function:

- tests that the SSF endpoint is available
- sends batches of messages to the Transmitter function
- regenerates and resends failed messages
- logs the number of successful and failed messages, with the parameters

Settings provided to the API determines the number of messages to send, the ratio of each event type, the error rate for generating a valid SET and the endpoint of the SSF pipeline to use.

For this application, AWS Simple Queue Servce (SQS) queues are used between the Generator and Transmitter functions. The Generator Lambda outputs events into the SETTransmitterQueue, which is used as an event source for the Transmitter Lambda.

All SQS queues have Dead Letter Queues (DLQ) associated with them. If a message fails to be processed by the Generator Lambda, it will retry for a number of times setout by the queue redrive policy. Once this has been reached, the message will then be transferred to the DLQ associated with the queue.

### Public Key function

The Public Key function is triggered by an API call to retrive the public key used by the Inbound-SSF to verify the SET.

This function:

- returns the public key from a key store
- logs the request

In our example, the public key is returned as a base64-encoded *.pem file.

## Preparing to deploy the application using AWS

When building the application, the `template-rpt.yaml` is used as the starting point. This config file contains the application infrastructure code, which describes the cloud resources and their configuration. The [logic for the serverless functions](/src/lambdas/) is linked to from this config file.

To deploy the application in AWS you will need:

- an AWS Account
- an AWS Identity and Access Management (IAM) administrator user account
- an AWS access key pair
- [a GitHub Classic Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with at least the read:packages permission so that you can download the application dependencies from GitHub

You will need to install:

- [AWS Serverless Application Mode (SAM) Command Line Interface (CLI)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to interact with AWS to build, test and deploy the application 
- [Node.js](https://nodejs.org/en/download/current) to build the application

To build the application, you should:

1. create a `.npmrc` file at the repository root to store the PAT so that you have permission to download the application dependencies

   ```bash
   @govuk-one-login:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:\_authToken=<token>
   ```

2. download and install the application dependencies. From the root of the repo, run:

   ```bash
   npm-install
   ```

3. build the application locally ready for deployment. From the root of the repo, run:

   ```bash
   sam build --template template-mock-rp.yaml --region eu-west-2
   ```

### Testing the serverless functions on your local machine

You can run the serverless functions on your local machine using the `sam local invoke` command. For example:

```bash
sam local invoke TransmitterLambda
```

#### Testing functions using events

A [mock event file can be generated](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-generate-event.html) to test triggering a function using events.

To run your function with this event, use the `--event` parameter.

 ```bash
 sam local invoke TransmitterLambda --event event.json
 ```

## Deploying the application using AWS

We recommend the application is automatically deployed using a tool such as AWS CloudFormation or Terraform.

For this project, a [GitHub action](.github/workflows/deploy-branch.yaml) is used to [build the application](.github/workflows/build.yaml) and [deploy it with AWS CloudFormation](.github/workflows/deploy-to-aws.yaml).

## Logging using AWS

For this project, AWS Powertools has been configured to log events from each serverless function to AWS Cloudwatch.

## Recommended developer tools for AWS

We recommend installing the following tools:

- [VS Code](https://code.visualstudio.com/download) as a preferred IDE for its extensions with AWS
- [Serverless Application Mode (SAM) CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to build and deploy applications in AWS through the CLI rather than the Web UI
- [Node.js](https://nodejs.org/en/) to build the serverless functions in Typescript
- [Docker](https://docs.docker.com/desktop/)s
- [pre-commit](https://pre-commit.com) to run the project's recommended pre-commit hooks

### Configure recommended developer tools

- Run `pre-commit install` to install project's pre-commit hooks to improve security and write cleaner code
- Install the [AWS Toolkit extension for VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html) for a more integrated experience with AWS
  - To connect the toolkit to your AWS account, run `aws configure sso`
- Install the [SonarLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode) as a Typescript linter
  - Use Connected Mode to bind your local repository to the remote repository on SonarCloud
