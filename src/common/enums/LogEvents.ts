export enum LogEvents {
  StartedProcessing = "Started Processing",
  SuccessfullyProcessed = "Successfully Processed",
  ErrorProcessing = "Error Processing",
  FullSETBatchGenerated = "SET Batch Generation Succesful",
  FailedSETBatchGenerated = "SET Batch Generation Failed",
  PartialSETBatchGenerated = "SET Batch Generation Partially Successful",
  JWSSignSuccess = "Successfully signed JWS",
  JWEEncryptSuccess = "Successfully encrypted JWE",
  PublicKeyRequested = "Public Key requested",
  PublicKeyReturned = "Public Key returned successfully",
  PublicKeyRequestFail = "Failed to get Public Key",
}
