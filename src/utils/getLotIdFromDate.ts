import { Moment } from 'moment';
import { LotId } from '../store/lots/models';

export const getLotIdFromDate = (date: Moment): LotId =>
  date.format('YYYY-MM-DD');
