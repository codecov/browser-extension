.PHONY: build
	
build:
	zip -r ./builds/codecov.zip . -x ".*" -x "*/.*" -x "node_modules/*" -x "builds/*"
	chrome https://chrome.google.com/webstore/developer/dashboard/g16141306515524943109

dev:
	mkdir node_modules
	npm install
