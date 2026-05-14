from fastapi import FastAPI

# Initialize FastAPI.
# We explicitly configure the docs path to sit behind your /api/ prefix.
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")


@app.get("/api/hello")
def hello_world():
    return {"message": "Hello from FastAPI on Vercel!"}

# Example of a dynamic route with type validation


@app.get("/api/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "status": "Success"}
