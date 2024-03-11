SHELL:=$(PREFIX)/bin/sh

build: \
	generated/nwd-api \

rebuild: \
	clean build

clean: \

	rm --recursive --force generated/nwd-api \

generated/%: specifications/%.yaml
	pnpm --package oa42-generator@0.9.4 dlx oa42-generator package $^ \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

	pnpm --filter {$@} install --no-lockfile
	pnpm --filter {$@} build

.PHONY: \
	build \
	rebuild \
	clean \
