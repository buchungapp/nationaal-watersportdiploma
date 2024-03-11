SHELL:=$(PREFIX)/bin/sh

build: \
	generated/api \

rebuild: \
	clean build

clean: \

	rm --recursive --force generated/api \

generated/%: specifications/%.yaml
	pnpm dlx oa42-generator package $^ \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

	pnpm --filter {$@} install --no-frozen-lockfile
	pnpm --filter {$@} build

.PHONY: \
	build \
	rebuild \
	clean \
