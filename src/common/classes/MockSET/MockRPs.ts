export const MockRPs = {
  RP1: {
    issuer: "https://MockRP1.account.gov.uk/",
    userPairwiseIDs: {
      user1: "uri:fdc:gov.uk:2022:RP1_User1_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      user2: "uri:fdc:gov.uk:2022:RP1_User2_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      user3: "uri:fdc:gov.uk:2022:RP1_User3_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
    },
  },
  RP2: {
    issuer: "https://MockRP2.account.gov.uk/",
    userPairwiseIDs: {
      user1: "uri:fdc:gov.uk:2022:RP2_User1_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      user2: "uri:fdc:gov.uk:2022:RP2_User2_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      user3: "uri:fdc:gov.uk:2022:RP2_User3_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
    },
  },
  RP3: {
    issuer: "https://MockRP3.account.gov.uk/",
    userPairwiseIDs: {
      user1: "uri:fdc:gov.uk:2022:RP3_User1_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      user2: "uri:fdc:gov.uk:2022:RP3_User2_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      user3: "uri:fdc:gov.uk:2022:RP3_User3_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
    },
  },
};

export const MockDynamoDataMap = Object.values(MockRPs).flatMap((RP) => {
  return Object.values(RP.userPairwiseIDs).map((pairwiseId, index) => {
    return {
      commonSubjectId: `USER${index + 1}`,
      clientId: RP.issuer,
      clientPairwiseIdLookup: `${RP.issuer}::${pairwiseId}`,
      pairwiseId,
    };
  });
});
