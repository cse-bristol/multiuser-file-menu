.PHONY: watch build clean

build: ; npm install; mkdir -p bin; browserify -d demo.js -o bin/demo.js; browserify -d iframe-noscroll-demo.js -o bin/iframe-noscroll-demo.js;
watch: ; mkdir -p bin; watchify -d demo.js -o bin/demo.js;
clean: ; rm -rf ./bin/*
