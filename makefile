build:
	cd backend && npm install
	cd frontend && npm install && npm run build

run:
	cd backend && npm start

# proceed with caution with this target
# might break terminal (requires two ^C)
# might keep a process running on 8080 or 5173
# if this doesn't work, npm run dev in both the
# frontend and backend in seperate terminals
run-dev:
	cd backend && npm run dev & \
	cd frontend && npm run dev & \
	wait

.PHONY: build run run-dev
