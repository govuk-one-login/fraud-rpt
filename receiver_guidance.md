# Sending a Security Event Token as a receiver

This page explains:

- [the Shared Signals Framework (SSF)](#understanding-ssf-concepts) concepts you’ll need to understand as a receiver (#understanding-ssf-concepts)
- [how a Security Event Token (SET) is used](#understanding-a-set)
- [how to send a SET](#sending-a-set)

## Understanding SSF concepts

This application uses the following Shared Signals Framework (SSF) concepts:

- transmitter - the entity responsible for broadcasting events
- receiver - the entity responsible for receiving events

A Relying Party (RP) is the transmitter of a Security Event Token (SET) and the SSF receiver endpoint is the receiver.

## Understanding a SET

A receiver issues a SET when a security subject changes state. For example, a security subject could be a user account or an HTTP session. When the SSF receiver endpoint receives a SET, the SSF receiver validates and interprets the SET. A transmitter and receiver can agree on an action upon receipt of a particular message.

The SET format extends the JSON Web Token (JWT) format, which describes claims. The claims in a SET are outlined in [RFC 8417](https://datatracker.ietf.org/doc/html/rfc8417) and detail the:

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

The claims are signed to ensure integrity and authenticity. This format is known as JSON Web Signature (JWS) and is the most common representation of the JWT. JWS has the format: `{HEADER}.{PAYLOAD}.{SIGNATURE}`

## Sending a SET

To send a SET, you need to contact the SSF team.

The SSF team will send you:

- a client ID/secret pair , to request an authentication token
- the full URL of the /authorize endpoint, to request an authentication token

You must send the SSF team:

- the public key that corresponds with the private key used to sign the SET, so the SSF team can read the SET
- the IP address that sends the request, so it can be added to their allowlist

Send the SET to the receiver as a `POST` request to the SSF receiver endpoint. To assemble the request:

1. Sign the SET using your private key to generate the signature. The signed SET and signature are used to create a JWS object. This will be the request payload.
1. Get an authorisation token by sending a request to the /authorize endpoint with your client ID and secret. This token will be valid for 1 hour. If you call the /authorize endpoint again within the expiry time, the endpoint will return the same token.
1. Generate the request header with an authorisation token.
1. Send the request to the SSF receiver endpoint.
