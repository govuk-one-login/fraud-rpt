# Fraud RPT
The Relying Party Transmitter


## 1.
---
## 2. 
---

## 3. Implementation
---
(insert picture)
### 3.1. Generator Lambda
---
#### 3.1.1. Summary
The Generator Lambda generates messsages based on configuration parameters to pass to the [Transmitter Lambda](#Transmitter-Lambda) using SQS.

#### 3.1.2. Detailed Description
The Generator Lambda is triggered by an API Gateway event containing configuration parameters which are parsed using the [ConfigParams](#ConfigParams) class. 

The Lambda then does a Healthcheck to ensure the SSF Endpoint can be reached before generating any messages. 

It then generates messages using the `ConfigParams` values and sends them in batches of 10 messages to the Transmitter Lambda using AWS `Simple Queue Service`. Any messages that fail to send are added to the dead letter queue. 

When the Lambda finishes running, the number of failed messages are counted and that amount of messages are regenerated and sent by the Lambda. This will be repeated up to 5 times. 

The Lambda will then report the number of successful messages sent, failed messages and the details of the ConfigParams it used.


### 3.2. Transmitter Lambda
---
#### 3.2.1. Summary
The Transmitter Lambda receives messages from the [Generator Lambda](#Generator-Lambda) via SQS.   It then makes POST requests to the `SSF Endpoint`.

#### 3.2.2. Detailed Description
(to be written)


### 3.3. Public Key Lambda
---
#### 3.3.1. Summary
The Public Key Lambda retrieves a Public Key from the AWS `KMS` and returns this key for SET Verification.
####3.3.2. Detailed Description
The Lambda is triggered by an API Gateway Request and the `PublicKeyARN` is fetched from `SSMParams`.

The public key is retreived from KMS using the `KeyManager` class and exported in `PEM` format.

The public key data is exported and converted to base64 format and a response is created with a 200 status code and the public key in the body.

Successful retrieval of the public key is logged by the `FraudLogger`. Any errors in any step are also logged and a 500 status code and an error message is returned in case of failure.
