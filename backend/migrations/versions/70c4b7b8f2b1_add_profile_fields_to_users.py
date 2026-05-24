"""add profile fields to users

Revision ID: 70c4b7b8f2b1
Revises: 2b7d6d8d9a10
Create Date: 2026-04-08 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "70c4b7b8f2b1"
down_revision = "2b7d6d8d9a10"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        # Блок добавляет в таблицу пользователей поля редактируемого профиля.
        batch_op.add_column(sa.Column("profile_nickname", sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column("profile_profession", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("profile_social_links", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("profile_bio", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("profile_avatar_url", sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        # Блок удаляет поля профиля при откате миграции.
        batch_op.drop_column("profile_avatar_url")
        batch_op.drop_column("profile_bio")
        batch_op.drop_column("profile_social_links")
        batch_op.drop_column("profile_profession")
        batch_op.drop_column("profile_nickname")
