export function buildQrMatrix(value: string) {
  const size = 21;
  const matrix = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false)
  );
  const seed = Array.from(value).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

  const setFinder = (row: number, col: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const isBorder = x === 0 || y === 0 || x === 6 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[row + y][col + x] = isBorder || isCenter;
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (matrix[row][col]) {
        continue;
      }

      const shouldFill = (row * 11 + col * 17 + seed) % 7 < 3;
      if (shouldFill) {
        matrix[row][col] = true;
      }
    }
  }

  return matrix;
}
