import {
  KMSClient,
  GetPublicKeyCommand,
  SignCommand,
} from "@aws-sdk/client-kms";
import * as crypto from "crypto";
import { fraudTracer } from "../../logging/logging";

export class KeyManager {
  private static kmsClient: KMSClient = fraudTracer.captureAWSv3Client(
    new KMSClient({
      region: process.env.AWS_REGION,
    }),
  );

  /**
   * Using `AWS KMS`, retrieve a public key and return it
   * @returns the public key
   */
  @fraudTracer.captureMethod()
  public static async getPublicKeyFromKMS(
    keyId: string,
  ): Promise<crypto.KeyObject> {
    const getPublicKeyCommand: GetPublicKeyCommand = new GetPublicKeyCommand({
      KeyId: keyId,
    });

    const publicKeyRaw: Uint8Array = (
      await this.kmsClient.send(getPublicKeyCommand)
    ).PublicKey as Uint8Array;
    const publicKey: string = Buffer.from(publicKeyRaw).toString("base64");
    const formattedPublicKey: string =
      "-----BEGIN PUBLIC KEY-----\n" + publicKey + "\n-----END PUBLIC KEY-----";
    return crypto.createPublicKey(formattedPublicKey);
  }

  /**
   * Using `AWS KMS` and combining the `header` and `payload` with a `.`, a `JWS` signature is generated
   * @param header the `JWS` header
   * @param payload the `JWS` payload
   * @returns the generated `JWS` signature as a string
   */
  @fraudTracer.captureMethod()
  public static async generateSignatureFromKMS(
    header: string,
    payload: string,
  ): Promise<string> {
    const buffer: Buffer = Buffer.from(header + "." + payload);

    const command: SignCommand = new SignCommand({
      KeyId: process.env.JWS_SIGN_ARN,
      Message: buffer,
      MessageType: "RAW",
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
    });

    const { Signature } = await this.kmsClient.send(command);

    return Buffer.from(Signature as Uint8Array).toString("base64url");
  }
}
