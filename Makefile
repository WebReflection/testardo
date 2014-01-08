.PHONY: build clean node

# repository name
REPO = testardo

# make node files
NODE =  src/env\
        src/NL\
        LICENSE.txt\
        src/NL\
        src/client/old-ie-timers.js\
        src/NL\
        src/client/main.js\
        src/NL\
        src/server-a.js\
        src/NL\
        src/server/how-to.js\
        src/NL\
        src/server/args.js\
        src/NL\
        src/server/main.js\
        src/NL\
        src/server-z.js

# default build task
build:
	make clean
	make node

# build node.js version
node:
	mkdir -p build
	cat $(NODE) >build/$(REPO)
	chmod +x build/$(REPO)

# clean/remove build folder
clean:
	rm -rf build


