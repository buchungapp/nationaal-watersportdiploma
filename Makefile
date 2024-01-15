SHELL:=$(PREFIX)/bin/sh

build: \
	generated/nwd-api \

	npm install

out/%: specifications/%.yaml
	npx --yes oa42-generator package $^ \
		--package-directory $@ \
		--package-name $(notdir $(basename $@)) \
		--package-version 0.0.0 \

generated/%: out/%
	rm -rf $@
	mv $< $@

	npm install --workspace $(notdir $(basename $@))
	npm run build --workspace $(notdir $(basename $@))

.PHONY: \
	build \
	rebuild \
	clean \
