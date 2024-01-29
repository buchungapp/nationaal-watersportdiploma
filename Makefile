SHELL:=$(PREFIX)/bin/sh

build: \
	generated/nwd-api \

	npm install

rebuild: \
	clean build

clean: \

	rm --recursive --force generated/nwd-api \

generated/%: specifications/%.yaml
	npx --yes oa42-generator package $^ \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

	npm install --workspace $(notdir $(basename $@))
	npm run build --workspace $(notdir $(basename $@))


.PHONY: \
	build \
	rebuild \
	clean \
