import { JWS } from "./jwt";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { mockClient } from "aws-sdk-client-mock";

const kmsMock = mockClient(KMSClient);

describe("JWS", () => {
  beforeEach(() => {
    kmsMock.reset();
  });

  it("should build a base64url JWS", async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: Buffer.from("123abc456def"),
    });
    const jws = await JWS.build("TESTER123");

    const expectedHeader = "eyJhbGciOiJSUzI1NiIsInR5cCI6InNlY2V2ZW50K2p3dCJ9";
    const expectedPayload = "VEVTVEVSMTIz";
    const expectedSignature = "MTIzYWJjNDU2ZGVm";

    expect(jws).toBeDefined();
    expect(jws.header).toBe(expectedHeader);
    expect(jws.payload).toBe(expectedPayload);
    expect(jws.signature).toBe(expectedSignature);
  });

  it("should be able to encode raw text to a base64url JWS", async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: Buffer.from("123abc456def"),
    });
    const jws = await JWS.build("TESTER123");

    const expectedHeader = '{"alg":"RS256","typ":"secevent+jwt"}';
    const expectedPayload = "TESTER123";
    const expectedSignature = "123abc456def";

    expect(jws).toBeDefined();
    expect(Buffer.from(jws.header, "base64url").toString()).toBe(
      expectedHeader,
    );
    expect(Buffer.from(jws.payload, "base64url").toString()).toBe(
      expectedPayload,
    );
    expect(Buffer.from(jws.signature, "base64url").toString()).toBe(
      expectedSignature,
    );
  });

  it("should convert JWS to string in correct order", async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: Buffer.from("123abc456def"),
    });
    const jws = await JWS.build("TESTER123");
    const jwsString = await JWS.toString(jws);

    const expectedHeader = "eyJhbGciOiJSUzI1NiIsInR5cCI6InNlY2V2ZW50K2p3dCJ9";
    const expectedPayload = "VEVTVEVSMTIz";
    const expectedSignature = "MTIzYWJjNDU2ZGVm";

    expect(jwsString).toBeDefined();
    expect(jwsString).toBe(
      expectedHeader + "." + expectedPayload + "." + expectedSignature,
    );
  });
});
