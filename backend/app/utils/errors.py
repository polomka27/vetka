from flask import jsonify


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code: str = "bad_request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

    def to_response(self):
        return (
            jsonify(
                {
                    "error": {
                        "code": self.error_code,
                        "message": self.message,
                    }
                }
            ),
            self.status_code,
        )
