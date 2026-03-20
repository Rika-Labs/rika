#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const bumpType = process.argv[2];
const explicitVersion = process.argv[3];

if (!["patch", "minor", "major", "set"].includes(bumpType)) {
	console.error("Usage: node scripts/bump-versions.mjs <patch|minor|major|set> [version]");
	process.exit(1);
}

if (bumpType === "set" && !explicitVersion) {
	console.error("Usage: node scripts/bump-versions.mjs set <version>");
	process.exit(1);
}

function parseVersion(version) {
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
	if (!match) {
		throw new Error(`Invalid version: ${version}`);
	}

	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	};
}

function bumpVersion(version, type) {
	if (type === "set") {
		parseVersion(explicitVersion);
		return explicitVersion;
	}

	const parsed = parseVersion(version);
	if (type === "patch") {
		return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
	}
	if (type === "minor") {
		return `${parsed.major}.${parsed.minor + 1}.0`;
	}
	return `${parsed.major + 1}.0.0`;
}

function updatePackageVersion(path, version) {
	const pkg = JSON.parse(readFileSync(path, "utf8"));
	pkg.version = version;
	writeFileSync(path, `${JSON.stringify(pkg, null, "\t")}\n`);
}

const rootPackagePath = join(process.cwd(), "package.json");
const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf8"));
const nextVersion = bumpVersion(rootPackage.version, bumpType);

updatePackageVersion(rootPackagePath, nextVersion);

const packagesDir = join(process.cwd(), "packages");
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name);

for (const dir of packageDirs) {
	updatePackageVersion(join(packagesDir, dir, "package.json"), nextVersion);
}

console.log(`Updated root and packages/* to ${nextVersion}`);
