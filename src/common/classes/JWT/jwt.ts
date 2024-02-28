import { JWSComponents } from "../../../common/interfaces/interfaces";
import { fraudTracer } from "../../logging/logging";
import { KeyManager } from "../keys/keys";

export const toBase64Url = (data: any, stringify: boolean = true) => {
  if (typeof data !== "string" && stringify) data = JSON.stringify(data);
  return Buffer.from(data).toString("base64url");
};

export class JWS {
  /**
   * Build a JWS with a fixed header, and generated signature from AWS
   * @param payloadData - the data to be converted to base64url, and set to the `payload` variable in `JWSComponents`
   * @returns a built `JWS` in a `JWSComponents` object
   */
  @fraudTracer.captureMethod()
  public static async build(payloadData: string): Promise<JWSComponents> {
    let jws = {
      header: toBase64Url({ alg: "RS256", typ: "secevent+jwt" }),
      payload: toBase64Url(payloadData),
    } as JWSComponents;

    jws.signature = await KeyManager.generateSignatureFromKMS(
      jws.header,
      jws.payload,
    );

    return jws;
  }

  /**
   * Converts a `JWSComponents` object to a string, separated by a `.`
   * @param jws The `JWSComponents` object to convert
   * @returns A string-ified version of `JWSComponents`
   */
  @fraudTracer.captureMethod()
  public static async toString(jws: JWSComponents): Promise<string> {
    return jws.header + "." + jws.payload + "." + jws.signature;
  }
}
