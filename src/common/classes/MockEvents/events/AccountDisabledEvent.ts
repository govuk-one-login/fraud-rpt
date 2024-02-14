import { EventTypes } from '../../../enums/eventsEnums';
import { JsonMockSET } from '../../../interfaces/interfaces';
import { BaseEvent } from './BaseEvent';

export class AccountDisabledEvent extends BaseEvent {
  constructor(mockSet: JsonMockSET) {
    super(EventTypes.AccountDisabled, mockSet);
  }

  /**
   * Constructs the JSON for the SET event field based off current values
   *
   * @returns the event Json
   */
  public async constructEvent() {
    return {
      [this.eventURI]: {
        subject: {
          subject_type: 'iss_sub',
          iss: this.iss,
          sub: this.sub,
        },
        reason: 'Insert reason here',
      },
    };
  }
}