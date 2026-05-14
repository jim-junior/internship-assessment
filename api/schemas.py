from pydantic import BaseModel, Field


class SummariseRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to summarise")


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to translate")
    language: str = Field(..., description="Target Ugandan language")


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1,
                      description="Text to convert to speech")
    language: str = Field(..., description="Target Ugandan language")


class SummariseResponse(BaseModel):
    summary: str


class TranslateResponse(BaseModel):
    translation: str


class STTResponse(BaseModel):
    transcription: str


class TTSResponse(BaseModel):
    audio_url: str


# ── Full pipeline (convenience) ────────────────────────────────────────────────

class PipelineTextRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(..., description="Target Ugandan language")


class PipelineResponse(BaseModel):
    original_text: str
    summary: str
    translation: str
    audio_url: str
