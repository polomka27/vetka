from sqlalchemy import DateTime, Enum, String, Text, func

from ..extensions import db


user_role_enum = Enum("user", "admin", name="user_role", native_enum=False)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(String(80), unique=True, nullable=False, index=True)
    email = db.Column(String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(String(255), nullable=False)
    role = db.Column(
        user_role_enum,
        nullable=False,
        default="user",
        server_default="user",
    )
    profile_nickname = db.Column(String(80), nullable=True)
    profile_profession = db.Column(String(120), nullable=True)
    profile_social_links = db.Column(Text, nullable=True)
    profile_bio = db.Column(Text, nullable=True)
    profile_avatar_url = db.Column(Text, nullable=True)
    created_at = db.Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    roadmaps = db.relationship(
        "Roadmap",
        back_populates="author",
        lazy="select",
    )
    node_progress = db.relationship(
        "UserNodeProgress",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} role={self.role!r}>"
