PREFIX ?= /usr/local

build:
	swift build -c release

install: build
	install -d $(PREFIX)/bin
	install .build/release/pg9666h $(PREFIX)/bin/pg9666h

run: build
	.build/release/pg9666h run

clean:
	swift package clean

.PHONY: build install run clean
