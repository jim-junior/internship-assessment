.PHONY: api


api: # Start the FastAPI server
	uvicorn api.index:app --reload --port 8000