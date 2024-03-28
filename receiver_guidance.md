# Sending a Security Event Token as a receiver

This page explains:

- the Shared Signals Framework (SSF) concepts you’ll need to understand as a receiver](#understanding-ssf-concepts)
- [how a Security Event Token (SET) is used](#understanding-a-set)
- [how to send a SET](#sending-a-set)

## Understanding SSF concepts

This application uses the following Shared Signals Framework (SSF) concepts:

- transmitter - the entity responsible for broadcasting events
- receiver - the entity responsible for receiving events

For the inbound flow, a RP (Relying Party) acts as the transmitter of a Security Event Token (SET) and the SSF receiver endpoint acts as the receiver.

## Understanding a SET

A SET is issued when a security subject changes state. For example, a security subject could be a user account or an HTTP session. When the SSF receiver endpoint receives a SET, it validates and interprets it. A transmitter and receiver can agree on an action upon receipt of a particular message.

The SET format extends the JSON Web Token (JWT) format, which describes claims. The claims in a SET are outlined in [RFC8417](https://datatracker.ietf.org/doc/html/rfc8417) and detail the:

- security event that occurred
- issuer
- subject
- intended audience of the event

An example SET, used when an account has been disabled:

```json
{
  "iss": "https://idp.example.com/",
  "jti": "756E69717565206964656E746966696572",
  "iat": 1508184845,
  "aud": "636C69656E745F6964",
  "events": {
    "https://schemas.openid.net/secevent/risc/event-type/account-disabled": {
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

To ensure integrity and authenticity, the claims are signed. This format is known as JSON Web Signature (JWS) and is the most common representation of the JWT. JWS has the format: `[header].[payload].[signature]`

## Sending a SET

To send a SET, you will need to contact the SSF team.
The SSF team will provide you with:

- a client ID/secret pair , to request an authentication token
- the full URL of the /authorize endpoint, to request an authentication token

You must provide the SSF team with:

- the public key that corresponds with the private key used to sign the SET, so the SET can be decoded
- the IP address that sends the request, so it can be added to their allowlist

Send the SET to the receiver as a POST request to the SSF receiver endpoint. To assemble the request:

1. Sign the SET using your private key to generate the signature. The signed SET and signature are used to create a JWS object. This will be the payload of the request.
1. Obtain an authorization token by sending a request to the /authorize endpoint with your client ID and secret. This token will be valid for 1 hour. If the /authorize endpoint is called again within the expiry time, the same token will be returned.
1. Generate the request header with an authorization token.
1. Send the request to the SSF receiver endpoint.
