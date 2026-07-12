PREFIX ?= /usr/local
BUILDDIR = build

# Compiles with swiftc directly so only the Xcode Command Line Tools are
# needed. `swift build` requires full Xcode for the SwiftPM manifest
# libraries; Package.swift is kept for people who have it.
build:
	mkdir -p $(BUILDDIR)
	swiftc -O Sources/pg9666h/*.swift -o $(BUILDDIR)/pg9666h

install: build
	install -d $(PREFIX)/bin
	install $(BUILDDIR)/pg9666h $(PREFIX)/bin/pg9666h

run: build
	$(BUILDDIR)/pg9666h run

clean:
	rm -rf $(BUILDDIR) .build

.PHONY: build install run clean
