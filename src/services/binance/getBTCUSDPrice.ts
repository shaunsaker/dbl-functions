import axios from 'axios';

export const getBTCUSDPrice = async (): Promise<number> => {
  return parseFloat(
    (
      await axios.get(
        'https://api.binance.com/api/v1/ticker/price?symbol=BTCUSDT',
      )
    ).data['price'],
  );
};
