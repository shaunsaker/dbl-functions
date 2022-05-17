export const floatToIndex = ({
  float,
  count,
}: {
  float: number;
  count: number;
}): number => {
  return Math.floor(float * count);
};
