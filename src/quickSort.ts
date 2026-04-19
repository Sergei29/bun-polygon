const sortArrayOfTwo = (tuple: [number, number]) => {
  const [one, two] = tuple;

  if (one <= two) {
    return tuple;
  }
  return [two, one];
};

// by selecting pivot from the first element each time
export const quickSort = (array: number[]): number[] => {
  if (array.length < 2) return array;

  const pivot = array[0] as number;
  const rest = array.slice(1);

  const lesser = rest.reduce((acc: number[], current) => {
    if (current <= pivot) {
      acc.push(current);
    }
    return acc;
  }, []);
  const greater = rest.reduce((acc: number[], current) => {
    if (current > pivot) {
      acc.push(current);
    }
    return acc;
  }, []);

  return quickSort(lesser).concat(pivot).concat(quickSort(greater));
};

// by selecting pivot from the middle element each time
export const quickSort2 = (array: number[]): number[] => {
  if (array.length < 2) return array;

  const mid = Math.floor((array.length - 1) / 2);
  const pivot = array[mid] as number;
  const rest = array.slice(0, mid).concat(array.slice(mid + 1));

  const lesser = rest.reduce((acc: number[], current) => {
    if (current <= pivot) {
      acc.push(current);
    }
    return acc;
  }, []);
  const greater = rest.reduce((acc: number[], current) => {
    if (current > pivot) {
      acc.push(current);
    }
    return acc;
  }, []);

  return quickSort(lesser).concat(pivot).concat(quickSort(greater));
};
