npm-shrinkwrap.json: package-lock.json tools/build-shrinkwrap.js
	tools/build-shrinkwrap.js > $@

clean:
	rm -f npm-shrinkwrap.json

.PHONY: clean
