#!/usr/bin/env bash
# build.sh — Build the ktor-draw-steel fat JAR with the React frontend bundled in.
#
# Why two buildFatJar passes?
#   Vite emits the frontend into build/resources/main/static/app, but Gradle's
#   processResources task performs stale-output cleanup on build/resources/main
#   and deletes that directory the first time it runs. The reliable sequence is:
#     1. buildFatJar      -> runs processResources once, compiles, packages
#     2. bun run build    -> writes the frontend into build/resources/main/static/app
#     3. buildFatJar       -> processResources is now UP-TO-DATE (skipped, so no
#                            cleanup); shadowJar repackages WITH the frontend.
#
# Output: build/libs/ktor-draw-steel-all.jar
set -euo pipefail
cd "$(dirname "$0")"

# Bun is installed to ~/.bun/bin by the official installer; make sure it's found.
export PATH="$HOME/.bun/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
	echo "error: 'bun' not found. Install it with: curl -fsSL https://bun.sh/install | bash" >&2
	exit 1
fi

echo "==> Installing frontend dependencies (bun install)"
bun install

echo "==> Pass 1: building fat JAR (compiles backend, primes build/resources)"
./gradlew buildFatJar --console=plain

echo "==> Building frontend (vite -> build/resources/main/static/app)"
bun run build

echo "==> Pass 2: repackaging fat JAR with the frontend bundled in"
./gradlew buildFatJar --console=plain

JAR="build/libs/ktor-draw-steel-all.jar"
if unzip -l "$JAR" 2>/dev/null | grep -q "static/app/index.html"; then
	echo "==> OK: frontend is bundled in $JAR"
else
	echo "warning: frontend not found in $JAR (static/app missing)" >&2
	exit 1
fi

echo
echo "Build complete: $JAR"
echo "Run it with:    java -jar $JAR     (serves http://localhost:8080)"
