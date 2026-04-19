export const binarySearch = (sortedArray: number[], target: number) => {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const middle = Math.floor((high + low) / 2);
    const guess = sortedArray[middle] as number;

    if (guess === target) return middle;

    if (guess > target) {
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }

  return -1;
};
