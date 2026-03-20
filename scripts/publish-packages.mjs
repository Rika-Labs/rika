#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const dryRun = process.argv.includes("--dry-run");
const packagesDir = join(process.cwd(), "packages");
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name);

function run(command) {
	console.log(`$ ${command}`);
	execSync(command, { stdio: "inherit" });
}

for (const dir of packageDirs) {
	const packagePath = join(packagesDir, dir, "package.json");
	const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

	if (pkg.private) {
		continue;
	}

	const dryRunFlag = dryRun ? " --dry-run" : "";
	run(`bun publish --cwd ${join(packagesDir, dir)} --access public${dryRunFlag}`);
}
