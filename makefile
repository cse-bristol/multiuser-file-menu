.PHONY: build npm js css clean tests watch;

build: js css;

js: npm bin; browserify -d demo.js -o bin/demo.js;
bin: ; mkdir -p bin;
npm: ; npm install;

css: bin; cat css/* > bin/style.css;

tests: ; browserify -d iframe-noscroll-demo.js -o bin/iframe-noscroll-demo.js;

clean: ; rm -rf bin;

watch: bin; mkdir -p bin; watchify -d demo.js -o bin/demo.js & catw css/* -o bin/style.css -v;
