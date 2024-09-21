const CELL_BITS = 4n; // 4 bits per cell
const GRID_SIZE = 16; // 16 cells in total (4x4 grid)

export const setCell = (
	grid: bigint,
	cellIndex: number,
	value: number,
): bigint => {
	const shiftAmount = BigInt(cellIndex) * CELL_BITS; // Calculate shift based on cell index
	const mask = ~(0xfn << shiftAmount); // Mask to clear the 4 bits at the position

	// Clear the 4 bits and set the new value
	return (grid & mask) | (BigInt(value) << shiftAmount);
};

// Function to get a value from the grid (4x4)
export const getCell = (grid: bigint, cellIndex: number): number => {
	const shiftAmount = BigInt(cellIndex) * CELL_BITS; // Calculate shift based on cell index
	return Number((grid >> shiftAmount) & 0xfn); // Shift and mask to get the 4-bit value
};

export const getExponent = (powerOfTwo: number): number => {
	let exponent = 0;
	while (powerOfTwo > 1) {
		powerOfTwo >>= 1; // Shift right by 1 bit (equivalent to dividing by 2)
		exponent++;
	}
	return exponent;
};

export const moveAndMergeLine = (line: number[]): [number[], number] => {
	const nonEmptyTiles = line.filter((value) => value !== 0); // Remove all zeroes
	const result: number[] = [];

	let i = 0;
	let score = 0;
	while (i < nonEmptyTiles.length) {
		// If the current tile is the same as the next tile, merge them
		if (
			i + 1 < nonEmptyTiles.length &&
			nonEmptyTiles[i] === nonEmptyTiles[i + 1]
		) {
			result.push(nonEmptyTiles[i] + 1);
			score += 1 << (nonEmptyTiles[i] * 2);
			i += 2; // Skip the next tile
		} else {
			result.push(nonEmptyTiles[i]);
			i++;
		}
	}

	// Fill the rest of the row with zeroes
	while (result.length < 4) {
		result.push(0);
	}

	return [result, score];
};

// Extract a row from the grid (4 cells at a time)
export const getRow = (grid: bigint, rowIndex: number): number[] => {
	const row: number[] = [];
	for (let i = 0; i < 4; i++) {
		row.push(Number(getCell(grid, rowIndex * 4 + i)));
	}
	return row;
};

// Set a row in the grid (4 cells at a time)
export const setRow = (
	grid: bigint,
	rowIndex: number,
	row: number[],
): bigint => {
	for (let i = 0; i < 4; i++) {
		grid = setCell(grid, rowIndex * 4 + i, row[i]);
	}
	return grid;
};

// Extract a column from the grid (vertical extraction)
export const getColumn = (grid: bigint, colIndex: number): number[] => {
	const col: number[] = [];
	for (let i = 0; i < 4; i++) {
		col.push(Number(getCell(grid, i * 4 + colIndex)));
	}
	return col;
};

// Set a column in the grid (vertical setting)
export const setColumn = (
	grid: bigint,
	colIndex: number,
	column: number[],
): bigint => {
	for (let i = 0; i < 4; i++) {
		grid = setCell(grid, i * 4 + colIndex, column[i]);
	}
	return grid;
};

// Move Left
export const moveLeft = (grid: bigint): [bigint, number] => {
	let score = 0;
	for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
		const row = getRow(grid, rowIndex);
		const newRow = moveAndMergeLine(row);
		score += newRow[1];
		grid = setRow(grid, rowIndex, newRow[0]);
	}
	return [grid, score];
};

// Move Right
export const moveRight = (grid: bigint): [bigint, number] => {
	let score = 0;
	for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
		const row = getRow(grid, rowIndex);
		const newRow = moveAndMergeLine(row.reverse());
		score += newRow[1];
		grid = setRow(grid, rowIndex, newRow[0].reverse());
	}
	return [grid, score];
};

// Move Up
export const moveUp = (grid: bigint): [bigint, number] => {
	let score = 0;
	for (let colIndex = 0; colIndex < 4; colIndex++) {
		const column = getColumn(grid, colIndex);
		const newColumn = moveAndMergeLine(column);
		score += newColumn[1];
		grid = setColumn(grid, colIndex, newColumn[0]);
	}
	return [grid, score];
};

// Move Down
export const moveDown = (grid: bigint): [bigint, number] => {
	let score = 0;
	for (let colIndex = 0; colIndex < 4; colIndex++) {
		const column = getColumn(grid, colIndex);
		const newColumn = moveAndMergeLine(column.reverse());
		score += newColumn[1];
		grid = setColumn(grid, colIndex, newColumn[0].reverse());
	}
	return [grid, score];
};

// Move in a specific direction based on the number value
export const moveGrid = (grid: bigint, direction: number): [bigint, number] => {
	switch (direction) {
		case 0:
			return moveUp(grid);
		case 1:
			return moveRight(grid);
		case 2:
			return moveDown(grid);
		case 3:
			return moveLeft(grid);
		default:
			return [-1n, -1];
	}
};

export const getEmptyCells = (grid: bigint): number[] => {
	const emptyCells: number[] = [];
	for (let i = 0; i < 16; i++) {
		if (getCell(grid, i) === 0) {
			emptyCells.push(i);
		}
	}
	return emptyCells;
};

export const getRandomEmptyCell = (emptyCells: number[]): number | null => {
	if (emptyCells.length === 0) return null; // No empty cells, so no move possible
	const randomIndex = Math.floor(Math.random() * emptyCells.length);
	return emptyCells[randomIndex];
};

export const addRandomTile = (grid: bigint): bigint => {
	const emptyCells = getEmptyCells(grid); // Get all empty cells
	const cellIndex = getRandomEmptyCell(emptyCells); // Randomly select one

	if (cellIndex === null) {
		return grid; // No empty cells, return unchanged grid
	}

	const tileValue = Math.random() < 0.9 ? 2 : 4; // Randomly choose 2 or 4
	return setCell(grid, cellIndex, tileValue); // Update the grid with the new value
};

export const hasAdjacentMerges = (grid: bigint): boolean => {
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			const index = i * 4 + j;
			const currentValue = getCell(grid, index);

			// Check right
			if (j < 3 && currentValue === getCell(grid, index + 1)) {
				return true;
			}

			// Check down
			if (i < 3 && currentValue === getCell(grid, index + 4)) {
				return true;
			}
		}
	}
	return false;
};

export const hasValidMove = (grid: bigint): boolean => {
	return hasAdjacentMerges(grid) || getEmptyCells(grid).length > 0;
};

export const gridString = (grid: bigint): string => {
	const rows: string[] = [];

	for (let i = 0; i < 4; i++) {
		const rowValues: number[] = [];
		for (let j = 0; j < 4; j++) {
			const index = i * 4 + j; // Calculate the index for the cell
			const cellValue = getCell(grid, index); // Get the cell value
			rowValues.push(Number(cellValue)); // Convert bigint to number for display
		}
		// Join the row values with a separator, e.g., space
		rows.push(rowValues.join(" | "));
	}

	// Join all rows with a newline character for a grid display
	return rows.join("\n");
};
