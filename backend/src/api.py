import re
from pathlib import Path

import ntc_templates
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

from src.api_types import (
    TemplateInfo,
    TextFSMParseAPIError,
    TextFSMParseAPIRequest,
    TextFSMParseAPIResponse,
)
from src.config import get_settings
from src.my_logger import logger
from src.parse import parse_text

router = APIRouter()

# Pre-compiled regex for template name validation
# Only allow alphanumeric characters, underscores, hyphens, and dots
TEMPLATE_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.]+\.textfsm$")


@router.post("/parse", response_model=TextFSMParseAPIResponse)
def parse(request: TextFSMParseAPIRequest):
    settings = get_settings()
    if (
        len(request.data.template_string) > settings.max_template_length
        or len(request.data.data_string) > settings.max_data_length
    ):
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Payload too large",
        )
    try:
        result = parse_text(request.data)
    except HTTPException:
        # Re-raise HTTPException without wrapping
        raise
    except Exception as err:
        logger.error(f"Error parsing text: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

    if result.is_ok() and result.value:
        return TextFSMParseAPIResponse(
            ok=True,
            status="OK",
            code=status.HTTP_200_OK,
            data=result.value,
        )
    elif result.is_err() and result.error:
        return TextFSMParseAPIResponse(
            ok=False,
            status="Bad Request",
            code=status.HTTP_400_BAD_REQUEST,
            errors=[
                TextFSMParseAPIError(
                    status="ParseError",
                    reason=result.error.reason,
                    message=result.error.message,
                )
            ],
        )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Internal Server Error",
    )


@router.get("/ntc-templates", response_model=list[TemplateInfo])
async def get_ntc_templates():
    settings = get_settings()
    try:
        return FileResponse(
            settings.public_dir.joinpath("ntc-templates-info.json"),
            media_type="application/json",
        )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error getting NTC templates: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )


@router.get("/ntc-templates/{template_name}")
async def get_ntc_template(template_name: str):
    # Validate template name format to prevent path traversal
    if not TEMPLATE_NAME_PATTERN.match(template_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid template name format",
        )

    # Additional check for path traversal attempts
    if ".." in template_name or "/" in template_name or "\\" in template_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid template name",
        )

    try:
        base_templates_path = (
            Path(ntc_templates.__file__).parent.joinpath("templates").resolve()
        )
        template_path = base_templates_path.joinpath(template_name).resolve()

        # Verify the resolved path is still within the base templates directory
        if not template_path.is_relative_to(base_templates_path):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden path"
            )

        if not template_path.exists():
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "message": "Template not found.",
                    "template_name": template_name,
                },
            )
        return FileResponse(
            template_path,
            media_type="text/plain",
        )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error getting NTC template: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )
