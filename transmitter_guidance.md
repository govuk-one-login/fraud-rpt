# Sharing security data as a transmitter

This page explains:

- [the Shared Signals Framework (SSF) concepts](#understanding-ssf-concepts) you’ll need to understand as a receiver
- [how a Security Event Token (SET) is used](#understanding-a-set)
- [how to send a message](#sending-a-message)

## Understanding SSF concepts

This application uses the following Shared Signals Framework (SSF) concepts:

- transmitter - the entity responsible for broadcasting events
- receiver - the entity responsible for receiving events
- signals - the messages sent between a transmitter and receiver containing security data, signals are sent in the format of a [Security Event Token](https://datatracker.ietf.org/doc/html/rfc8417) (SET)

The ‘inbound flow’ is when a Relying Party (RP) sends a SET to the SSF. In an inbound flow:

- RP is the transmitter
- SSF is the receiver

The ‘outbound flow’ is when the SSF sends a SET to the RP. In an outbound flow:

- RP is the receiver
- SSF is the transmitter

## Understanding a SET

A receiver issues a SET when a security subject, such as a user account or HTTP session, changes state. When the shared signals receiver endpoint receives a SET, the receiver validates the SET, checks the signature and passes it to the GOV.UK One Login auditing system.

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

The claims are signed to ensure integrity and authenticity. The format of the signed payload is known as JSON Web Signature (JWS) Compact Serialization and is the most common representation of the JWT. JWS Compact Serialisation has the format: `{HEADER}.{PAYLOAD}.{SIGNATURE}`

## Sending a message

To send a message, you will first need to contact the GOV.UK shared signals team.

The shared signals team will send you:

- a client ID/secret pair , to request an authentication token
- the full URL of the `/authorize` endpoint, to request an authentication token
- the full URL of the inbound SSF framework endpoint to send the message

You must send the shared signals team:

- the public key that corresponds with the private key used to sign the SET, so the SSF team can check the signature of the SET
- the IP address that sends the request, so it can be added to their allowlist

Send the message to the receiver as a `POST` request to the shared signals receiver endpoint.

- The payload of the `POST` request is a signed SET, using a private key to generate the signature. This is a JSON Web Token (JWT) object in the JSON Web Signature (JWS) Compact Serialisation format. The receiver verifies the signature using the corresponding public key.
- The header of the `POST` request is authorisation token. You should get an authorisation token by sending a request to the `/authorize` endpoint with the RP’s client ID and secret. This token will be valid for 1 hour. If you call the `/authorize` endpoint again within the expiry time, the endpoint will return the same token.
