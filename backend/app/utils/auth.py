from flask import jsonify


def build_error_response(message: str, status_code: int, error_code: str):
    return (
        jsonify(
            {
                "error": {
                    "code": error_code,
                    "message": message,
                }
            }
        ),
        status_code,
    )
