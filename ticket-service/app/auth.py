from fastapi import Header, HTTPException
from jose import jwt, JWTError

from app.config import settings


class CurrentUser:
    def __init__(self, user_id: str, role: str):
        self.user_id = user_id
        self.role = role


def get_current_user(authorization: str = Header(...)) -> CurrentUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return CurrentUser(user_id=payload["sub"], role=payload["role"])