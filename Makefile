.PHONY: api


api: # Start the FastAPI server
	uvicorn api.index:app --reload --port 8000

ui: # Start the Next.js development server
	npm run dev

start: # Start both API and UI concurrently
	$(MAKE) -j2 api ui