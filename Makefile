SHELL := /bin/bash

NVM_CMD := export NVM_DIR="$(HOME)/.nvm"; . "$$NVM_DIR/nvm.sh"; nvm use >/dev/null

.PHONY: install dev build copy-to-applications print-dist-app

install:
	@$(NVM_CMD); yarn

dev:
	@$(NVM_CMD); yarn build:dev && yarn start

build:
	@rm -rf dist
	@$(NVM_CMD); yarn build:prod && yarn package

copy-to-applications:
	@DIST_APP="$$(find dist -mindepth 2 -maxdepth 2 -type d -name 'GitHub Desktop.app' -print -quit)"; \
	if [ -z "$$DIST_APP" ]; then \
		echo "Couldn't find built app under dist/*/GitHub Desktop.app"; \
		exit 1; \
	fi; \
	osascript -e 'quit app "GitHub Desktop"' >/dev/null 2>&1 || true; \
	echo "Copying $$DIST_APP to /Applications/GitHub Desktop.app"; \
	ditto "$$DIST_APP" "/Applications/GitHub Desktop.app"

print-dist-app:
	@DIST_APP="$$(find dist -mindepth 2 -maxdepth 2 -type d -name 'GitHub Desktop.app' -print -quit)"; \
	if [ -z "$$DIST_APP" ]; then \
		echo "No built app found"; \
		exit 1; \
	fi; \
	echo "$$DIST_APP"
