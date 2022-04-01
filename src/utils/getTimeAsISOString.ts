import * as moment from 'moment';

export const getTimeAsISOString = (time?: moment.MomentInput): string =>
  moment(time).toISOString();
