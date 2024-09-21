import { parentPort, workerData } from "node:worker_threads";
import { addRandomTile, hasValidMove, moveGrid } from "./helpers";

const randomRuns = (
	grid: bigint,
	runs: number,
	move: number,
): [number, number] => {
	let score = 0;
	for (let i = 0; i < runs; i++) {
		score += randomRun(grid);
	}
	return [score, move];
};

const randomRun = (grid: bigint): number => {
	let score = 0;
	while (true) {
		if (!hasValidMove(grid)) break;
		const res = moveGrid(grid, Math.floor(Math.random() * 4));
		grid = addRandomTile(res[0]);
		score += res[1];
	}
	return score;
};

const result = randomRuns(workerData[0], workerData[1], workerData[2]);
parentPort?.postMessage(result);
