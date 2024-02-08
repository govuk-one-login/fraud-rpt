import * as crypto from "crypto";
import { KeyManager } from "./keys";
import { KMSClient, GetPublicKeyCommand } from "@aws-sdk/client-kms";

jest.mock("@aws-sdk/client-kms", () => {
  return {
    KMSClient: jest.fn(),
    GetPublicKeyCommand: jest.fn(),
  };
});

jest.mock("crypto", () => {
  const originalCrypto = jest.requireActual("crypto");
  return {
    ...originalCrypto,
    createPublicKey: jest.fn(),
  };
});

describe("KeyManager", () => {
  let sendMock: jest.Mock;
  const keyId = "mockPublicKeyId";

  beforeEach(() => {
    sendMock = jest.fn();

    (KMSClient as jest.Mock).mockImplementation(() => {
      return { send: sendMock };
    });

    (GetPublicKeyCommand as unknown as jest.Mock).mockImplementation((args) => {
      return { ...args };
    });

    process.env.AWS_REGION = "mock-region";

    (KeyManager as any).kmsClient = new KMSClient({
      region: process.env.AWS_REGION,
    });
  });

  describe("getPublicKeyFromKMS", () => {
    it("should retrieve and format public key from KMS", async () => {
      // Arrange
      const mockPublicKeyResponse = {
        PublicKey: new Uint8Array([1, 2, 3]),
      };
      sendMock.mockResolvedValue(mockPublicKeyResponse);
      const mockFormattedKey =
        "-----BEGIN PUBLIC KEY-----\nAQID\n-----END PUBLIC KEY-----";
      (crypto.createPublicKey as jest.Mock).mockReturnValue(
        "mocked_crypto_key",
      );

      // Act
      const publicKey = await KeyManager.getPublicKeyFromKMS(keyId);

      // Assert
      expect(publicKey).toBe("mocked_crypto_key");
      expect(KMSClient).toHaveBeenCalledWith({
        region: process.env.AWS_REGION,
      });
      expect(GetPublicKeyCommand).toHaveBeenCalledWith({ KeyId: keyId });
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ KeyId: keyId }),
      );
      expect(crypto.createPublicKey).toHaveBeenCalledWith(mockFormattedKey);
    });

    it("should throw an error if KMS retrieval fails", async () => {
      // Arrange
      sendMock.mockRejectedValue(new Error("KMS Error"));

      // Act and Assert
      await expect(KeyManager.getPublicKeyFromKMS(keyId)).rejects.toThrowError(
        "KMS Error",
      );
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ KeyId: keyId }),
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.AWS_REGION;
  });
});
