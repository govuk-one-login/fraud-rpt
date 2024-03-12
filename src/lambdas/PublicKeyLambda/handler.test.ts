import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { publicKeyLambda } from "./handler";
import { KeyManager } from "../../common/classes/keys/keys";
import { LogEvents } from "../../common/enums/Log-events";
import { KeyObject } from "crypto";
import { ssmParams } from "../../common/classes/SSM/SSMParams";

jest.mock("../../common/classes/keys/keys");

jest.mock("@govuk-one-login/logging/logging", () => ({
  FraudLogger: jest.fn(() => ({
    logDebug: jest.fn(),
    logMessage: jest.fn(),
    logErrorProcessing: jest.fn(),
    metrics: {
      publishStoredMetrics: jest.fn(),
    },
  })),
  fraudTracer: {
    captureAWSv3Client: () => jest.fn(),
    captureLambdaHandler: () => jest.fn(),
    captureMethod: () => jest.fn(),
  },
}));

const mockKeyObject: KeyObject = {
  type: "public",
  export: () => Buffer.from("mockPublicKey"),
  asymmetricKeyType: "rsa",
  asymmetricKeySize: 2048,
} as unknown as KeyObject;

describe("PublicKeyLambda", () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  const mockContext = {} as Context;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(KeyManager, "getPublicKeyFromKMS").mockImplementation();
    jest.spyOn(ssmParams, "getParams").mockResolvedValue(["mockPublicKeyArn"]);
  });

  it("should have the lambda defined", () => {
    expect(publicKeyLambda).toBeDefined();
    expect(publicKeyLambda.handler).toBeDefined();
  });

  it("should call KeyManager.getPublicKeyFromKMS with ARN from SSM", async () => {
    await publicKeyLambda.handler(mockEvent, mockContext);
    expect(KeyManager.getPublicKeyFromKMS).toHaveBeenCalledWith(
      "mockPublicKeyArn",
    );
  });

  it("should return a 200 status and publicKey on successful execution", async () => {
    jest
      .spyOn(KeyManager, "getPublicKeyFromKMS")
      .mockResolvedValue(mockKeyObject);
    const response = await publicKeyLambda.handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual("bW9ja1B1YmxpY0tleQ==");
  });

  it("should return a 500 status and error when no key", async () => {
    jest
      .spyOn(KeyManager, "getPublicKeyFromKMS")
      .mockRejectedValue(new Error("Error"));
    const response = await publicKeyLambda.handler(mockEvent, mockContext);
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual(LogEvents.PublicKeyRequestFail);
  });
});
