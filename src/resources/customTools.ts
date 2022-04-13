export const dateFormatter = (
  array: string[],
  initial: number,
  final: number
): string => {
  const element = array[initial];
  array.splice(initial, 1);
  array.splice(final, 0, element);
  return array.join("-");
};

export const ableToRegister = (birth: number): boolean => {
  const today: number = Date.now();
  const eighteenYears: number = 567648000000;

  return today - birth >= eighteenYears;
};
