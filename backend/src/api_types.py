from typing import Any

from pydantic import BaseModel, Field


class TextFSMParseInput(BaseModel):
    """Input data for TextFSM parsing."""

    template_string: str = Field(..., min_length=1, description="TextFSM template content")
    data_string: str = Field(..., description="Raw text data to parse")


class TextFSMParseResult(BaseModel):
    """Result of successful TextFSM parsing."""

    message: str
    header: list[str]
    results: list[dict[str, Any]]


class TextFSMParseError(BaseModel):
    """Error details from TextFSM parsing failure."""

    reason: str
    message: str


class TextFSMParseAPIRequest(BaseModel):
    """API request for TextFSM parsing."""

    data: TextFSMParseInput


class TextFSMParseAPIError(BaseModel):
    """API error response structure."""

    status: str
    reason: str
    message: str


class TextFSMParseAPIResponse(BaseModel):
    """API response for TextFSM parsing."""

    ok: bool
    status: str
    code: int
    data: TextFSMParseResult | None = None
    errors: list[TextFSMParseAPIError] | None = None


class TemplateInfo(BaseModel):
    """NTC template information."""

    template: str
    hostname: str
    platform: str
    command_raw: str
    command_regex: str
