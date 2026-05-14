import os
import tempfile
import shutil
from fastapi import UploadFile, HTTPException
from mutagen import File as MutagenFile


async def validate_audio_length(audio: UploadFile, max_minutes: int = 5):
    """
    Checks if an uploaded audio file exceeds the maximum allowed length.
    Raises an HTTP 413 error if it's too long.
    """
    max_seconds = max_minutes * 60
    # max_seconds = 10

    # 1. Extract the extension to help mutagen identify the format
    _, ext = os.path.splitext(audio.filename)

    # 2. Save securely to a temporary file. Mutagen needs a real file path
    # to read metadata reliably for formats like .m4a and .ogg.
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    try:
        # 3. Read the metadata
        audio_meta = MutagenFile(tmp_path)

        if audio_meta is None or not hasattr(audio_meta, 'info'):
            raise HTTPException(
                status_code=400,
                detail="Could not read audio metadata. The file might be corrupted."
            )

        duration_seconds = audio_meta.info.length

        # 4. Check the length
        if duration_seconds > max_seconds:
            duration_minutes = duration_seconds / 60
            raise HTTPException(
                status_code=413,  # 413: Payload Too Large
                detail=f"Audio file is too long ({duration_minutes:.1f} minutes). Maximum allowed is {max_minutes} minutes."
            )

    finally:
        # 5. Clean up the temp file from your server
        os.remove(tmp_path)

        # 6. CRITICAL: Reset the cursor of the original UploadFile to the beginning!
        # If you don't do this, client.speech_to_text() will send an empty file.
        await audio.seek(0)
