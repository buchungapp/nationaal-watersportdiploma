SHELL:=$(PREFIX)/bin/sh

build: \
	generated/nwd-api \

	pnpm install

rebuild: \
	clean build

clean: \

	rm --recursive --force generated/nwd-api \

out/%: specifications/%.yaml
	pnpx oa42-generator package $^ \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

generated/%: out/%
	rm -rf $@
	mv $< $@

.PHONY: \
	build \
	rebuild \
	clean \
