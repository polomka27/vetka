from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required

from ..extensions import limiter
from ..schemas.auth import (
    serialize_auth_response,
    serialize_user,
    validate_login_payload,
    validate_profile_payload,
    validate_register_payload,
)
from ..services.auth_service import AuthService


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
@limiter.limit("5 per minute")
def register():
    payload = validate_register_payload(request.get_json(silent=True))
    user, access_token = AuthService.register_user(**payload)

    return jsonify(serialize_auth_response(user, access_token)), 201


@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    payload = validate_login_payload(request.get_json(silent=True))
    user, access_token = AuthService.login_user(**payload)

    return jsonify(serialize_auth_response(user, access_token)), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify({"user": serialize_user(current_user)}), 200


@auth_bp.patch("/me/profile")
@jwt_required()
def update_profile():
    payload = validate_profile_payload(request.get_json(silent=True))
    user = AuthService.update_user_profile(user=current_user, data=payload)

    return jsonify({"user": serialize_user(user)}), 200
