export const MockRPs = {
    RP1: {
      publicKeyURL: 'https://MockRP1.account.gov.uk/publicKey/',
      userPairwiseIDs: {
        user1: 'RP1USER1',
        user2: 'RP1USER2',
        user3: 'RP1USER3',
      },
    },
    RP2: {
      publicKeyURL: 'https://MockRP2.account.gov.uk/publicKey/',
      userPairwiseIDs: {
        user1: 'RP2USER1',
        user2: 'RP2USER2',
        user3: 'RP2USER3',
      },
    },
    RP3: {
      publicKeyURL: 'https://MockRP3.account.gov.uk/publicKey/',
      userPairwiseIDs: {
        user1: 'RP3USER1',
        user2: 'RP3USER2',
        user3: 'RP3USER3',
      },
    },
  };
  
  export const MockDynamoDataMap = Object.values(MockRPs).flatMap((RP) => {
    return Object.values(RP.userPairwiseIDs).map((pairwiseId, index) => {
      return {
        commonSubjectId: `USER${index + 1}`,
        clientId: RP.publicKeyURL,
        clientPairwiseIdLookup: `${RP.publicKeyURL}::${pairwiseId}`,
        pairwiseId,
      };
    });
  });