build:
	cd backend && npm install
	cd frontend && npm install && npm run build

run:
	cd backend && npm start

.PHONY: build run
