import { EventTypes } from '../../../enums/eventsEnums';
import { JsonMockSET } from '../../../interfaces/interfaces';
import { MockSET } from '../../MockSET/MockSET';
import { EventMapping } from '../EventMapping';
import { BaseEvent } from './BaseEvent';

beforeEach(() => {
  jest.resetAllMocks();
});

describe('Account Purged Event', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.AccountPurged](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/account-purged': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
      },
    });
  });
});

describe('Account Credential Change Required', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[
    EventTypes.AccountCredentialChangeRequired
  ](mockSET.mockSET as JsonMockSET);

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required':
        {
          subject: {
            subject_type: 'iss_sub',
            iss: 'https://MockRP1.account.gov.uk/publicKey/',
            sub: 'RP1USER1',
          },
        },
    });
  });
});

describe('Account Disabled Event', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.AccountDisabled](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/account-disabled': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
        reason: 'Insert reason here',
      },
    });
  });
});

describe('Account Enabled', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.AccountEnabled](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/account-enabled': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
      },
    });
  });
});

describe('Credential Compromised', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.CredentialCompromise](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0);

    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/credential-compromise':
        {
          subject: {
            subject_type: 'iss_sub',
            iss: 'https://MockRP1.account.gov.uk/publicKey/',
            sub: 'RP1USER1',
          },
          credential_type: 'password',
          event_timestamp: 10,
          reason_admin: 'Admin reason',
          reason_user: 'User reason',
        },
    });
  });
});

describe('Opt In', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.OptIn](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/identifier-changed':
        {
          subject: {
            subject_type: 'iss_sub',
            iss: 'https://MockRP1.account.gov.uk/publicKey/',
            sub: 'RP1USER1',
          },
        },
    });
  });
});

describe('Opt Out Initiated', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.OptOutInitiated](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/opt-out-initiated': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
      },
    });
  });
});

describe('Opt Out Cancelled', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.OptOutCancelled](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/opt-out-cancelled': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
      },
    });
  });
});

describe('Opt Out Effective', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.OptOutEffective](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/opt-out-effective': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
      },
    });
  });
});

describe('Recovery Activated', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.RecoveryActivated](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/recovery-activated':
        {
          subject: {
            subject_type: 'iss_sub',
            iss: 'https://MockRP1.account.gov.uk/publicKey/',
            sub: 'RP1USER1',
          },
        },
    });
  });
});

describe('Recovery Information Changed', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[
    EventTypes.RecoveryInformationChanged
  ](mockSET.mockSET as JsonMockSET);

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/recovery-information-changed':
        {
          subject: {
            subject_type: 'iss_sub',
            iss: 'https://MockRP1.account.gov.uk/publicKey/',
            sub: 'RP1USER1',
          },
        },
    });
  });
});

describe('Sessions Revoked', () => {
  const mockSET = new MockSET();
  const eventObject: BaseEvent = EventMapping[EventTypes.SessionsRevoked](
    mockSET.mockSET as JsonMockSET
  );

  it('should be defined', async () => {
    expect(eventObject).toBeDefined();
    expect(eventObject).toBeInstanceOf(BaseEvent);
  });

  it('should return the correct event JSON', async () => {
    expect(await eventObject.constructEvent()).toEqual({
      'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked': {
        subject: {
          subject_type: 'iss_sub',
          iss: 'https://MockRP1.account.gov.uk/publicKey/',
          sub: 'RP1USER1',
        },
      },
    });
  });
});