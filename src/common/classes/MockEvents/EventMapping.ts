import { EventTypes } from '../../enums/eventsEnums';
import { JsonMockSET } from '../../interfaces/interfaces';
import { AccountDisabledEvent } from './events/AccountDisabledEvent';
import { BaseEvent } from './events/BaseEvent';
import { CredentialCompromiseEvent } from './events/CredentialCompromiseEvent';

export const EventMapping: Record<
  EventTypes,
  (message: JsonMockSET) => BaseEvent
> = {
  [EventTypes.AccountPurged]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.AccountPurged, message),
  [EventTypes.AccountDisabled]: (message: JsonMockSET) =>
    new AccountDisabledEvent(message),
  [EventTypes.AccountEnabled]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.AccountEnabled, message),
  [EventTypes.AccountCredentialChangeRequired]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.AccountCredentialChangeRequired, message),
  [EventTypes.CredentialCompromise]: (message: JsonMockSET) =>
    new CredentialCompromiseEvent(message),
  [EventTypes.OptIn]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.OptIn, message),
  [EventTypes.OptOutInitiated]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.OptOutInitiated, message),
  [EventTypes.OptOutCancelled]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.OptOutCancelled, message),
  [EventTypes.OptOutEffective]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.OptOutEffective, message),
  [EventTypes.RecoveryActivated]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.RecoveryActivated, message),
  [EventTypes.RecoveryInformationChanged]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.RecoveryInformationChanged, message),
  [EventTypes.SessionsRevoked]: (message: JsonMockSET) =>
    new BaseEvent(EventTypes.SessionsRevoked, message),
};