deploy:
	cd frontend && npm install && npm run build
	cd backend && npm install && npm start

.PHONY: deploy
