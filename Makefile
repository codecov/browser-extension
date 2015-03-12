.PHONY: build

build:
	zip -r ./builds/codecov.zip . -x ".*" -x "*/.*" -x "node_modules/*" -x "builds/*"
	open -a "Google Chrome" https://chrome.google.com/webstore/developer/edit/keefkhehidemnokodkdkejapdgfjmijf

dev:
	mkdir node_modules
	npm install

tag:
	git tag -a v$(shell cat manifest.json | underscore extract version) -m ""
	git push origin v$(shell cat manifest.json | underscore extract version)
