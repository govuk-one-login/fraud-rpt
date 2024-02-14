import { JsonMockSET } from '../../../interfaces/interfaces';
import { issSubEventURIs } from '../../../enums/eventsEnums';

export class BaseEvent {
  iss: string;
  sub: string;
  toe?: number;
  eventURI: string;
  eventType: keyof typeof issSubEventURIs;

  constructor(eventType: keyof typeof issSubEventURIs, SET: JsonMockSET) {
    this.iss = SET.iss;
    this.sub = SET.sub;
    this.toe = SET.toe;
    this.eventURI = issSubEventURIs[eventType];
    this.eventType = eventType;
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
      },
    };
  }
}