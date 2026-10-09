from fastapi import FastAPI

app = FastAPI(title="El Marché recommender")


@app.get("/health")
def health():
    return {"status": "ok"}