from datetime import datetime

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    patient_id: str
    body: str = Field(min_length=1, max_length=8000)


class Note(NoteCreate):
    id: str
    author_id: str
    created_at: datetime
    updated_at: datetime
