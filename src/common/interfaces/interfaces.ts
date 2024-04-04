import { CipherGCM } from "crypto";

export interface JWSComponents {
  header: string;
  payload: string;
  signature: string;
}

export interface JWEComponents {
  header: string;
  cek: string;
  iv: string;
  payload: string;
  authTag: string;
}

export interface CipherCollection {
  cek: Buffer;
  iv: Buffer;
  cipher: CipherGCM;
}

export interface JsonMockSET {
  iss: string; // Issuer: A string identifying the issuer of the SET, ie. the RP. It is also going to be the endpoint from which the RPs public key can be obtained.
  jti: string; // A unique identifier for the SET. May be used by clients to check if a SET has already been received.
  iat: number; // Issued At Time: The issued at claim contains a value representing when the SET was issued
  aud: string; // The audience ID for the SET, as far as we are concerned in shared signals this should be our ID. If not we drop the message.
  events: string; // A set of event statements describing a single logical event that has occured about a security subject.
}

export interface ErroneousJsonMockSET {
  iss?: any;
  jti?: any;
  iat?: any;
  aud?: any;
  events?: any;
}

export interface ActivationApiConfigParams {
  numMessages: number;
  rpSplit: Array<number>;
  eventTypeSplit: Array<number>;
  errorRate: number;
  inboundEndpointURL: string;
}

export interface GeneratorResponseBody {
  messagesSent: number;
  sendAttempts: number;
  unsentMessages: number;
  totalFailedMessageAttempts: number;
  configParams: ActivationApiConfigParams;
}

export interface SQSRecievedRecordBody {
  SET: JsonMockSET;
  destination: string;
}

export interface FailedMessageJson {
  itemIdentifier: string;
}
export interface BatchItemFailuresJson {
  batchItemFailures?: Array<FailedMessageJson>;
}

export interface TokenInfo {
  access_token: string;
  expires_in: number;
}

export interface PublicKeyLambdaResponse {
  statusCode: number;
  body: any;
}
