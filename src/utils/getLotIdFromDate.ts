import { Moment } from 'moment';
import { LotId } from '../lots/models';

export const getLotIdFromDate = (date: Moment): LotId =>
  date.format('YYYY-MM-DD');
