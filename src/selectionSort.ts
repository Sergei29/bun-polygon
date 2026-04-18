const getMin = (arr: number[]) => {
  let minIndex = 0;
  let minValue = arr[0] as number;

  for (let index = 1; index < arr.length; index++) {
    const element = arr[index] as number;
    if (element < minValue) {
      minIndex = index;
      minValue = element;
    }
  }

  return { minIndex, minValue };
};

// DID not WORK - to fix
export const selectionSort = (array: number[]) => {
  const sorted: number[] = [];

  for (let index = 0; index < array.length; index++) {
    const { minIndex, minValue } = getMin(array);
    sorted.push(minValue);
    array.splice(minIndex);
  }

  return sorted;
};

// worked fine
export const selectionSortRecursive = (
  arr: number[],
  sorted: number[] = [],
): number[] => {
  if (arr.length === 0) {
    return sorted;
  }
  const { minIndex, minValue } = getMin(arr);
  sorted.push(minValue);
  const newArr = arr.slice(0, minIndex).concat(arr.slice(minIndex + 1));

  return selectionSortRecursive(newArr, sorted);
};
