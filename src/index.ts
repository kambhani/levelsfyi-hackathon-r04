import express from "express";
import cors from "cors";
import { getExponent, moveGrid, setCell } from "./helpers";
import { Worker } from "node:worker_threads";

const app = express();
app.use(cors());

const RUNS = 1000; // Number of runs per potential move direction

app.get("/", async (req, res) => {
	try {
		const state = (req.query.state as string | undefined)?.split(",") ?? [""];
		let grid = (1n << 64n) - 1n;
		for (let i = 0; i < 4; i++) {
			grid = setCell(grid, i * 4, getExponent(Number(state[i])));
			grid = setCell(grid, i * 4 + 1, getExponent(Number(state[i + 4])));
			grid = setCell(grid, i * 4 + 2, getExponent(Number(state[i + 8])));
			grid = setCell(grid, i * 4 + 3, getExponent(Number(state[i + 12])));
		}

		const promises = [];
		for (let i = 0; i < 4; i++) {
			const newGrid = moveGrid(grid, i);
			if (newGrid[0] !== grid) {
				promises.push(workerPromise([newGrid[0], RUNS, i]));
			}
		}

		// @ts-expect-error I can guarantee that the results will look like [score, move][]
		Promise.all(promises).then((results: [number, number][]) => {
			let maxIndex = 0;
			for (let i = 0; i < results.length; i++) {
				if (results[i][0] > results[maxIndex][0]) maxIndex = i;
			}
			res.send(`${results[maxIndex][1]}`);
			return;
		});
	} catch (err) {
		res.send(`${Math.floor(Math.random() * 4)}`);
	}
});

const workerPromise = async (data: any) => {
	return new Promise((resolve, reject) => {
		const worker = new Worker("./src/runs.ts", { workerData: data });

		worker.on("message", (result) => resolve(result));
		worker.on("error", reject);
		worker.on("exit", (code) => {
			if (code !== 0)
				reject(new Error(`Worker stopped with exit code ${code}`));
		});
	});
};

app.listen(process.env.PORT ?? 5000);
