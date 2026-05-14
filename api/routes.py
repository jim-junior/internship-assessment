import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from .audio_util import validate_audio_length

from .sunbird_client import SunbirdAPIClient
from .schemas import (
    PipelineResponse,
    PipelineTextRequest,
    STTResponse,
    SummariseRequest,
    SummariseResponse,
    TTSRequest,
    TTSResponse,
    TranslateRequest,
    TranslateResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pipeline"])

SUPPORTED_LANGUAGES = {"Luganda", "Acholi", "Ateso", "Runyankole", "Lugbara"}
SUPPORTED_AUDIO_TYPES = {"audio/mpeg", "audio/wav",
                         "audio/mp4", "audio/ogg", "audio/webm"}


def get_client() -> SunbirdAPIClient:
    """FastAPI dependency that provides a SunbirdAPIClient."""
    return SunbirdAPIClient()


def validate_language(language: str) -> None:
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported language '{language}'. "
            f"Choose from: {', '.join(sorted(SUPPORTED_LANGUAGES))}",
        )


def handle_client_error(exc: Exception, context: str) -> None:
    """Converts upstream errors into clean HTTP responses."""
    logger.error("%s failed: %s", context, exc)
    raise HTTPException(status_code=502, detail=f"{context} failed: {exc}")


@router.post(
    "/transcribe",
    response_model=STTResponse,
    summary="Transcribe an audio file to text",
)
async def transcribe(
    audio: UploadFile = File(...,
                             description="Audio file (.mp3, .wav, .m4a, .ogg)"),
    client: SunbirdAPIClient = Depends(get_client),
):
    """
    Accepts an audio file and returns the transcribed text using
    Sunbird's Speech-to-Text API.
    """
    if audio.content_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported audio type '{audio.content_type}'. "
            f"Accepted: {', '.join(SUPPORTED_AUDIO_TYPES)}",
        )

    await validate_audio_length(audio, max_minutes=5)
    try:
        transcription = client.speech_to_text(audio)
        return STTResponse(transcription=transcription)
    except Exception as exc:
        handle_client_error(exc, "Transcription")


@router.post(
    "/summarise",
    response_model=SummariseResponse,
    summary="Summarise text using the Sunflower LLM",
)
async def summarise(
    body: SummariseRequest,
    client: SunbirdAPIClient = Depends(get_client),
):
    """
    Takes plain text and returns a concise summary produced by
    the Sunflower LLM.
    """
    try:
        summary = client.summarize_text(body.text)
        return SummariseResponse(summary=summary)
    except Exception as exc:
        handle_client_error(exc, "Summarisation")


@router.post(
    "/translate",
    response_model=TranslateResponse,
    summary="Translate text into a Ugandan language",
)
async def translate(
    body: TranslateRequest,
    client: SunbirdAPIClient = Depends(get_client),
):
    """
    Translates the given text into one of the supported Ugandan languages
    (Luganda, Acholi, Ateso, Runyankole, Lugbara).
    """
    validate_language(body.language)
    try:
        result = client.translate_text(body.text, body.language)
        # The Sunflower endpoint returns the full response dict;
        # extract the generated text from wherever the model puts it.

        return TranslateResponse(translation=result)
    except Exception as exc:
        handle_client_error(exc, "Translation")


@router.post(
    "/tts",
    response_model=TTSResponse,
    summary="Convert text to speech",
)
async def text_to_speech(
    body: TTSRequest,
    client: SunbirdAPIClient = Depends(get_client),
):
    """
    Synthesises speech from the given text in the specified Ugandan language
    and returns a URL to the generated audio file.
    """
    validate_language(body.language)
    try:
        audio_url = client.text_to_speech(body.text, body.language)
        return TTSResponse(audio_url=audio_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        handle_client_error(exc, "Text-to-speech")


@router.post(
    "/pipeline/text",
    response_model=PipelineResponse,
    summary="Run the full pipeline from text input",
)
async def pipeline_from_text(
    body: PipelineTextRequest,
    client: SunbirdAPIClient = Depends(get_client),
):
    """
    Convenience endpoint that runs all three steps (summarise → translate → TTS)
    in a single request when the input is already text.
    """
    validate_language(body.language)
    try:
        summary = client.summarize_text(body.text)
    except Exception as exc:
        handle_client_error(exc, "Summarisation")

    try:
        result = client.translate_text(summary, body.language)
        translation = (
            result.get("output", {}).get("text")
            or result.get("generated_text")
            or str(result)
        )
    except Exception as exc:
        handle_client_error(exc, "Translation")

    try:
        audio_url = client.text_to_speech(translation, body.language)
    except Exception as exc:
        handle_client_error(exc, "Text-to-speech")

    return PipelineResponse(
        original_text=body.text,
        summary=summary,
        translation=translation,
        audio_url=audio_url,
    )


@router.post(
    "/pipeline/audio",
    response_model=PipelineResponse,
    summary="Run the full pipeline from an audio file",
)
async def pipeline_from_audio(
    language: str,
    audio: UploadFile = File(...),
    client: SunbirdAPIClient = Depends(get_client),
):
    """
    Convenience endpoint that runs all four steps
    (transcribe → summarise → translate → TTS) in a single request
    when the input is an audio file.
    """
    validate_language(language)

    if audio.content_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported audio type '{audio.content_type}'.",
        )

    try:
        original_text = client.speech_to_text(audio)
    except Exception as exc:
        handle_client_error(exc, "Transcription")

    try:
        summary = client.summarize_text(original_text)
    except Exception as exc:
        handle_client_error(exc, "Summarisation")

    try:
        result = client.translate_text(summary, language)
        translation = (
            result.get("output", {}).get("text")
            or result.get("generated_text")
            or str(result)
        )
    except Exception as exc:
        handle_client_error(exc, "Translation")

    try:
        audio_url = client.text_to_speech(translation, language)
    except Exception as exc:
        handle_client_error(exc, "Text-to-speech")

    return PipelineResponse(
        original_text=original_text,
        summary=summary,
        translation=translation,
        audio_url=audio_url,
    )
