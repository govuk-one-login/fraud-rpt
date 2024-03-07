export const MockRP = {
  RP1: {
    publicKeyURL: "https://MockRP1.account.gov.uk/publicKey/",
    userPairwiseIDs: {
      user1: "RP1USER1",
      user2: "RP1USER2",
      user3: "RP1USER3",
    },
  },
};

export const MockDynamoDataMap = Object.values(MockRP).flatMap((RP) => {
  return Object.values(RP.userPairwiseIDs).map((pairwiseId, index) => {
    return {
      commonSubjectId: `USER${index + 1}`,
      clientId: RP.publicKeyURL,
      clientPairwiseIdLookup: `${RP.publicKeyURL}::${pairwiseId}`,
      pairwiseId,
    };
  });
});
