#!/usr/bin/env python3
"""Generate rustic wooden bridge road art assets via Gemini AI Studio REST API.

Uses zero external third-party packages (Python standard library only) so it
runs safely inside GitHub Actions without dependency installs or secret leaks.
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_MODELS = (
    "gemini-3.1-flash-lite-image",
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image-preview",
)

DEFAULT_REFS = (
    "docs/asset_samples/rustic_master_straight_01_v2.jpg",
    "docs/asset_samples/rustic_master_straight_02_v2.jpg",
)

DEFAULT_PROMPT = (
    "Create an isolated 2.5D orthographic wooden plank bridge asset on a pure solid #FFFFFF background "
    "with generous white margins on all 4 sides.\n\n"
    "IMAGE 1 (CAMERA / ANGLE / PERSPECTIVE LOCK — MUST MATCH IDENTICALLY):\n"
    "- Match the exact steeper top-down camera elevation, diagonal bridge axis (~25 deg below horizontal, upper-left to lower-right), "
    "and plank surface visibility of Image 1.\n"
    "- STRICT ORTHOGRAPHIC PROJECTION: Maintain an exact 1.0x uniform, parallel deck width from the upper-left end "
    "all the way to the lower-right end (ZERO pinhole vanishing-point narrowing at top-left or widening at bottom-right, "
    "and keep every plank's foreshortening height consistent end-to-end).\n"
    "- Completely flush underside runner beam with ZERO vertical posts and ZERO drop-down foot blocks on either end.\n\n"
    "IMAGE 2 (WOOD VARIETY & RUSTIC PROPS — TRANSFER ONTO IMAGE 1'S VIEWPOINT):\n"
    "- 16 rustic wooden planks with alternating warm honey oak, golden amber, and reddish-cedar tones.\n"
    "- Include visibly crooked/skewed planks (+/- 4 to 8 deg), plank-to-plank interference/overlapping wedges, "
    "dramatically staggered uneven board ends protruding along both sides, crisp #3d2210 dark sepia ink outlines.\n"
    "- Include ONE nailed wooden repair patch board resting overlapping across two middle cracked planks, "
    "ONE thick coiled hemp rope wrapping tightly around 2-3 planks in the upper-left third with dangling frayed tails, "
    "dry golden straw wisps poking through crevices, and 2-3 small warm autumn leaves.\n"
    "- Leave clean unobstructed opposite-diagonal plank gaps every 3-5 planks (away from the rope and patch) for modular slicing."
)


def encode_reference_part(path: Path) -> dict:
    """Read an image file and return a Gemini API inlineData part dict."""
    mime_type, _ = mimetypes.guess_type(str(path))
    if not mime_type:
        mime_type = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    raw = path.read_bytes()
    return {
        "inlineData": {
            "mimeType": mime_type,
            "data": base64.b64encode(raw).decode("ascii"),
        }
    }


def list_models_on_key(api_key: str) -> list[dict]:
    """Query official Gemini API ListModels endpoint to inspect models enabled on this key."""
    url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={"x-goog-api-key": api_key},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data.get("models", [])
    except Exception as exc:
        print(f"ListModels check failed: {exc}", file=sys.stderr)
        return []


def extract_image_bytes(resp_json: dict) -> tuple[bytes, str, str]:
    """Extract the first generated inlineData image and any text caption from response JSON."""
    text_notes: list[str] = []
    for cand in resp_json.get("candidates", []):
        content = cand.get("content") or {}
        for part in content.get("parts", []):
            if "text" in part:
                text_notes.append(part["text"])
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                img_bytes = base64.b64decode(inline["data"])
                return img_bytes, mime, "\n".join(text_notes).strip()
    raise RuntimeError(f"No inline image data returned in response: {text_notes or list(resp_json.keys())}")


def call_gemini_generate(
    api_key: str,
    model: str,
    parts: list[dict],
    aspect_ratio: str,
    include_image_config: bool = True,
) -> tuple[bytes, str, str]:
    """Call Gemini AI Studio generateContent REST endpoint safely (key sent only via header)."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    gen_cfg: dict = {"responseModalities": ["TEXT", "IMAGE"]}
    if include_image_config and aspect_ratio:
        gen_cfg["imageConfig"] = {"aspectRatio": aspect_ratio}

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": gen_cfg,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return extract_image_bytes(data)


def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is empty.", file=sys.stderr)
        return 1

    requested_model = os.environ.get("INPUT_MODEL", "auto").strip()
    aspect_ratio = os.environ.get("INPUT_ASPECT_RATIO", "16:9").strip() or "16:9"
    output_stem = os.environ.get("INPUT_OUTPUT_STEM", "rustic_master_straight_02_v3").strip()
    output_dir = Path(os.environ.get("INPUT_OUTPUT_DIR", "docs/asset_samples"))
    refs_env = os.environ.get("INPUT_REFS", "").strip()
    prompt_text = os.environ.get("INPUT_PROMPT", "").strip() or DEFAULT_PROMPT

    ref_paths = (
        [Path(p.strip()) for p in refs_env.split(",") if p.strip()]
        if refs_env
        else [Path(p) for p in DEFAULT_REFS]
    )

    parts: list[dict] = []
    for rp in ref_paths:
        if not rp.is_file():
            print(f"Error: missing reference image {rp}", file=sys.stderr)
            return 1
        parts.append(encode_reference_part(rp))
    parts.append({"text": prompt_text})

    candidates = (
        DEFAULT_MODELS
        if not requested_model or requested_model == "auto"
        else (requested_model,)
    )

    had_quota_error = False
    for model in candidates:
        print(f"Trying Gemini AI Studio model: {model}")
        for use_img_cfg in (True, False):
            try:
                img_bytes, mime, notes = call_gemini_generate(
                    api_key, model, parts, aspect_ratio, include_image_config=use_img_cfg
                )
            except urllib.error.HTTPError as err:
                err_body = err.read().decode("utf-8", errors="replace")[:500]
                print(f"HTTP {err.code} from {model} (imageConfig={use_img_cfg}): {err_body}", file=sys.stderr)
                if err.code in (401, 403):
                    return 2
                if err.code == 429:
                    had_quota_error = True
                    # Do not retry this model; check next distinct model if in 'auto' mode.
                    break
                if err.code == 400 and use_img_cfg and ("imageConfig" in err_body or "aspect" in err_body.lower()):
                    continue
                if err.code in (400, 404):
                    break
                return 3

            ext = ".png" if "png" in mime.lower() else ".jpg"
            output_dir.mkdir(parents=True, exist_ok=True)
            out_path = output_dir / f"{output_stem}{ext}"
            out_path.write_bytes(img_bytes)
            print(f"Generated: {out_path} ({len(img_bytes)} bytes, mime={mime}, model={model})")
            if notes:
                print(f"Model notes: {notes[:300]}")

            gh_out = os.environ.get("GITHUB_OUTPUT")
            if gh_out:
                with open(gh_out, "a", encoding="utf-8") as fh:
                    fh.write(f"output_path={out_path}\n")
                    fh.write(f"used_model={model}\n")
            return 0

    print("Listing models available on this API key for diagnostics:")
    for m in list_models_on_key(api_key):
        m_name = m.get("name", "")
        methods = m.get("supportedGenerationMethods", [])
        if any(k in m_name.lower() for k in ("flash", "image", "imagen")):
            print(f"  - {m_name} (methods={methods})")

    print("Error: no candidate model succeeded.", file=sys.stderr)
    return 2 if had_quota_error else 4


if __name__ == "__main__":
    raise SystemExit(main())
